
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { AddressForm } from '../components/AddressForm';
import { Address } from '../../../shared/types';
import { updateAddress, deleteAddress } from '../../../services/apiService';
import { addressSchema } from '../../../shared/schemas/forms';
import { useAuth } from '../../auth/context/AuthContext';
import { useAddresses } from '../context/AddressContext';
import { useShipments } from '../../shipments/context/ShipmentContext';
import { AlertTriangle, Trash2, Edit2, Plus, Search, MapPin, Star, Truck } from 'lucide-react';

const emptyAddress: Address = {
    name: '', street1: '', city: '', state: '', zip: '', country: 'US'
};

export const AddressBook: React.FC = () => {
  const { user } = useAuth();
  const { savedAddresses: addresses, saveAddress: onAddAddress, setDefaultAddress: onSetDefault, refreshAddresses } = useAddresses();
  const { setInitialShipmentAddress } = useShipments();
  const navigate = useNavigate();

  const onCreateShipment = (address: Address) => {
    setInitialShipmentAddress(address);
    navigate('/create');
  };

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!user) return null;

  const methods = useForm<{ address: Address }>({
    resolver: zodResolver(z.object({ address: addressSchema })),
    mode: 'onBlur',
    defaultValues: {
      address: emptyAddress
    }
  });

  const { handleSubmit, reset, trigger, formState: { isValid } } = methods;

  const handleSave: SubmitHandler<{ address: Address }> = async (data) => {
    setIsSaving(true);
    setError(null);
    try {
        if (editingId) {
            await updateAddress(user.id, editingId, data.address);
            await refreshAddresses();
        } else {
            onAddAddress(data.address);
        }
        setIsAdding(false);
        setEditingId(null);
        reset({ address: emptyAddress });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message || "Failed to save address.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setIsDeleting(true);
    setError(null);
    try {
        await deleteAddress(user.id, editingId);
        await refreshAddresses();
        setIsAdding(false);
        setEditingId(null);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message || "Failed to delete address.");
        setShowDeleteConfirm(false);
    } finally {
        setIsDeleting(false);
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id || null);
    reset({ address: { ...addr } });
    setIsAdding(true);
  };

  const handleCancel = () => {
      setIsAdding(false);
      setEditingId(null);
      reset({ address: emptyAddress });
  };

  const [searchTerm, setSearchTerm] = useState('');

  const isSameAddress = (a: Address, b: Address) => {
    return (
      (a.name || '').toLowerCase() === (b.name || '').toLowerCase() &&
      (a.street1 || '').toLowerCase() === (b.street1 || '').toLowerCase() &&
      (a.street2 || '').toLowerCase() === (b.street2 || '').toLowerCase() &&
      (a.city || '').toLowerCase() === (b.city || '').toLowerCase() &&
      (a.state || '').toLowerCase() === (b.state || '').toLowerCase() &&
      (a.zip || '').toLowerCase() === (b.zip || '').toLowerCase() &&
      a.country === b.country
    );
  };

  // Deduplicate addresses, prioritizing the default one
  const uniqueAddresses = addresses.reduce((acc: Address[], current) => {
    const isDefault = current.id === user.defaultFromAddressId;
    const existingIndex = acc.findIndex(a => isSameAddress(a, current));
    
    if (existingIndex === -1) {
      acc.push(current);
    } else if (isDefault) {
      // Replace existing with the default one if they are the same
      acc[existingIndex] = current;
    }
    return acc;
  }, []);

  const filteredAddresses = uniqueAddresses.filter(addr => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (addr.name || '').toLowerCase().includes(searchLower) ||
      (addr.company || '').toLowerCase().includes(searchLower) ||
      (addr.street1 || '').toLowerCase().includes(searchLower) ||
      (addr.city || '').toLowerCase().includes(searchLower) ||
      (addr.state || '').toLowerCase().includes(searchLower) ||
      (addr.zip || '').toLowerCase().includes(searchLower)
    );
  });

  const sortedAddresses = [...filteredAddresses].sort((a, b) => {
    if (a.id === user.defaultFromAddressId) return -1;
    if (b.id === user.defaultFromAddressId) return 1;
    return 0;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-900">Address Book</h2>
            <p className="text-slate-500 text-sm mt-1">Manage origins and frequent destinations.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
                <input
                    type="text"
                    placeholder="Search addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            {!isAdding && (
                <Button onClick={() => setIsAdding(true)} className="whitespace-nowrap">
                    + Add New
                </Button>
            )}
        </div>
      </div>

      {isAdding ? (
          <div className="max-w-2xl mx-auto">
              <FormProvider {...methods}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <AddressForm 
                      title={editingId ? "Edit Address" : "Add New Address"} 
                      prefix="address"
                      savedAddresses={[]} 
                      onSelectSaved={() => {}}
                  />
                  <div className="px-6 pb-6 pt-2 flex items-center justify-between">
                      <div>
                          {editingId && (
                              <Button 
                                  variant="danger" 
                                  size="sm" 
                                  onClick={handleDelete} 
                                  isLoading={isDeleting}
                                  className="px-4"
                              >
                                  Delete Address
                              </Button>
                          )}
                      </div>
                      <div className="flex gap-3">
                          <Button variant="ghost" onClick={handleCancel} disabled={isSaving || isDeleting}>Cancel</Button>
                          <Button onClick={handleSubmit(handleSave as any)} disabled={isDeleting} isLoading={isSaving}>
                              {editingId ? 'Update Address' : 'Save Address'}
                          </Button>
                      </div>
                  </div>
                </div>
              </FormProvider>
          </div>
      ) : (
        <>
            {addresses.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-300 bg-slate-50">
                    <div className="text-center py-16">
                        <div className="text-4xl mb-4">📇</div>
                        <h3 className="text-lg font-medium text-slate-900">No addresses yet</h3>
                        <p className="text-slate-500 mb-6">Addresses used in shipments will be saved here automatically.</p>
                        <Button variant="outline" onClick={() => setIsAdding(true)}>Add your first address</Button>
                    </div>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedAddresses.map((addr) => {
                        const isDefault = addr.id === user.defaultFromAddressId;
                        return (
                            <Card key={addr.id} className={`transition-all flex flex-col justify-between h-full relative border-2 ${isDefault ? 'border-blue-500 shadow-lg shadow-blue-50' : 'hover:border-slate-300 border-slate-200'}`}>
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="pr-12">
                                            <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{addr.name}</h3>
                                            {addr.company && <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-0.5">{addr.company}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-0.5 text-sm text-slate-600 font-medium">
                                        <p>{addr.street1}</p>
                                        {addr.street2 && <p>{addr.street2}</p>}
                                        <p>{addr.city}, {addr.state} {addr.zip}</p>
                                        <p className="text-xs text-slate-400 mt-2 uppercase tracking-tighter">{addr.country}</p>
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                                    <Button 
                                        size="sm" 
                                        className="col-span-2 font-bold"
                                        onClick={() => onCreateShipment(addr)}
                                    >
                                        Ship to this address
                                    </Button>
                                    <Button 
                                        size="xs" 
                                        variant="outline"
                                        className="font-bold"
                                        onClick={() => handleEdit(addr)}
                                    >
                                        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit
                                    </Button>
                                    <Button 
                                        size="xs" 
                                        variant={isDefault ? "ghost" : "outline"}
                                        className={`font-bold transition-all ${isDefault ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : ''}`}
                                        onClick={() => addr.id && onSetDefault(isDefault ? null : addr.id)}
                                    >
                                        {isDefault ? 'Unset Default' : 'Set as Default'}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default AddressBook;
