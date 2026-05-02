
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Address } from '../../../shared/types';
import { fetchSavedAddresses, saveAddressToBook, setDefaultFromAddress } from '../../../services/apiService';
import { useAuth } from '../../auth/context/AuthContext';

interface AddressContextType {
  savedAddresses: Address[];
  loading: boolean;
  saveAddress: (addr: Address, explicitUserId?: string, isFromAddress?: boolean) => Promise<string | null | undefined>;
  setDefaultAddress: (addressId: string | null) => Promise<void>;
  refreshAddresses: () => Promise<void>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const addresses = await fetchSavedAddresses(user.id);
      setSavedAddresses(addresses);
    } catch (e) {
      console.error("[AddressContext] Failed to fetch addresses:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveAddress = useCallback(async (addr: Address, explicitUserId?: string, isFromAddress?: boolean) => {
    const userId = explicitUserId || user?.id;
    if (!userId) return;

    try {
      const savedId = await saveAddressToBook(userId, addr);
      
      // If it's a "From" address and the user doesn't have a default yet, set it as default
      if (isFromAddress && user && !user.defaultFromAddressId && savedId) {
        console.log("[AddressContext] Automatically setting first 'From' address as default:", savedId);
        await setDefaultFromAddress(userId, savedId);
        // Note: User object in AuthContext won't update immediately unless we have a way to refresh it.
        // For now, we just proceed.
      }

      // Refresh if it's the current user
      if (user?.id === userId) {
        await refreshAddresses();
      }
      return savedId;
    } catch (e) {
      console.error("[AddressContext] Failed to save address:", e);
      throw e;
    }
  }, [user, refreshAddresses]);

  const setDefaultAddress = useCallback(async (addressId: string | null) => {
    if (!user) return;
    try {
      await setDefaultFromAddress(user.id, addressId as any);
      // We might need a way to update the user object in AuthContext if we want it to be reactive everywhere.
      // But for now, we refresh addresses.
      await refreshAddresses();
    } catch (e) {
      console.error("[AddressContext] Failed to set default address:", e);
      throw e;
    }
  }, [user, refreshAddresses]);

  useEffect(() => {
    if (user) {
      refreshAddresses();
    } else {
      setSavedAddresses([]);
    }
  }, [user, refreshAddresses]);

  return (
    <AddressContext.Provider value={{ 
      savedAddresses, 
      loading, 
      saveAddress, 
      setDefaultAddress, 
      refreshAddresses 
    }}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddresses = () => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error('useAddresses must be used within an AddressProvider');
  }
  return context;
};
