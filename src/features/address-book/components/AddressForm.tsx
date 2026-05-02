import React, { useState, useId, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { Address } from '../../../shared/types';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { parseAddressWithAI } from '../../../services/apiService';

interface AddressFormProps {
  title: string;
  prefix: 'fromAddress' | 'toAddress' | 'address';
  savedAddresses: Address[];
  onSelectSaved: (address: Address) => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  title,
  prefix,
  savedAddresses,
  onSelectSaved,
}) => {
  const { register, setValue, control, getValues } = useFormContext();
  const { errors } = useFormState({ control });
  
  const street1 = useWatch({
    name: `${prefix}.street1`,
    control
  });
  
  const [smartPasteText, setSmartPasteText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [mode, setMode] = useState<'manual' | 'ai' | 'saved'>('manual');
  const [suggestions, setSuggestions] = useState<unknown[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [showSavedSuggestions, setShowSavedSuggestions] = useState(false);
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const suggestionRef = useRef<HTMLDivElement>(null);
  const savedSuggestionRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const justSelectedRef = useRef(false);
  
  const baseId = useId().replace(/:/g, '');
  const isTo = title.toLowerCase().includes('to') || prefix === 'toAddress';
  const context = isTo ? 'shipping' : 'billing';

  useEffect(() => {
    if (getValues(`${prefix}.country`) !== 'US') {
      setValue(`${prefix}.country`, 'US', { shouldValidate: true });
    }
  }, [prefix, setValue, getValues]);

  const handleSmartPaste = async () => {
    if (!smartPasteText.trim()) return;

    setIsParsing(true);
    try {
      const parsed = await parseAddressWithAI(smartPasteText);
      Object.entries(parsed).forEach(([key, value]) => {
        if (value) {
          const val = key === 'country' ? 'US' : value;
          setValue(`${prefix}.${key}`, val, { shouldValidate: true });
        }
      });
      setMode('manual');
    } catch (e) {
      // Failed to parse
    } finally {
      setIsParsing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const val = street1 || '';
      
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }

      if (mode === 'manual' && val.length >= 3 && isFocused) {
        fetchSuggestions(val);
      } else {
        if (suggestions.length > 0 || showSuggestions) {
          setSuggestions([]);
          setShowSuggestions(false);
          setIsLoadingSuggestions(false);
        }
      }
    }, 300); // Reduced debounce for better feel

    return () => clearTimeout(timer);
  }, [street1, mode, isFocused, prefix]);

  const fetchSuggestions = async (input: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsLoadingSuggestions(true);
    try {
      // Autocomplete is public
      // Add a client-side timeout
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`/api/address/autocomplete?input=${encodeURIComponent(input)}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) return;

      const data = await response.json();
      
      // Only update if this is still the active request AND we are likely still focused
      const isActuallyFocused = document.activeElement?.id === `${baseId}_address_line1`;
      if (abortControllerRef.current === controller && (isFocused || isActuallyFocused)) {
        setSuggestions(data.predictions || []);
        setShowSuggestions(true);
        setActiveIndex(-1);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Autocomplete fetch error:', error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoadingSuggestions(false);
      }
    }
  };

  const handleSelectSuggestion = async (suggestion: unknown) => {
    const s = suggestion as {
      description: string;
      place_id: string;
      structured_formatting?: {
        main_text: string;
        secondary_text: string;
      };
    };

    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoadingSuggestions(false);
    justSelectedRef.current = true;
    
    try {
      // Details is also public, use path param
      const response = await fetch(`/api/address/details/${s.place_id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch place details");
      }
      
      if (data.result && data.result.address_components) {
        const components = data.result.address_components;
        
        // Map Google components to our Address type
        let streetNumber = '';
        let route = '';
        
        components.forEach((c: { long_name: string; short_name: string; types: string[] }) => {
          const types = c.types;
          if (types.includes('street_number')) streetNumber = c.long_name;
          if (types.includes('route')) route = c.long_name;
          if (types.includes('locality')) setValue(`${prefix}.city`, c.long_name, { shouldValidate: true });
          if (types.includes('administrative_area_level_1')) setValue(`${prefix}.state`, c.short_name, { shouldValidate: true });
          if (types.includes('postal_code')) setValue(`${prefix}.zip`, c.long_name, { shouldValidate: true });
          if (types.includes('country')) setValue(`${prefix}.country`, 'US', { shouldValidate: true });
        });
        
        setValue(`${prefix}.street1`, `${streetNumber} ${route}`.trim(), { shouldValidate: true });
      }
    } catch (error) {
      // Place details error
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (savedSuggestionRef.current && !savedSuggestionRef.current.contains(event.target as Node)) {
        setShowSavedSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSavedAddresses = savedAddresses.filter(addr => {
    const query = savedSearchQuery.toLowerCase();
    return (
      addr.name.toLowerCase().includes(query) ||
      addr.street1.toLowerCase().includes(query) ||
      addr.city.toLowerCase().includes(query) ||
      (addr.company && addr.company.toLowerCase().includes(query))
    );
  });

  const getFieldError = (field: string) => {
    const fieldErrors = errors[prefix] as unknown as Record<string, { message?: string }>;
    let error = fieldErrors?.[field]?.message;
    
    // Fallback for flat error structure
    if (!error && errors[`${prefix}.${field}` as keyof typeof errors]) {
      error = (errors[`${prefix}.${field}` as keyof typeof errors] as { message?: string } | undefined)?.message;
    }

    return error;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      {title && (
        <div className="px-5 py-3 flex items-center gap-4 border-b border-slate-100 bg-white rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-900 whitespace-nowrap">{title}</h3>
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 ml-auto">
              <button 
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 ${
                      mode === 'manual' 
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                  Manual
              </button>
              <button 
                  type="button"
                  onClick={() => setMode('ai')}
                  className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all duration-200 ${
                      mode === 'ai' 
                      ? 'bg-white text-orange-500 shadow-sm border border-slate-200/60' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                  ✨ AI Paste
              </button>
              {savedAddresses.length > 0 && (
                  <button 
                      type="button"
                      onClick={() => setMode('saved')}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 ${
                          mode === 'saved' 
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                      Saved
                  </button>
              )}
          </div>
        </div>
      )}

      <div className="p-5 space-y-4">
        {mode === 'ai' && (
          <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
            <label className="block text-xs font-bold text-orange-900 mb-1.5 uppercase tracking-wider">
              Paste the full address here
            </label>
            <textarea
              className="w-full p-2.5 bg-white text-slate-900 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none placeholder-slate-400 shadow-sm"
              rows={2}
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
                  className="bg-orange-500 hover:bg-orange-600 focus:ring-orange-500 rounded-lg text-xs py-1.5"
              >
                Auto-Fill
              </Button>
            </div>
          </div>
        )}

        {mode === 'saved' && (
           <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in fade-in relative" ref={savedSuggestionRef}>
              <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wider">Search for a saved address:</label>
              <div className="relative">
                  <input
                      type="text"
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Type name, street, or city..."
                      value={savedSearchQuery}
                      onChange={(e) => {
                          setSavedSearchQuery(e.target.value);
                          setShowSavedSuggestions(true);
                      }}
                      onFocus={() => setShowSavedSuggestions(true)}
                  />
                  {showSavedSuggestions && filteredSavedAddresses.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {filteredSavedAddresses.map((saved, idx) => (
                              <button
                                  type="button"
                                  key={idx}
                                  onClick={() => {
                                      onSelectSaved(saved);
                                      setMode('manual');
                                      setShowSavedSuggestions(false);
                                      setSavedSearchQuery('');
                                  }}
                                  className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                              >
                                  <span className="font-semibold block text-slate-900">{saved.name}</span>
                                  <span className="text-xs text-slate-500">{saved.street1}, {saved.city}, {saved.state} {saved.zip}</span>
                                  {saved.company && <span className="text-xs text-slate-400 block italic">{saved.company}</span>}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
           </div>
        )}

        <div className={`space-y-4 ${mode !== 'manual' ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              {...register(`${prefix}.name`)}
              id={`${baseId}_name`}
              autoComplete={`${context} name`}
              placeholder={prefix === 'fromAddress' ? "Shipper Name" : "Recipient Name"}
              required
              error={getFieldError('name')}
            />
            <Input
              label="Company"
              {...register(`${prefix}.company`)}
              id={`${baseId}_organization`}
              autoComplete={`${context} organization`}
              placeholder="Company Name"
            />
        </div>

        <div className="relative" ref={suggestionRef}>
          <Input
            label="Street address"
            {...register(`${prefix}.street1`)}
            id={`${baseId}_address_line1`}
            autoComplete={`${context} address-line1`}
            onKeyDown={handleKeyDown}
            onMouseDown={() => setIsFocused(true)}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={(e) => {
              register(`${prefix}.street1`).onBlur(e);
              // Delay blur slightly to allow click on suggestion
              setTimeout(() => setIsFocused(false), 200);
            }}
            placeholder="123 Main St"
            required
            error={getFieldError('street1')}
          />
          {showSuggestions && (
            <div className="absolute z-[9999] w-full mt-1 bg-white border-2 border-blue-500 rounded-md shadow-2xl max-h-60 overflow-auto">
              {(suggestions as any[]).map((s: any, idx: number) => (
                  <button
                    key={s.place_id || idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full text-left px-4 py-2 text-sm border-b border-slate-100 last:border-0 transition-colors ${
                      activeIndex === idx ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <span className={`font-medium block ${activeIndex === idx ? 'text-blue-700' : 'text-slate-900'}`}>
                      {s.structured_formatting?.main_text || s.description}
                    </span>
                    <span className={`${activeIndex === idx ? 'text-blue-500' : 'text-slate-500'} text-xs`}>
                      {s.structured_formatting?.secondary_text}
                    </span>
                  </button>
                ))}
            </div>
          )}
          {isLoadingSuggestions && (
            <div className="absolute right-3 top-9">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Apartment, suite, unit"
              {...register(`${prefix}.street2`)}
              id={`${baseId}_address_line2`}
              autoComplete={`${context} address-line2`}
              placeholder="Apt 4B"
            />
            <Input
              label="City"
              {...register(`${prefix}.city`)}
              id={`${baseId}_city`}
              autoComplete={`${context} address-level2`}
              placeholder="City"
              required
              error={getFieldError('city')}
            />
        </div>

        <div className="grid grid-cols-3 gap-4">
            <Input
              label="State"
              {...register(`${prefix}.state`)}
              id={`${baseId}_state`}
              autoComplete={`${context} address-level1`}
              placeholder="NY"
              required
              error={getFieldError('state')}
            />
            <Input
              label="ZIP Code"
              {...register(`${prefix}.zip`)}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const target = e.target as HTMLInputElement;
                // Allow digits and hyphen for ZIP+4
                target.value = target.value.replace(/[^\d-]/g, '');
              }}
              id={`${baseId}_postal_code`}
              autoComplete={`${context} postal-code`}
              placeholder="10001"
              maxLength={10}
              required
              error={getFieldError('zip')}
            />
            <div>
                <label htmlFor={`${baseId}_country`} className="block text-sm font-medium text-slate-700 mb-1">
                    Country
                    <span className={`${getFieldError('country') ? 'text-red-500' : 'text-slate-700'} ml-1`}>*</span>
                </label>
                <div className="relative">
                    <Input
                        id={`${baseId}_country`}
                        {...register(`${prefix}.country`)}
                        autoComplete={`${context} country`}
                        readOnly
                        className={`bg-slate-50 text-slate-500 cursor-not-allowed ${
                            getFieldError('country') ? 'border-red-500 pr-10' : 'border-slate-300'
                        }`}
                        required
                    />
                    {getFieldError('country') && (
                        <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
);
};
