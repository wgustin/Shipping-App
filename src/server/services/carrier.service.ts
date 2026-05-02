import { serverConfig } from "../config";
import { db } from "../firebaseAdmin";
import { 
  EhubRateResponse, 
  EhubServiceRate, 
  EhubFulfillmentResponse,
  Address,
  Rate,
  PackageDetails,
  Shipment
} from "../../shared/types";
import { getWeightInOunces, formatAddressForEhub } from "../../shared/utils/formatters";
import crypto from "crypto";

const EHUB_BASE_URL = "https://api.ehub.com/api/v2";

/**
 * Utility to fetch with retries for transient errors
 */
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3, 
  baseDelay = 1000,
  requestId?: string
): Promise<Response> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      // If successful or a client error (4xx) that shouldn't be retried
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        clearTimeout(timeout);
        return response;
      }
      
      // If rate limited (429) or server error (5xx), consider retrying
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt);
      
      console.warn(`[${requestId || 'API'}] ⚠️ Attempt ${attempt + 1} failed with status ${response.status}. Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (err: any) {
      lastError = err;
      if (err.name === 'AbortError') {
        console.warn(`[${requestId || 'API'}] ⚠️ Attempt ${attempt + 1} timed out.`);
      } else {
        console.warn(`[${requestId || 'API'}] ⚠️ Attempt ${attempt + 1} network error:`, err.message);
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    } finally {
      clearTimeout(timeout);
    }
  }
  
  throw lastError || new Error(`Failed after ${maxRetries} attempts`);
}

/**
 * Validates shipment data before sending to carrier
 */
function validateShipmentData(shipment: any) {
  const { fromAddress, toAddress, packageDetails } = shipment;
  
  if (!fromAddress?.city || !fromAddress?.state || !fromAddress?.zip) {
    throw new Error("Invalid origin address: City, State, and Zip are required.");
  }
  
  if (!toAddress?.city || !toAddress?.state || !toAddress?.zip) {
    throw new Error("Invalid destination address: City, State, and Zip are required.");
  }
  
  if (!packageDetails?.weight || packageDetails.weight <= 0) {
    throw new Error("Invalid package weight: Must be greater than 0.");
  }
  
  if (!packageDetails?.length || !packageDetails?.width || !packageDetails?.height) {
    throw new Error("Invalid package dimensions: Length, Width, and Height are required.");
  }

  // Basic Girth check (USPS rule: Length + Girth <= 108 or 130 depending on service)
  const length = Number(packageDetails.length);
  const width = Number(packageDetails.width);
  const height = Number(packageDetails.height);
  const girth = (width + height) * 2;
  const total = length + girth;
  
  if (total > 130) {
    throw new Error(`Package is too large (Length + Girth = ${total.toFixed(1)}"). Maximum allowed is 130".`);
  }
}

export async function fetchEhubRates(payload: any, requestId?: string): Promise<EhubRateResponse> {
  const EHUB_API_KEY = serverConfig.EHUB_API_KEY;
  if (!EHUB_API_KEY) {
    throw new Error("Carrier API key not configured");
  }

  try {
    const response = await fetchWithRetry(`${EHUB_BASE_URL}/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EHUB_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    }, 3, 1000, requestId || 'getRates');

    const responseText = await response.text();
    let data: any = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.warn(`[getRates] Non-JSON response:`, responseText);
      }
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) || "Carrier API Error";
      const err = new Error(errorMessage) as any;
      err.status = response.status;
      err.details = data;
      throw err;
    }

    return data as EhubRateResponse;
  } catch (err: any) {
    console.error(`[getRates] ❌ Error fetching rates:`, err.message);
    throw err;
  }
}

