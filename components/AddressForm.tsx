
import React, { useState, useId } from 'react';
import { Address } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { parseAddressWithAI } from '../services/geminiService';

interface AddressFormProps {
  title: string;
  address: Address;
  onChange: (address: Address) => void;
  onValidate: (isValid: boolean) => void;
  savedAddresses: Address[];
  onSelectSaved: (address: Address) => void;
  errors?: string[];
  onCheckValid?: (address: Address) => Promise<{ isValid: boolean; messages: string[]; correctedAddress?: Address }>;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  title,
  address,
  onChange,
  onValidate,
  savedAddresses,
  onSelectSaved,
  errors = [],
  onCheckValid
}) => {
  const [smartPasteText, setSmartPasteText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [mode, setMode] = useState<'manual' | 'ai' | 'saved'>('manual');
  
  const [manualStatus, setManualStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [manualMessages, setManualMessages] = useState<string[]>([]);
  const [corrections, setCorrections] = useState<string[]>([]);

  const baseId = useId().replace(/:/g, '');
  const isTo = title.toLowerCase().includes('to');
  const context = isTo ? 'shipping' : 'billing';

  const checkCompleteness = (addr: Address) => {
    return !!(addr.name && addr.street1 && addr.city && addr.state && addr.zip);
  };

  const handleChange = (field: keyof Address, value: string) => {
    const newAddress = { ...address, [field]: value };
    onChange(newAddress);
    onValidate(checkCompleteness(newAddress));
    
    if (manualStatus !== 'idle') {
        setManualStatus('idle');
        setManualMessages([]);
        setCorrections([]);
    }
  };

  const handleSmartPaste = async () => {
    if (!smartPasteText.trim()) return;

    setIsParsing(true);
    try {
      const parsed = await parseAddressWithAI(smartPasteText);
      const newAddress = { ...address, ...parsed };
      onChange(newAddress as Address);
      onValidate(checkCompleteness(newAddress as Address));
      setMode('manual');
      setManualStatus('idle');
      setCorrections([]);
    } catch (e) {
      console.error("Failed to parse", e);
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualValidate = async () => {
    if (!onCheckValid) return;
    setManualStatus('loading');
    setManualMessages([]);
    setCorrections([]);
    
    try {
        const result = await onCheckValid(address);
        if (result.isValid) {
            setManualStatus('success');
            
            if (result.correctedAddress) {
                const foundCorrections: string[] = [];
                const fields: (keyof Address)[] = ['street1', 'street2', 'city', 'state', 'zip', 'country'];
                
                // Identify exactly what changed to notify the user
                fields.forEach(field => {
                    const originalValue = (address[field] || '').toString().trim();
                    const correctedValue = (result.correctedAddress![field] || '').toString().trim();
                    
                    if (originalValue.toLowerCase() !== correctedValue.toLowerCase() && (address[field] || result.correctedAddress![field])) {
                        const label = field === 'street1' ? 'Street' : 
                                      field === 'street2' ? 'Line 2' : 
                                      field === 'zip' ? 'ZIP' :
                                      field.charAt(0).toUpperCase() + field.slice(1);
                        foundCorrections.push(`${label} updated to: ${result.correctedAddress![field]}`);
                    }
                });

                setCorrections(foundCorrections);
                
                // CRITICAL: Update the parent state immediately so the UI inputs reflect the standardized version
                onChange(result.correctedAddress);
                onValidate(checkCompleteness(result.correctedAddress));
            }
        } else {
            setManualStatus('error');
            setManualMessages(result.messages);
        }
    } catch (e) {
        setManualStatus('error');
        setManualMessages(["Validation service unavailable."]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <div className="flex space-x-2">
            <button 
                type="button"
                onClick={() => setMode('manual')}
                className={`text-xs font-medium px-2 py-1 rounded ${mode === 'manual' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Manual
            </button>
            <button 
                type="button"
                onClick={() => setMode('ai')}
                className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${mode === 'ai' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <span className="text-lg leading-none">✨</span> AI Paste
            </button>
            {savedAddresses.length > 0 && (
                <button 
                    type="button"
                    onClick={() => setMode('saved')}
                    className={`text-xs font-medium px-2 py-1 rounded ${mode === 'saved' ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Saved
                </button>
            )}
        </div>
      </div>

      {mode === 'ai' && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2">
          <label className="block text-sm font-medium text-purple-900 mb-2">
            Paste the full address here
          </label>
          <textarea
            className="w-full p-3 bg-white !bg-white text-slate-900 !text-slate-900 border border-purple-200 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder-slate-400"
            rows={3}
            placeholder="John Doe, 123 Maple St, Apt 4B, Springfield, IL 62704"
            value={smartPasteText}
            onChange={(e) => setSmartPasteText(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <Button 
                type="button"
                variant="primary" 
                size="sm" 
                onClick={handleSmartPaste} 
                isLoading={isParsing}
                className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
            >
              Auto-Fill
            </Button>
          </div>
        </div>
      )}

      {mode === 'saved' && (
         <div className="bg-white p-4 rounded-lg border border-slate-200 animate-in fade-in">
            <p className="text-sm text-slate-500 mb-3">Select a previously used address:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedAddresses.map((saved, idx) => (
                    <button
                        type="button"
                        key={idx}
                        onClick={() => {
                            onSelectSaved(saved);
                            setMode('manual');
                            setManualStatus('idle');
                            setCorrections([]);
                        }}
                        className="w-full text-left p-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded text-sm"
                    >
                        <span className="font-semibold block">{saved.name}</span>
                        <span className="text-slate-500">{saved.street1}, {saved.city}, {saved.state}</span>
                    </button>
                ))}
            </div>
         </div>
      )}

      <form className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${mode !== 'manual' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        <Input
          label="Full Name"
          name={`${context}_name`}
          id={`${baseId}_name`}
          autoComplete={`${context} name`}
          value={address.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Recipient Name"
          required
        />
        <Input
          label="Company (Optional)"
          name={`${context}_organization`}
          id={`${baseId}_organization`}
          autoComplete={`${context} organization`}
          value={address.company || ''}
          onChange={(e) => handleChange('company', e.target.value)}
          placeholder="Company Name"
        />
        <div className="md:col-span-2">
            <Input
              label="Street address"
              name={`${context}_address_line1`}
              id={`${baseId}_address_line1`}
              autoComplete={`${context} address-line1`}
              value={address.street1}
              onChange={(e) => handleChange('street1', e.target.value)}
              placeholder="123 Main St"
              required
            />
        </div>
        <Input
          label="Apartment, suite, unit (Optional)"
          name={`${context}_address_line2`}
          id={`${baseId}_address_line2`}
          autoComplete={`${context} address-line2`}
          value={address.street2 || ''}
          onChange={(e) => handleChange('street2', e.target.value)}
          placeholder="Apt 4B"
        />
        <Input
          label="City"
          name={`${context}_city`}
          id={`${baseId}_city`}
          autoComplete={`${context} address-level2`}
          value={address.city}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="City"
          required
        />
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="State"
              name={`${context}_state`}
              id={`${baseId}_state`}
              autoComplete={`${context} address-level1`}
              value={address.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="NY"
              required
            />
            <Input
              label="ZIP Code"
              name={`${context}_postal_code`}
              id={`${baseId}_postal_code`}
              autoComplete={`${context} postal-code`}
              value={address.zip}
              onChange={(e) => handleChange('zip', e.target.value)}
              placeholder="10001"
              required
            />
            <div>
                <label htmlFor={`${baseId}_country`} className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                <select
                    id={`${baseId}_country`}
                    name={`${context}_country`}
                    autoComplete={`${context} country`}
                    value={address.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full px-3 py-2 bg-white !bg-white text-slate-900 !text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-[38px]"
                    required
                >
                    <option value="US" className="bg-white text-slate-900">United States</option>
                    <option value="CA" className="bg-white text-slate-900">Canada</option>
                    <option value="GB" className="bg-white text-slate-900">United Kingdom</option>
                </select>
            </div>
        </div>
      </form>

      {onCheckValid && mode === 'manual' && (
        <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-3">
                <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={handleManualValidate}
                    isLoading={manualStatus === 'loading'}
                    className="text-xs py-1 h-8"
                >
                    Validate Address
                </Button>
                
                {manualStatus === 'success' && (
                    <span className="text-green-600 text-sm font-medium flex items-center animate-in fade-in">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Verified by Carrier
                    </span>
                )}
            </div>

            {manualStatus === 'success' && corrections.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl animate-in slide-in-from-top-2">
                    <p className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                        Standardization Applied:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1 pl-6">
                        {corrections.map((c, i) => <li key={i} className="list-disc">{c}</li>)}
                    </ul>
                </div>
            )}
        </div>
      )}

      {(errors.length > 0 || manualMessages.length > 0) && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-sm animate-in fade-in mt-2">
              <p className="font-bold mb-1">Carrier Validation Issues:</p>
              <ul className="list-disc list-inside space-y-0.5">
                  {[...errors, ...manualMessages].map((err, i) => <li key={i}>{err}</li>)}
              </ul>
          </div>
      )}
    </div>
  );
};
