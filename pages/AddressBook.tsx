
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AddressForm } from '../components/AddressForm';
import { Address, User } from '../types';
import { validateAddress, updateAddress, deleteAddress } from '../services/mockApiService';

interface AddressBookProps {
  user: User;
  addresses: Address[];
  onAddAddress: (address: Address) => void;
  onCreateShipment: (address: Address) => void;
  onSetDefault: (addressId: string) => Promise<void>;
}

const emptyAddress: Address = {
    name: '', street1: '', city: '', state: '', zip: '', country: 'US'
};

export const AddressBook: React.FC<AddressBookProps> = ({ user, addresses, onAddAddress, onCreateShipment, onSetDefault }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<Address>(emptyAddress);
  const [isValid, setIsValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!isValid) return;
    
    setIsSaving(true);
    try {
        if (editingId) {
            await updateAddress(user.id, editingId, currentAddress);
            window.location.reload(); 
        } else {
            onAddAddress(currentAddress);
        }
        setIsAdding(false);
        setEditingId(null);
        setCurrentAddress(emptyAddress);
        setIsValid(false);
    } catch (e) {
        alert("Failed to save address.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm("Are you sure you want to remove this address? This cannot be undone.")) return;

    setIsDeleting(true);
    try {
        await deleteAddress(user.id, editingId);
        window.location.reload();
    } catch (e) {
        alert("Failed to delete address.");
    } finally {
        setIsDeleting(false);
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id || null);
    setCurrentAddress({ ...addr });
    setIsAdding(true);
    setIsValid(true);
  };

  const handleCancel = () => {
      setIsAdding(false);
      setEditingId(null);
      setCurrentAddress(emptyAddress);
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredAddresses = addresses.filter(addr => {
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
              <Card title={editingId ? "Edit Address" : "Add New Address"}>
                <AddressForm 
                    title="" 
                    address={currentAddress} 
                    onChange={setCurrentAddress} 
                    onValidate={setIsValid}
                    savedAddresses={[]} 
                    onSelectSaved={() => {}}
                    onCheckValid={validateAddress}
                />
                <div className="flex items-center justify-between mt-6 border-t border-slate-100 pt-4">
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
                        <Button onClick={handleSave} disabled={!isValid || isDeleting} isLoading={isSaving}>
                            {editingId ? 'Update Address' : 'Save Address'}
                        </Button>
                    </div>
                </div>
              </Card>
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
                                        className={`font-bold transition-all ${isDefault ? 'bg-slate-100 text-slate-400 border-slate-200 pointer-events-none cursor-default shadow-none' : ''}`}
                                        onClick={() => addr.id && onSetDefault(addr.id)}
                                        disabled={isDefault}
                                    >
                                        {isDefault ? 'Default from Address' : 'Set as Default'}
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
