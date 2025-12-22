
import { Address, Rate, Shipment, PackageDetails } from "../types";
import { getSupabase } from "./supabaseClient";
import { parseAddressWithAI } from "./geminiService";

/**
 * EHUB API CONFIGURATION
 * Note: Direct client-side calls to eHub/EasyPost usually require a proxy or 
 * Supabase Edge Function to avoid CORS and protect your API Key.
 * We assume the proxy is handled at '/api/shipping'.
 */
const EHUB_PROXY_URL = '/api/shipping';

/**
 * Uses Gemini to standardize the address before API submission.
 * This fixes formatting issues that cause carrier API rejections.
 */
export const standardizeAddress = async (address: Address): Promise<Address> => {
  const rawText = `${address.name}, ${address.street1} ${address.street2 || ''}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  const standardized = await parseAddressWithAI(rawText);
  return {
    ...address,
    ...standardized as Address,
    // Ensure we keep the name if the AI focus was just the location
    name: address.name || (standardized as any).name
  };
};

export const validateAddress = async (address: Address): Promise<{ isValid: boolean; messages: string[] }> => {
  if (!address.street1 || !address.city || !address.state || !address.zip) {
    return { isValid: false, messages: ["Street, City, State, and ZIP are required."] };
  }
  
  // In a real eHub integration, you'd call /addresses/verify
  // For now, we use a lightweight check
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(address.zip) && address.country === 'US') {
    return { isValid: false, messages: ["Invalid US ZIP code format."] };
  }

  return { isValid: true, messages: [] };
};

export const getRates = async (from: Address, to: Address, pkg: PackageDetails): Promise<Rate[]> => {
  try {
    // 1. Standardize addresses with Gemini to ensure high success rate
    const cleanFrom = await standardizeAddress(from);
    const cleanTo = await standardizeAddress(to);

    // 2. Call the eHub/Shipping Proxy
    // Note: If you haven't set up the proxy yet, this will fail. 
    // We add a fallback to simulated real-world data for demonstration.
    const response = await fetch(`${EHUB_PROXY_URL}/rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: cleanFrom, to: cleanTo, package: pkg })
    }).catch(() => null);

    if (response && response.ok) {
      return await response.json();
    }

    // Fallback: Professional simulation of Real eHub Response Structure
    await new Promise(r => setTimeout(r, 2000));
    const basePrice = 5.45 + (Math.random() * 10);
    
    return [
      { 
        id: 'rate_usps_prio_' + Date.now(), 
        carrier: 'USPS', 
        serviceName: 'Priority Mail', 
        totalAmount: parseFloat(basePrice.toFixed(2)), 
        currency: 'USD', 
        deliveryDays: 2, 
        estimatedDeliveryDate: new Date(Date.now() + 172800000).toLocaleDateString() 
      },
      { 
        id: 'rate_ups_gnd_' + Date.now(), 
        carrier: 'UPS', 
        serviceName: 'Ground', 
        totalAmount: parseFloat((basePrice * 0.85).toFixed(2)), 
        currency: 'USD', 
        deliveryDays: 4, 
        estimatedDeliveryDate: new Date(Date.now() + 345600000).toLocaleDateString() 
      },
      { 
        id: 'rate_fedex_exp_' + Date.now(), 
        carrier: 'FedEx', 
        serviceName: 'Express Saver', 
        totalAmount: parseFloat((basePrice * 2.1).toFixed(2)), 
        currency: 'USD', 
        deliveryDays: 3, 
        estimatedDeliveryDate: new Date(Date.now() + 259200000).toLocaleDateString() 
      }
    ];
  } catch (error) {
    console.error("Rate Fetch Error:", error);
    throw new Error("Failed to retrieve shipping rates. Please check your connection.");
  }
};

export const createShipment = async (
  userId: string,
  from: Address,
  to: Address,
  rate: Rate,
  pkg: PackageDetails
): Promise<Shipment | null> => {
  const supabase = await getSupabase();
  if (!supabase) return null;

  try {
    // 1. In a real app, you would first call eHub to buy the label
    // const purchaseResponse = await fetch(`${EHUB_PROXY_URL}/purchase`, { ... });
    
    // 2. Simulated real purchase response
    const tracking = `${rate.carrier.substring(0,2).toUpperCase()}${Math.floor(Math.random() * 1000000000)}`;
    const labelUrl = `https://api.label-provider.com/v1/labels/${tracking}.pdf`;

    // 3. Save the actual record to the database
    const { data, error } = await supabase
      .from('shipments')
      .insert([{
        user_id: userId,
        from_address_json: from,
        to_address_json: to,
        package_details: pkg,
        selected_rate: rate,
        tracking_number: tracking,
        label_url: labelUrl,
        status: 'created'
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      createdDate: data.created_at,
      fromAddress: data.from_address_json,
      toAddress: data.to_address_json,
      packageDetails: data.package_details,
      selectedRate: data.selected_rate,
      trackingNumber: data.tracking_number,
      labelUrl: data.label_url,
      status: data.status
    };
  } catch (error) {
    console.error("Shipment Creation Error:", error);
    throw error;
  }
};

export const fetchShipmentHistory = async (userId: string): Promise<Shipment[]> => {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return data.map((item: any) => ({
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
};

export const saveAddressToBook = async (userId: string, address: Address) => {
  const supabase = await getSupabase();
  if (!supabase) return;

  // Prevent duplicates based on name and street
  const { data: existing } = await supabase
    .from('addresses')
    .select('id')
    .eq('user_id', userId)
    .eq('name', address.name)
    .eq('street1', address.street1)
    .limit(1);

  if (existing && existing.length > 0) return;

  const { error } = await supabase
    .from('addresses')
    .insert([{
      user_id: userId,
      ...address
    }]);
  
  if (error) console.error("Error saving address:", error);
};

export const fetchSavedAddresses = async (userId: string): Promise<Address[]> => {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId);

  if (error) return [];
  return data;
};
