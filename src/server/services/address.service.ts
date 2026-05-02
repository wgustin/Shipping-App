
import { serverConfig } from "../config";
import { 
  Address, 
  GoogleAddressValidationResponse, 
  GoogleAddressComponent 
} from "../../shared/types";

export const getGoogleMapsKey = () => {
  return serverConfig.GOOGLE_MAPS_API_KEY;
};

export async function validateAddress(address: Address, requestId?: string): Promise<any> {
  const GOOGLE_MAPS_API_KEY = getGoogleMapsKey();
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key not configured");
  }

  const url = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${GOOGLE_MAPS_API_KEY}`;
  
  let regionCode = address.country || "US";
  if (regionCode.toUpperCase() === "USA") {
    regionCode = "US";
  }

  const payload = {
    address: {
      regionCode: regionCode,
      locality: address.city,
      administrativeArea: address.state,
      postalCode: address.zip,
      addressLines: [address.street1, address.street2].filter(Boolean)
    },
    enableUspsCass: true
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = (await response.json()) as GoogleAddressValidationResponse;
  if (!response.ok) {
    const err = new Error("Google Address Validation API Error") as any;
    err.status = response.status;
    err.details = data;
    throw err;
  }

  const result = data.result;
  const verdict = result.verdict;
  const components = result.address.addressComponents;
  const findComponent = (type: string) => components.find((c: GoogleAddressComponent) => c.componentType === type)?.componentName?.text || "";

  const standardizedAddress: Address = {
    ...address,
    street1: `${findComponent("street_number")} ${findComponent("route")}`.trim() || address.street1,
    city: findComponent("locality") || address.city,
    state: findComponent("administrative_area_level_1") || address.state,
    zip: findComponent("postal_code") || address.zip,
    country: findComponent("country") || address.country
  };

  const zipSuffix = findComponent("postal_code_suffix");
  if (zipSuffix && standardizedAddress.zip.length === 5) {
    standardizedAddress.zip = `${standardizedAddress.zip}-${zipSuffix}`;
  }

  const isValid = !!(verdict.addressComplete && 
                 (verdict.validationGranularity === "PREMISE" || verdict.validationGranularity === "SUB_PREMISE") && 
                 !verdict.hasUnconfirmedComponents);

  const isUnverifiable = !!(verdict.validationGranularity === "OTHER" || 
                         verdict.validationGranularity === "LOCALITY" ||
                         (!verdict.addressComplete && verdict.validationGranularity === "ROUTE"));

  const hasChanges = !!(verdict.hasReplacedComponents || 
                     verdict.hasInferredComponents || 
                     (zipSuffix && address.zip.length === 5) ||
                     standardizedAddress.street1.toLowerCase() !== address.street1.toLowerCase() ||
                     standardizedAddress.city.toLowerCase() !== address.city.toLowerCase() ||
                     standardizedAddress.zip !== address.zip);

  const diffs: string[] = [];
  if (standardizedAddress.street1.toLowerCase() !== address.street1.toLowerCase()) diffs.push("street1");
  if (standardizedAddress.city.toLowerCase() !== address.city.toLowerCase()) diffs.push("city");
  if (standardizedAddress.state.toLowerCase() !== address.state.toLowerCase()) diffs.push("state");
  if (standardizedAddress.zip !== address.zip) diffs.push("zip");

  return {
    isValid,
    isUnverifiable,
    isStandardized: hasChanges,
    standardizedAddress,
    originalAddress: address,
    verdict: verdict,
    uspsData: result.uspsData,
    diffs
  };
}

export async function autocompleteAddress(input: string, requestId?: string): Promise<any> {
  const GOOGLE_MAPS_API_KEY = getGoogleMapsKey();
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key not configured");
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&types=address&components=country:us`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok || data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error(`[${requestId}] ❌ Google Autocomplete API Error:`, data);
    throw new Error(`Google Autocomplete API Error: ${data.status || response.statusText}`);
  }
  
  return data;
}

export async function getAddressDetails(placeId: string, requestId?: string): Promise<any> {
  const GOOGLE_MAPS_API_KEY = getGoogleMapsKey();
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key not configured");
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=address_components,formatted_address,geometry`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok || data.status !== 'OK') {
    console.error(`[${requestId}] ❌ Google Place Details API Error:`, data);
    throw new Error(`Google Place Details API Error: ${data.status || response.statusText}`);
  }
  
  return data;
}
