
import { Address, Rate, Shipment, PackageDetails } from "../types";
import { getSupabase } from "./supabaseClient";
import { parseAddressWithAI } from "./geminiService";

// Security: Use environment variables
const REQUEST_TIMEOUT_MS = 15000; 

/**
 * Standardizes addresses via Gemini to ensure highest success rate with carrier APIs
 */
export const standardizeAddress = async (address: Address): Promise<Address> => {
  const rawText = `${address.name}, ${address.street1} ${address.street2 || ''}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  try {
    const standardized = await parseAddressWithAI(rawText);
    return {
      ...address,
      ...standardized as Address,
      name: address.name || (standardized as any).name || "Recipient"
    };
  } catch (e) {
    console.warn("AI standardization skipped due to error:", e);
    return address;
  }
};

/**
 * Validates an address using the eHub v2 shipping/validate_address endpoint
 */
export const validateAddress = async (address: Address): Promise<{ isValid: boolean; messages: string[]; correctedAddress?: Address }> => {
  console.group("🔍 eHub: Address Validation");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const payload = {
      address1: address.street1 || '',
      address2: address.street2 || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || 'US',
      postal_code: address.zip || ''
    };

    console.info("Request Params:", payload);

    const response = await fetch('/api/validate-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await response.json();
    console.info("Response Data:", data);
    clearTimeout(timeoutId);
    
    const hasErrors = data.errors && Array.isArray(data.errors) && data.errors.length > 0;
    const isSuccess = response.ok && !hasErrors;

    if (isSuccess) {
      const apiAddr = data.address || data.standardized_address || (data.data && (data.data.address || data.standardized_address)) || data;
      let correctedAddress: Address | undefined = undefined;
      
      if (apiAddr && typeof apiAddr === 'object') {
        const zipField = apiAddr.postal_code || apiAddr.zip || apiAddr.zip_code || apiAddr.postalCode || apiAddr.postcode || address.zip;
        const stateField = apiAddr.state || apiAddr.province || apiAddr.region || apiAddr.state_code || address.state;

        correctedAddress = {
          ...address,
          street1: String(apiAddr.address1 || apiAddr.street1 || apiAddr.address_line1 || address.street1),
          street2: String(apiAddr.address2 || apiAddr.street2 || apiAddr.address_line2 || address.street2 || ''),
          city: String(apiAddr.city || apiAddr.locality || apiAddr.town || address.city),
          state: String(stateField).toUpperCase().trim(),
          zip: String(zipField).trim(),
          country: String(apiAddr.country || apiAddr.country_code || apiAddr.countryCode || address.country || 'US').toUpperCase().trim()
        };
      }
      console.groupEnd();
      return { isValid: true, messages: [], correctedAddress };
    } else {
      const errors = data.errors || data.messages || data.error || (data.data && data.data.errors) || ["This address could not be verified by the carrier."];
      console.warn("Validation Warnings/Errors:", errors);
      console.groupEnd();
      return { isValid: false, messages: Array.isArray(errors) ? errors : [errors] };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Validation Network/Timeout Error:", error);
    console.groupEnd();
    if (error.name === 'AbortError') return { isValid: false, messages: ["Address verification timed out. Please try again."] };
    return { isValid: false, messages: ["Could not connect to verification service."] };
  }
};

const formatAddressForEhub = (addr: Address) => {
  return {
    company: (addr.name || "Recipient").substring(0, 50),
    first_name: "",
    last_name: "",
    phone: (addr.phone || "5555555555").replace(/\D/g, '').substring(0, 10) || "5555555555",
    email: (addr.email || "customer@shipeasy.app").substring(0, 50),
    address1: (addr.street1 || "").substring(0, 50),
    address2: (addr.street2 || "").substring(0, 50),
    city: (addr.city || "").substring(0, 35),
    state: (addr.state || "").toUpperCase().trim().substring(0, 2),
    country: (addr.country || "US").toUpperCase().trim().substring(0, 2),
    postal_code: (addr.zip || "").trim().substring(0, 10)
  };
};

export const getRates = async (from: Address, to: Address, pkg: PackageDetails): Promise<Rate[]> => {
  console.group("📊 eHub: Fetching Rates");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const payload = {
      shipment: {
        from_location: formatAddressForEhub(from),
        to_location: formatAddressForEhub(to),
        parcels: [{
          length: Number(pkg.length) || 1,
          width: Number(pkg.width) || 1,
          height: Number(pkg.height) || 1,
          weight: Math.max(Number(pkg.weight) * 16.0, 1) 
        }],
        show_all_services: true
      }
    };

    console.info("Request Payload:", payload);

    // Call our own backend proxy instead of eHub directly
    const response = await fetch('/api/rates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    console.info("Response Data:", data);

    if (!response.ok) {
      throw new Error(data.message || data.error || `Carrier Error (${response.status})`);
    }

    const rawRates = data.service_rates || [];
    const mappedRates = rawRates.map((r: any) => ({
      id: String(r.service_id),
      carrier: String(r.carrier_code || "Carrier").toUpperCase(),
      serviceName: String(r.service || "Shipping Service"),
      totalAmount: parseFloat(String(r.rate || 0)),
      currency: "USD",
      deliveryDays: parseInt(String(r.delivery_days || 3), 10),
      estimatedDeliveryDate: String(r.delivery_date || "3-5 Business Days")
    }));

    console.table(mappedRates);
    console.groupEnd();
    return mappedRates;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Rate Fetch Error:", error);
    console.groupEnd();
    if (error.name === 'AbortError') throw new Error("Rate request timed out.");
    throw error;
  }
};

export const createShipment = async (
  userId: string,
  from: Address,
  to: Address,
  rate: Rate,
  pkg: PackageDetails
): Promise<Shipment | null> => {
  const logLabel = `Label Purchase (${Date.now()})`;
  console.group(`🚀 ${logLabel}`);
  console.time("Purchase Flow Duration");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const payload = {
      userId,
      from,
      to,
      rate,
      pkg
    };

    console.info("1. Sending Shipment Request to Server:", payload);

    const supabase = await getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch('/api/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    console.info("2. Server Response:", data);

    if (!response.ok) {
      const errMsg = data.error || data.message || `Server Error: ${response.status}`;
      throw new Error(errMsg);
    }

    console.timeEnd("Purchase Flow Duration");
    console.groupEnd();
    return data as Shipment;

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("❌ Purchase Flow Aborted:", error);
    console.timeEnd("Purchase Flow Duration");
    console.groupEnd();
    if (error.name === 'AbortError') throw new Error("The request timed out after 60 seconds. Please check your history to see if the label was created.");
    throw error;
  }
};

/**
 * Voids a shipment (cancels the label)
 */
export const voidShipment = async (shipmentId: string): Promise<boolean> => {
  console.group("🗑️ eHub: Voiding Label");
  const supabase = await getSupabase();
  if (!supabase) return false;

  try {
    const { data: shipment, error: fetchErr } = await supabase
      .from('shipments')
      .select('package_details, tracking_number')
      .eq('id', shipmentId)
      .single();
    
    if (fetchErr) throw new Error(`Could not access shipment record: ${fetchErr.message}`);

    const carrierId = shipment?.package_details?.carrierId;
    if (!carrierId) {
        throw new Error("This shipment lacks a carrier ID required for cancellation.");
    }

    console.info("Requesting void for carrierId:", carrierId);

    const response = await fetch('/api/void-shipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ carrierId })
    });

    const data = await response.json();
    console.info("Void Response:", data);

    if (!response.ok) {
      throw new Error(data.message || data.error || "Carrier refused to void the label.");
    }

    const { error: updateErr } = await supabase
      .from('shipments')
      .update({ status: 'cancelled' })
      .eq('id', shipmentId);

    if (updateErr) throw updateErr;
    console.groupEnd();
    return true;
  } catch (err: any) {
    console.error("❌ Void Process Failed:", err);
    console.groupEnd();
    throw err;
  }
};

export const fetchShipmentHistory = async (userId: string): Promise<Shipment[]> => {
  try {
    const supabase = await getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("Database error fetching history:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      createdDate: item.created_at,
      fromAddress: item.from_address_json,
      toAddress: item.to_address_json,
      packageDetails: item.package_details,
      selectedRate: item.selected_rate,
      trackingNumber: item.tracking_number,
      labelUrl: item.label_url,
      status: item.status
    }));
  } catch (e) {
    console.warn("Exception fetching history:", e);
    return [];
  }
};

export const updateAddress = async (userId: string, addressId: string, address: Address) => {
  const supabase = await getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('addresses')
    .update({
      name: address.name,
      company: address.company,
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone,
      email: address.email
    })
    .eq('id', addressId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const deleteAddress = async (userId: string, addressId: string) => {
  const supabase = await getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Set the default from address in the profiles table.
 */
export const setDefaultFromAddress = async (userId: string, addressId: string) => {
  const supabase = await getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('profiles')
    .update({ default_from_address_id: addressId })
    .eq('id', userId);

  if (error) throw error;
};

export const saveAddressToBook = async (userId: string, address: Address) => {
  const supabase = await getSupabase();
  if (!supabase) return;

  const { data: existing } = await supabase
    .from('addresses')
    .select('id')
    .eq('user_id', userId)
    .eq('street1', address.street1)
    .eq('zip', address.zip)
    .limit(1);

  if (existing && existing.length > 0) return;

  const { error } = await supabase
    .from('addresses')
    .insert([{
      user_id: userId,
      ...address
    }]);
  
  if (error) console.error("Supabase address save error:", error);
};

export const fetchSavedAddresses = async (userId: string): Promise<Address[]> => {
  try {
    const supabase = await getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn("Database error fetching addresses:", error);
      return [];
    }
    
    return (data || []).map((d: any) => ({
      ...d,
      id: d.id
    }));
  } catch (e) {
    console.warn("Exception fetching addresses:", e);
    return [];
  }
};