export async function fulfillShipment(shipmentId: string, shipmentDetails: any, eventId?: string, userId?: string, clientLabelFormat?: string, clientLabelSize?: string): Promise<any> {
  const requestId = eventId || `fulfill-${shipmentId}-${Date.now()}`;
  console.log(`[${requestId}] 🚀 Fulfilling shipment ${shipmentId}...`);

  const shipment = shipmentDetails;

  // 1. Validation
  try {
    validateShipmentData(shipment);
  } catch (err: any) {
    console.error(`[${requestId}] ❌ Validation failed:`, err.message);
    throw err;
  }

  if (shipment.status === 'shipped' || shipment.status === 'delivered') {
    console.log(`[${requestId}] ⚠️ Shipment ${shipmentId} already fulfilled.`);
    return shipment;
  }

  // If already processing and has a carrier ID, try to refresh status instead of creating a new one
  if (shipment.status === 'processing' && shipment.packageDetails?.carrierId) {
    console.log(`[${requestId}] 🔄 Shipment ${shipmentId} is processing with carrierId ${shipment.packageDetails.carrierId}. Fetching status...`);
    return await refreshShipmentStatus(shipmentId, shipment.packageDetails.carrierId, requestId, shipmentDetails);
  }

  // Use client-provided label preferences or defaults
  let labelFormat = clientLabelFormat ? clientLabelFormat.toLowerCase() : "pdf";
  let paperSize = clientLabelSize || "4x6"; // Used for frontend rendering logic later
  let labelSize = "4x6"; // eHub expects 4x6 for both 4x6 and 8.5x11 paper sizes when generating the actual label

  // 2. Prepare eHub payload
  const from = shipment.fromAddress;
  const to = shipment.toAddress;
  const rate = shipment.selectedRate;
  const pkg = shipment.packageDetails;

  const ehubPayload = {
    shipment: {
      from_location: formatAddressForEhub(from),
      to_location: formatAddressForEhub(to),
      parcels: [
        {
          length: pkg.length,
          width: pkg.width,
          height: pkg.height,
          weight: getWeightInOunces(pkg.weight, pkg.weightUnit),
          package_type: pkg.package_type || "parcel"
        }
      ],
      service_id: !isNaN(Number(rate.id)) ? Number(rate.id) : rate.id,
      label_format: labelFormat,
      label_size: labelSize
    }
  };

  console.log(`[${requestId}] 📦 eHub Fulfillment Payload:`, JSON.stringify(ehubPayload, null, 2));

  // 3. Call eHub API
  const EHUB_API_KEY = serverConfig.EHUB_API_KEY;
  
  try {
    const response = await fetchWithRetry(`${EHUB_BASE_URL}/shipments/ship`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EHUB_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(ehubPayload)
    }, 3, 1000, requestId);

    const responseText = await response.text();
    let rawData;
    try {
      rawData = JSON.parse(responseText);
    } catch (e) {
      console.error(`[${requestId}] ❌ eHub Fulfillment API Error (Non-JSON):`, responseText);
      throw new Error(`Carrier API returned invalid response: ${responseText.substring(0, 100)}`);
    }
    
    console.log(`[${requestId}] 📥 eHub Fulfillment Response:`, JSON.stringify(rawData, null, 2));
    
    const ehubData = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!response.ok) {
      console.error(`[${requestId}] ❌ eHub Fulfillment API Error:`, {
        status: response.status,
        data: ehubData
      });
      
      // Extract a more descriptive error message
      let errorMsg = ehubData.message || ehubData.error;
      
      // Check for nested errors if available
      if (!errorMsg && (ehubData as any).errors) {
        const nestedErrors = (ehubData as any).errors;
        errorMsg = Array.isArray(nestedErrors) ? nestedErrors.join(', ') : String(nestedErrors);
      }
      
      if (!errorMsg) {
        errorMsg = `Carrier fulfillment failed with status ${response.status}`;
      }
      
      throw new Error(errorMsg);
    }

    console.log(`[${requestId}] ✅ eHub Fulfillment successful. Finalizing...`);
    // 4. Finalize shipment in DB
    return await finalizeShipment(shipmentId, ehubData, requestId, shipmentDetails, labelFormat, paperSize);
  } catch (err: any) {
    console.error(`[${requestId}] ❌ Fulfillment failed:`, err.message);
    throw err;
  }
}

/**
 * Fetches the current status of a shipment from eHub
 */
