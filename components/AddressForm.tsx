import React, { useState } from 'react';
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
  onCheckValid?: (address: Address) => Promise<{ isValid: boolean; messages: string[] }>;
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
  
  // Manual validation state
  const [manualStatus, setManualStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [manualMessages, setManualMessages] = useState<string[]>([]);

  const checkCompleteness = (addr: Address) => {
    // Basic check: Ensure required fields are present
    return !!(addr.name && addr.street1 && addr.city && addr.state && addr.zip);
  };

  const handleChange = (field: keyof Address, value: string) => {
    const newAddress = { ...address, [field]: value };
    onChange(newAddress);
    // Check completeness immediately
    onValidate(checkCompleteness(newAddress));
    
    // Reset manual validation status on edit
    if (manualStatus !== 'idle') {
        setManualStatus('idle');
        setManualMessages([]);
    }
  };

  const handleSmartPaste = async () => {
    if (!smartPasteText.trim()) return;

    setIsParsing(true);
    try {
      const parsed = await parseAddressWithAI(smartPasteText);
      const newAddress = { ...address, ...parsed };
      onChange(newAddress);
      onValidate(checkCompleteness(newAddress as Address));
      setMode('manual'); // Switch to manual to let user verify
      setManualStatus('idle'); // Reset validation
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
    
    try {
        const result = await onCheckValid(address);
        if (result.isValid) {
            setManualStatus('success');
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
                onClick={() => setMode('manual')}
                className={`text-xs font-medium px-2 py-1 rounded ${mode === 'manual' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Manual
            </button>
            <button 
                onClick={() => setMode('ai')}
                className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${mode === 'ai' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <span className="text-lg leading-none">✨</span> AI Paste
            </button>
            {savedAddresses.length > 0 && (
                <button 
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
            className="w-full p-3 border border-purple-200 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            rows={3}
            placeholder="e.g. John Doe, 123 Maple St, Apt 4B, Springfield, IL 62704"
            value={smartPasteText}
            onChange={(e) => setSmartPasteText(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <Button 
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
                        key={idx}
                        onClick={() => {
                            onSelectSaved(saved);
                            setMode('manual');
                            setManualStatus('idle');
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

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${mode !== 'manual' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        <Input
          label="Full Name"
          value={address.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Recipient Name"
        />
        <Input
          label="Company (Optional)"
          value={address.company || ''}
          onChange={(e) => handleChange('company', e.target.value)}
          placeholder="Company Name"
        />
        <div className="md:col-span-2">
            <Input
            label="Street Address"
            value={address.street1}
            onChange={(e) => handleChange('street1', e.target.value)}
            placeholder="123 Main St"
            />
        </div>
        <Input
          label="Apt / Suite (Optional)"
          value={address.street2 || ''}
          onChange={(e) => handleChange('street2', e.target.value)}
          placeholder="Apt 4B"
        />
        <Input
          label="City"
          value={address.city}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="City"
        />
        <Input
          label="State"
          value={address.state}
          onChange={(e) => handleChange('state', e.target.value)}
          placeholder="NY"
          className="uppercase"
          maxLength={2}
        />
        <Input
          label="ZIP Code"
          value={address.zip}
          onChange={(e) => handleChange('zip', e.target.value)}
          placeholder="10001"
        />
      </div>

      {onCheckValid && mode === 'manual' && (
        <div className="flex items-center space-x-3 pt-2">
            <Button 
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
                    Verified
                </span>
            )}
        </div>
      )}

      {/* Merged Errors Display */}
      {(errors.length > 0 || manualMessages.length > 0) && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm animate-in fade-in mt-2">
              {[...errors, ...manualMessages].map((err, i) => <p key={i}>• {err}</p>)}
          </div>
      )}
    </div>
  );
};