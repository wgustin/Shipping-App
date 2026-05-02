
import { Address, Rate, Shipment, PackageDetails } from "../shared/types";
import * as schemas from "../shared/schemas/api";
import { apiClient } from "./apiClient";
import { getWeightInOunces, formatAddressForEhub } from "../shared/utils/formatters";

// Security: Use environment variables
const REQUEST_TIMEOUT_MS = 20000; 

export const getRates = async (from: Address, to: Address, pkg: PackageDetails): Promise<Rate[]> => {
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
          weight: Math.max(getWeightInOunces(pkg.weight, pkg.weightUnit || 'lb'), 1) 
        }],
        show_all_services: true
      }
    };

    console.log("[apiService] Calling /api/rates...");
    const data = await apiClient('/api/rates', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log("[apiService] /api/rates response data received");

    const validatedData = schemas.RatesResponseSchema.parse(data);
    const rawRates = validatedData.service_rates || [];
    const mappedRates = rawRates.map((r) => {
      const totalAmount = parseFloat(String(r.rate ?? 0));
      const deliveryDays = parseInt(String(r.delivery_days ?? 3), 10);
      
      return {
        id: String(r.service_id),
        carrier: String(r.carrier_code || "Carrier").toUpperCase(),
        serviceName: String(r.service || "Shipping Service"),
        totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
        currency: "USD",
        deliveryDays: isNaN(deliveryDays) ? 3 : deliveryDays,
        estimatedDeliveryDate: String(r.delivery_date || "3-5 Business Days"),
        secureRateId: String(r.secureRateId || "")
      };
    }).filter((r) => r.totalAmount > 0);

    return mappedRates;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') throw new Error("Rate request timed out.");
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
  try {
    const newDocRef = doc(collection(db, "shipments"));
    const shipmentData = {
      id: newDocRef.id,
      userId,
      fromAddress: from,
      toAddress: to,
      packageDetails: pkg,
      selectedRate: rate,
      status: 'created',
      processingStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(newDocRef, shipmentData);

    return {
      id: shipmentData.id,
      createdDate: shipmentData.createdAt,
      fromAddress: shipmentData.fromAddress,
      toAddress: shipmentData.toAddress,
      packageDetails: shipmentData.packageDetails,
      selectedRate: shipmentData.selectedRate,
      trackingNumber: "",
      labelUrl: "",
      status: shipmentData.status
    } as Shipment;

  } catch (error: unknown) {
    console.error("[apiService] Exception in createShipment:", error);
    throw error;
  }
};

/**
 * Voids a shipment (cancels the label)
 */
export const voidShipment = async (shipmentId: string, carrierId: string): Promise<boolean> => {
  try {
    await apiClient('/api/void-shipment', {
      method: 'POST',
      body: JSON.stringify({ shipmentId, carrierId })
    });
    
    // Update Firestore to reflect the voided status
    try {
      const docRef = doc(db, "shipments", shipmentId);
      await updateDoc(docRef, {
        status: 'voided',
        updatedAt: new Date().toISOString()
      });
    } catch (updateErr) {
      console.error("[apiService] Failed to update shipment voided status in Firestore:", updateErr);
    }
    
    return true;
  } catch (err: unknown) {
    throw err;
  }
};

import { collection, query, where, orderBy, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

export const deleteAllShipments = async (userId: string): Promise<void> => {
  if (!userId) return;
  try {
    const q = query(collection(db, "shipments"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, "shipments", docSnap.id)));
    await Promise.all(deletePromises);
    console.log(`[apiService] Successfully deleted ${deletePromises.length} shipments`);
  } catch (e) {
    console.error("[apiService] Exception in deleteAllShipments:", e);
  }
};

export const fetchShipmentHistory = async (userId: string): Promise<Shipment[]> => {
  if (!userId) return [];
  try {
    console.log("[apiService] Fetching real shipment history for user:", userId);
    const q = query(
      collection(db, "shipments"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const shipments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        createdDate: data.createdAt || data.createdDate,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        packageDetails: data.packageDetails,
        selectedRate: data.selectedRate,
        trackingNumber: data.trackingNumber,
        labelUrl: data.labelUrl,
        status: data.status
      } as Shipment;
    });
    console.log(`[apiService] Successfully fetched ${shipments.length} shipments from Firestore`);
    return shipments;
  } catch (e) {
    console.error("[apiService] Exception in fetchShipmentHistory:", e);
    return [];
  }
};

export const getShipment = async (shipmentId: string): Promise<Shipment | null> => {
  try {
    const docRef = doc(db, "shipments", shipmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      createdDate: data.createdAt || data.createdDate,
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      packageDetails: data.packageDetails,
      selectedRate: data.selectedRate,
      trackingNumber: data.trackingNumber,
      labelUrl: data.labelUrl,
      status: data.status
    } as Shipment;
  } catch (e) {
    console.error("[apiService] Exception in getShipment:", e);
    return null;
  }
};

/**
 * Manually triggers fulfillment for a shipment.
 * Returns normalized status and shipment data.
 */
