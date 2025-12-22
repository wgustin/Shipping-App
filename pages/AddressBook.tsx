
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AddressForm } from '../components/AddressForm';
import { Address } from '../types';
import { validateAddress } from '../services/mockApiService';

interface AddressBookProps {
  addresses: Address[];
  onAddAddress: (address: Address) => void;
  onCreateShipment: (address: Address) => void;
}

const emptyAddress: Address = {
    name: '', street1: '', city: '', state: '', zip: '', country: 'US'
};

export const AddressBook: React.FC<AddressBookProps> = ({ addresses, onAddAddress, onCreateShipment }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState<Address>(emptyAddress);
  const [isValid, setIsValid] = useState(false);

  const handleSave = () => {
    if (isValid) {
        onAddAddress(newAddress);
        setIsAdding(false);
        setNewAddress(emptyAddress);
        setIsValid(false);
    }
  };

  const handleCancel = () => {
      setIsAdding(false);
      setNewAddress(emptyAddress);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Address Book</h2>
            <p className="text-slate-500 text-sm mt-1">Manage your saved addresses for faster shipping.</p>
        </div>
        {!isAdding && (
            <Button onClick={() => setIsAdding(true)}>
                + Add Address
            </Button>
        )}
      </div>

      {isAdding ? (
          <div className="max-w-2xl mx-auto">
              <Card title="Add New Address">
                <AddressForm 
                    title="" 
                    address={newAddress} 
                    onChange={setNewAddress} 
                    onValidate={setIsValid}
                    savedAddresses={[]} // No need to look up saved addresses when adding a new one manually
                    onSelectSaved={() => {}}
                    onCheckValid={validateAddress}
                />
                <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
                    <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!isValid}>Save Address</Button>
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
                    {addresses.map((addr, idx) => (
                        <Card key={idx} className="hover:border-blue-300 transition-colors flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900">{addr.name}</h3>
                                        {addr.company && <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">{addr.company}</p>}
                                    </div>
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                        {addr.country}
                                    </span>
                                </div>
                                <div className="mt-4 space-y-1 text-sm text-slate-600">
                                    <p>{addr.street1}</p>
                                    {addr.street2 && <p>{addr.street2}</p>}
                                    <p>{addr.city}, {addr.state} {addr.zip}</p>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="w-full md:w-auto text-xs"
                                    onClick={() => onCreateShipment(addr)}
                                >
                                    Create Shipment
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </>
      )}
    </div>
  );
};
