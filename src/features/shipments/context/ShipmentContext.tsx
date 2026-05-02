
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Shipment, Address } from '../../../shared/types';
import { fetchShipmentHistory, fulfillShipment, deleteAllShipments } from '../../../services/apiService';
import { useAuth } from '../../auth/context/AuthContext';
import { useAddresses } from '../../address-book/context/AddressContext';
import { apiClient } from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';

interface ShipmentContextType {
  shipments: Shipment[];
  loading: boolean;
  lastShipment: Shipment | null;
  initialShipmentAddress: Address | null;
  historySearchTerm: string;
  setHistorySearchTerm: (term: string) => void;
  setInitialShipmentAddress: (address: Address | null) => void;
  refreshShipments: () => Promise<void>;
  completeShipment: (shipment: Shipment) => void;
  clearHistory: () => Promise<void>;
}

const ShipmentContext = createContext<ShipmentContextType | undefined>(undefined);

export const ShipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { saveAddress, refreshAddresses } = useAddresses();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastShipment, setLastShipment] = useState<Shipment | null>(null);
  const [initialShipmentAddress, setInitialShipmentAddress] = useState<Address | null>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const navigate = useNavigate();

  const refreshShipments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const history = await fetchShipmentHistory(user.id);
      // Only show shipments that are paid for (status is not 'created')
      const paidShipments = history.filter(s => s.status !== 'created');
      setShipments(paidShipments);
    } catch (e) {
      console.error("[ShipmentContext] Failed to fetch shipments:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await deleteAllShipments(user.id);
      setShipments([]);
    } catch (e) {
      console.error("[ShipmentContext] Failed to clear history:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const completeShipment = useCallback((shipment: Shipment) => {
    // Only add to history if it's paid for (status is not 'created')
    if (shipment.status !== 'created') {
      setShipments(prev => {
        const exists = prev.find(s => s.id === shipment.id);
        if (exists) {
          return prev.map(s => s.id === shipment.id ? shipment : s);
        }
        return [shipment, ...prev];
      });
    }
    setLastShipment(shipment);
    setInitialShipmentAddress(null);
    navigate('/success', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      refreshShipments();
    } else {
      setShipments([]);
    }
  }, [user, refreshShipments]);

  return (
    <ShipmentContext.Provider value={{ 
      shipments, 
      loading, 
      lastShipment, 
      initialShipmentAddress, 
      historySearchTerm, 
      setHistorySearchTerm, 
      setInitialShipmentAddress, 
      refreshShipments, 
      completeShipment,
      clearHistory
    }}>
      {children}
    </ShipmentContext.Provider>
  );
};

export const useShipments = () => {
  const context = useContext(ShipmentContext);
  if (context === undefined) {
    throw new Error('useShipments must be used within a ShipmentProvider');
  }
  return context;
};
