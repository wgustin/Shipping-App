
import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Address } from '../../../shared/types';
import { ValidationResult } from '../../../services/googleAddressService';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: Address) => void;
  onKeepOriginal: () => void;
  result: ValidationResult | null;
  title: string;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onKeepOriginal,
  result,
  title
}) => {
  if (!result) return null;

  const { originalAddress, standardizedAddress, diffs, isValid, isUnverifiable, isPartialFix } = result;

  const isIdentical = 
    originalAddress.street1 === standardizedAddress.street1 &&
    (originalAddress.street2 || '') === (standardizedAddress.street2 || '') &&
    originalAddress.city === standardizedAddress.city &&
    originalAddress.state === standardizedAddress.state &&
    originalAddress.zip === standardizedAddress.zip;

  const getStatusStyles = () => {
    if (isUnverifiable) return 'bg-red-50 border-red-100 text-red-800';
    if (isPartialFix) return 'bg-amber-50 border-amber-100 text-amber-800';
    if (isValid) return 'bg-blue-50 border-blue-100 text-blue-800';
    return 'bg-amber-50 border-amber-100 text-amber-800';
  };

  const getIcon = () => {
    if (isUnverifiable) return <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />;
    if (isPartialFix) return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
    if (isValid) return <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />;
    return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isUnverifiable ? "Invalid Address Detected" : isPartialFix ? "Address Needs More Info" : `Verify ${title}`} maxWidth="max-w-lg">
      <div className="space-y-6">
        <div className={`p-4 rounded-xl border flex gap-3 ${getStatusStyles()}`}>
          {getIcon()}
          <div className="text-sm">
            <p className="font-bold mb-1">
              {isUnverifiable 
                ? "This address is highly likely to be undeliverable."
                : isPartialFix
                  ? "We've standardized the street, but the address is still incomplete."
                  : isValid 
                    ? "We've standardized the address for better deliverability." 
                    : isIdentical 
                      ? "We found some potential issues with the address provided."
                      : "We found some potential issues and have a suggested correction."}
            </p>
            {diffs.length > 0 && (
              <ul className="list-disc pl-4 space-y-1 opacity-90">
                {diffs.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            )}
            {(isUnverifiable || isPartialFix) && (
              <p className="mt-3 font-medium text-amber-800">
                {isUnverifiable 
                  ? "We strongly recommend editing this address to avoid shipping delays." 
                  : "Please click 'Edit Address' to add the missing information."}
              </p>
            )}
          </div>
        </div>

        <div className={`grid gap-4 ${isIdentical || isUnverifiable ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              {isIdentical || isUnverifiable ? 'Address Provided' : 'Original'}
            </p>
            <div className={`p-4 border rounded-xl text-sm ${
              isUnverifiable ? 'bg-red-50/30 border-red-100' : 
              isIdentical || isPartialFix ? 'bg-amber-50/30 border-amber-100' : 
              'bg-slate-50 border-slate-100'
            }`}>
              <p className="font-bold text-slate-900">{originalAddress.name}</p>
              <p className="text-slate-600">{originalAddress.street1}</p>
              {originalAddress.street2 && <p className="text-slate-600">{originalAddress.street2}</p>}
              <p className="text-slate-600">{originalAddress.city}, {originalAddress.state} {originalAddress.zip}</p>
            </div>
          </div>
          
          {!isIdentical && !isUnverifiable && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest px-1">
                {isPartialFix ? 'Standardized' : 'Suggested'}
              </p>
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-sm ring-2 ring-blue-500/20">
                <p className="font-bold text-slate-900">{standardizedAddress.name}</p>
                <p className="text-slate-600">{standardizedAddress.street1}</p>
                {standardizedAddress.street2 && <p className="text-slate-600">{standardizedAddress.street2}</p>}
                <p className="text-slate-600">{standardizedAddress.city}, {standardizedAddress.state} {standardizedAddress.zip}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {(!isIdentical && !isUnverifiable && !isPartialFix) && (
            <Button onClick={() => onConfirm(standardizedAddress)} className="w-full py-6 text-base shadow-lg shadow-blue-200">
              Use Suggested Address
            </Button>
          )}

          {isPartialFix && (
             <Button onClick={() => onConfirm(standardizedAddress)} className="w-full py-6 text-base bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100">
               Apply Standardization & Edit
             </Button>
          )}
          
          <div className="flex gap-3">
            <Button 
              onClick={onKeepOriginal} 
              variant="outline" 
              className={`flex-1 ${isUnverifiable ? 'py-6 text-base border-slate-200 text-slate-500 hover:bg-slate-50' : ''}`}
            >
              {isUnverifiable ? 'Use Anyway (Risky)' : isIdentical ? 'Use Address Anyway' : 'Keep Original'}
            </Button>
            <Button 
              onClick={onClose} 
              variant="primary" 
              className="flex-1 py-6 text-base shadow-lg shadow-blue-200"
            >
              Edit Address
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