export const fulfillShipment = async (shipmentId: string): Promise<{ status: 'success' | 'processing' | 'error', shipment: Shipment | null, error?: string }> => {
  try {
    const docRef = doc(db, "shipments", shipmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("Shipment not found");
    }
    const shipmentDetails = docSnap.data();

    // Fetch user preferences
    let labelFormat = "PDF";
    let labelSize = "8.5x11";
    try {
      if (shipmentDetails.userId) {
        const userRef = doc(db, "users", shipmentDetails.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.labelFormat) labelFormat = userData.labelFormat;
          if (userData.labelSize) labelSize = userData.labelSize;
        }
      }
    } catch (err) {
      console.error("[apiService] Failed to fetch user preferences:", err);
    }

    const data = await apiClient(`/api/shipments/${shipmentId}/fulfill`, {
      method: 'POST',
      body: JSON.stringify({ shipmentDetails, labelFormat, labelSize })
    });

    if (data.shipment) {
      // Update Firestore with the returned shipment data
      await updateDoc(docRef, data.shipment);
    }

    return {
      status: data.status,
      shipment: data.shipment ? {
        id: data.shipment.id,
        createdDate: data.shipment.createdAt || data.shipment.created_at,
        fromAddress: data.shipment.fromAddress || data.shipment.from_address_json,
        toAddress: data.shipment.toAddress || data.shipment.to_address_json,
        packageDetails: data.shipment.packageDetails || data.shipment.package_details,
        selectedRate: data.shipment.selectedRate || data.shipment.selected_rate,
        trackingNumber: data.shipment.trackingNumber || data.shipment.tracking_number,
        labelUrl: data.shipment.labelUrl || data.shipment.label_url,
        status: data.shipment.status
      } : null,
      error: data.error
    };
  } catch (err: any) {
    const message = err.message || String(err);
    console.error("[apiService] Fulfill trigger failed:", err);
    
    // Update Firestore to reflect the error status
    try {
      const docRef = doc(db, "shipments", shipmentId);
      await updateDoc(docRef, {
        status: 'error',
        'packageDetails.lastError': message,
        updatedAt: new Date().toISOString()
      });
    } catch (updateErr) {
      console.error("[apiService] Failed to update shipment error status in Firestore:", updateErr);
    }

    return { 
      status: 'error', 
      shipment: null, 
      error: message 
    };
  }
};

export const updateAddress = async (userId: string, addressId: string, address: Address) => {
  if (!userId || !addressId) return;
  try {
    const docRef = doc(db, `users/${userId}/addresses`, addressId);
    await updateDoc(docRef, {
      ...address,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("[apiService] Exception updating address:", e);
  }
};

/**
 * Fetches address suggestions from Google Places Autocomplete API
 */
export const autocompleteAddress = async (input: string, signal?: AbortSignal): Promise<any> => {
  try {
    return await apiClient(`/api/address/autocomplete?input=${encodeURIComponent(input)}`, {
      ...(signal ? { signal } : {})
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    console.error("[apiService] Autocomplete failed:", err);
    throw err;
  }
};

/**
 * Fetches full address details for a specific place ID
 */
export const getAddressDetails = async (placeId: string): Promise<any> => {
  try {
    return await apiClient(`/api/address/details/${placeId}`);
  } catch (err) {
    console.error("[apiService] Place details failed:", err);
    throw err;
  }
};

export const deleteAddress = async (userId: string, addressId: string) => {
  if (!userId || !addressId) return;
  try {
    const docRef = doc(db, `users/${userId}/addresses`, addressId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error("[apiService] Exception deleting address:", e);
  }
};

/**
 * Set the default from address in the profiles table.
 */
export const setDefaultFromAddress = async (userId: string, addressId: string | null) => {
  if (!userId) return;
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      defaultFromAddressId: addressId
    });
  } catch (e) {
    console.error("[apiService] Exception setting default from address:", e);
  }
};

export const saveAddressToBook = async (userId: string, address: Address): Promise<string | null> => {
  if (!userId) {
    console.error("[saveAddressToBook] No userId provided.");
    return null;
  }

  const cleanAddress = {
    name: address.name?.trim() || "",
    company: address.company?.trim() || null,
    street1: address.street1?.trim() || "",
    street2: address.street2?.trim() || null,
    city: address.city?.trim() || "",
    state: address.state?.trim() || "",
    zip: address.zip?.trim() || "",
    country: address.country?.trim() || 'US',
    phone: address.phone?.trim() || null,
    email: address.email?.trim() || null,
  };

  if (!cleanAddress.name || !cleanAddress.street1 || !cleanAddress.city || !cleanAddress.state || !cleanAddress.zip) {
    console.warn("[saveAddressToBook] Missing required address fields, skipping save:", cleanAddress);
    return null;
  }

  try {
    const addressesRef = collection(db, `users/${userId}/addresses`);
    
    // Check for existing address
    const q = query(
      addressesRef,
      where("name", "==", cleanAddress.name),
      where("street1", "==", cleanAddress.street1),
      where("city", "==", cleanAddress.city),
      where("state", "==", cleanAddress.state),
      where("zip", "==", cleanAddress.zip),
      where("country", "==", cleanAddress.country)
    );
    
    const snapshot = await getDocs(q);
    const existingDoc = snapshot.docs.find(doc => {
      const data = doc.data();
      return (data.company || null) === cleanAddress.company &&
             (data.street2 || null) === cleanAddress.street2 &&
             (data.phone || null) === cleanAddress.phone;
    });

    if (existingDoc) {
      return existingDoc.id;
    }

    const newDocRef = doc(addressesRef);
    const newAddress = {
      id: newDocRef.id,
      userId,
      ...cleanAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(newDocRef, newAddress);
    return newDocRef.id;
  } catch (err) {
    console.error("[saveAddressToBook] Error saving address:", err);
    return null;
  }
};

export const fetchSavedAddresses = async (userId: string): Promise<Address[]> => {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, `users/${userId}/addresses`),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Address));
  } catch (e) {
    console.error("[apiService] Exception fetching addresses:", e);
    return [];
  }
};

/**
 * Parses a raw address string using backend AI
 */
export const parseAddressWithAI = async (rawText: string): Promise<Partial<Address>> => {
  try {
    return await apiClient('/api/ai/parse-address', {
      method: 'POST',
      body: JSON.stringify({ rawText })
    });
  } catch (err) {
    console.error("[apiService] AI Parse failed:", err);
    throw err;
  }
};