export async function refreshShipmentStatus(shipmentId: string, carrierId: string, requestId: string, shipmentDetails: any): Promise<any> {
  const EHUB_API_KEY = serverConfig.EHUB_API_KEY;
  
  try {
    const response = await fetchWithRetry(`${EHUB_BASE_URL}/shipments/${carrierId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${EHUB_API_KEY}`,
        'Accept': 'application/json'
      }
    }, 3, 1000, requestId);

    const responseText = await response.text();
    let rawData: any = {};
    if (responseText) {
      try {
        rawData = JSON.parse(responseText);
      } catch (e) {
        console.warn(`[${requestId}] ⚠️ Non-JSON response for status:`, responseText);
      }
    }

    const ehubData = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!response.ok) {
      console.warn(`[${requestId}] ⚠️ Failed to fetch shipment status for ${carrierId}:`, ehubData);
      return shipmentDetails;
    }

    return await finalizeShipment(shipmentId, ehubData, requestId, shipmentDetails);
  } catch (err) {
    console.error(`[${requestId}] ❌ Error refreshing shipment status:`, err);
    return shipmentDetails;
  }
}

async function finalizeShipment(
  shipmentId: string, 
  ehubData: any, 
  requestId: string,
  shipmentDetails: any,
  labelFormat?: string,
  paperSize?: string
): Promise<any> {
  // Handle potential nested shipment object or array
  const shipment = ehubData.shipment || (Array.isArray(ehubData) ? ehubData[0] : ehubData);
  const parcels = shipment.parcels || ehubData.parcels || [];
  const firstParcel = Array.isArray(parcels) ? parcels[0] : parcels;

  const trackingNumber = ehubData.tracking_number || 
                        shipment.tracking_number || 
                        firstParcel?.tracking_number ||
                        ehubData.trackingNumber ||
                        shipment.trackingNumber ||
                        firstParcel?.trackingNumber;
  
  const labelUrl = ehubData.label_url || 
                  shipment.label_url || 
                  shipment.postage_label?.label_url || 
                  shipment.postage_label?.image_url ||
                  firstParcel?.label_url ||
                  firstParcel?.postage_label?.label_url ||
                  firstParcel?.postage_label?.image_url;

  const carrierId = ehubData.id || ehubData.shipment_id || shipment.id || shipment.shipment_id;

  if (!trackingNumber && !carrierId) {
    console.error(`[${requestId}] ❌ Carrier response missing both tracking number and carrier ID:`, ehubData);
    throw new Error("Carrier response missing tracking number and carrier ID");
  }

  const currentShipment = shipmentDetails;
  const pkg = currentShipment.packageDetails || {};
  
  // If we have a carrier ID but no tracking number, it's an async fulfillment
  const isAsync = !trackingNumber && !!carrierId;
  
  const updatePayload: any = {
    status: isAsync ? 'processing' : 'shipped',
    processingStatus: isAsync ? 'processing' : 'completed',
    packageDetails: {
      ...pkg,
      carrierId: String(carrierId || ""),
      carrierRawResponse: ehubData,
      fulfilledAt: trackingNumber ? new Date().toISOString() : pkg.fulfilledAt,
      isProcessing: isAsync,
      ...(labelFormat && { labelFormat }),
      ...(paperSize && { paperSize })
    },
    updatedAt: new Date().toISOString()
  };

  if (trackingNumber) {
    updatePayload.trackingNumber = trackingNumber;
  } else if (isAsync) {
    updatePayload.trackingNumber = `PENDING-${carrierId}`;
  }

  if (labelUrl) {
    updatePayload.labelUrl = labelUrl;
  }

  return { id: shipmentId, ...currentShipment, ...updatePayload };
}

export async function voidShipment(carrierId: string, shipmentId: string): Promise<any> {
  const EHUB_API_KEY = serverConfig.EHUB_API_KEY;
  const requestId = `void-${shipmentId}-${Date.now()}`;
  
  try {
    const response = await fetchWithRetry(`${EHUB_BASE_URL}/shipments/${carrierId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${EHUB_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, 2, 1000, requestId);

    const responseText = await response.text();
    let data: any = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.warn(`[voidShipment] Non-JSON response:`, responseText);
      }
    }

    if (!response.ok) {
      const err = new Error(data.message || data.error || "Carrier void failed") as any;
      err.status = response.status;
      err.details = data;
      throw err;
    }

    return data;
  } catch (err: any) {
    console.error(`[voidShipment] ❌ Void failed for ${carrierId}:`, err.message);
    throw err;
  }
}
