import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AddressForm } from '../components/AddressForm';
import { Address, PackageDetails, Rate, Shipment } from '../types';
import { mockGetRates, mockCreateShipment, mockProcessPayment, mockValidateAddress } from '../services/mockApiService';

const emptyAddress: Address = {
  name: '', street1: '', city: '', state: '', zip: '', country: 'US'
};

const initialPackage: PackageDetails = {
  length: 10, width: 8, height: 4, weight: 2, unit: 'in', weightUnit: 'lb'
};

interface CreateShipmentProps {
    onComplete: (shipment: Shipment) => void;
    savedAddresses: Address[];
    onSaveAddress: (addr: Address) => void;
    initialToAddress?: Address | null;
}

export const CreateShipment: React.FC<CreateShipmentProps> = ({ onComplete, savedAddresses, onSaveAddress, initialToAddress }) => {
  const [step, setStep] = useState<number>(1);
  const [fromAddress, setFromAddress] = useState<Address>({ ...emptyAddress });
  
  // Initialize toAddress with the prop if provided
  const [toAddress, setToAddress] = useState<Address>(initialToAddress || { ...emptyAddress });
  
  const [pkg, setPkg] = useState<PackageDetails>(initialPackage);
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  
  // Weight UI state (derived from initialPackage, kept in sync with pkg.weight)
  const [weightLbs, setWeightLbs] = useState<string>('2');
  const [weightOz, setWeightOz] = useState<string>('0');
  
  // Validation States
  const [isFromFilled, setIsFromFilled] = useState(false);
  // If we have an initial address, assume it might be valid enough to trigger the filled state, 
  // though validation happens on 'Next'.
  const [isToFilled, setIsToFilled] = useState(!!initialToAddress);
  
  const [fromErrors, setFromErrors] = useState<string[]>([]);
  const [toErrors, setToErrors] = useState<string[]>([]);
  const [pkgErrors, setPkgErrors] = useState<Record<string, string>>({});
  
  // Loading States
  const [isValidatingAddresses, setIsValidatingAddresses] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const steps = [
    { id: 1, name: 'Addresses' },
    { id: 2, name: 'Package' },
    { id: 3, name: 'Rates' },
    { id: 4, name: 'Payment' },
  ];

  // Helper to scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleValidateAndNext = async () => {
    setIsValidatingAddresses(true);
    setFromErrors([]);
    setToErrors([]);
    
    try {
        const [fromRes, toRes] = await Promise.all([
            mockValidateAddress(fromAddress),
            mockValidateAddress(toAddress)
        ]);

        let isValid = true;
        if (!fromRes.isValid) {
            setFromErrors(fromRes.messages);
            isValid = false;
        }
        if (!toRes.isValid) {
            setToErrors(toRes.messages);
            isValid = false;
        }

        if (isValid) {
            setStep(2);
        }
    } catch (e) {
        alert("Validation error occurred. Please try again.");
    } finally {
        setIsValidatingAddresses(false);
    }
  };

  const handleFetchRates = async () => {
    // Validate package first
    const errors: Record<string, string> = {};
    if (!pkg.length || pkg.length <= 0) errors.length = "Enter valid length";
    if (!pkg.width || pkg.width <= 0) errors.width = "Enter valid width";
    if (!pkg.height || pkg.height <= 0) errors.height = "Enter valid height";
    if (!pkg.weight || pkg.weight <= 0) errors.weight = "Enter valid weight";

    if (Object.keys(errors).length > 0) {
        setPkgErrors(errors);
        return;
    }
    setPkgErrors({}); // Clear errors if valid

    setIsLoadingRates(true);
    try {
      const fetchedRates = await mockGetRates(fromAddress, toAddress, pkg);
      setRates(fetchedRates);
      setStep(3);
    } catch (e) {
      alert("Failed to fetch rates. Please try again.");
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handlePkgChange = (field: keyof PackageDetails, value: string) => {
      setPkg(prev => ({ ...prev, [field]: Number(value) }));
      // Clear error for this field if it exists
      if (pkgErrors[field]) {
          setPkgErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[field];
              return newErrors;
          });
      }
  };

  const handleWeightChange = (type: 'lbs' | 'oz', value: string) => {
    if (type === 'lbs') setWeightLbs(value);
    else setWeightOz(value);

    const l = type === 'lbs' ? value : weightLbs;
    const o = type === 'oz' ? value : weightOz;

    const lbsVal = parseFloat(l) || 0;
    const ozVal = parseFloat(o) || 0;
    const total = lbsVal + (ozVal / 16);

    setPkg(prev => ({ ...prev, weight: total }));

    if (total > 0 && pkgErrors.weight) {
        setPkgErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.weight;
            return newErrors;
        });
    }
  };

  const handlePaymentAndCreate = async () => {
    if (!selectedRate) return;
    setIsProcessingPayment(true);
    try {
        const paymentSuccess = await mockProcessPayment(selectedRate.totalAmount, 'pm_card_visa');
        if (paymentSuccess) {
            const shipment = await mockCreateShipment(fromAddress, toAddress, selectedRate, pkg);
            // Save addresses to history if unique
            onSaveAddress(fromAddress);
            onSaveAddress(toAddress);
            onComplete(shipment);
        } else {
            alert("Payment declined. Try again.");
        }
    } catch(e) {
        alert("Error creating shipment.");
    } finally {
        setIsProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* Progress Stepper */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              {/* Step Node */}
              <div className="relative flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 z-10
                  ${step >= s.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                      : 'bg-white border-slate-300 text-slate-400'}`}
                >
                  {step > s.id ? (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : s.id}
                </div>
                <div className={`absolute top-12 whitespace-nowrap text-xs font-bold tracking-wide transition-colors duration-300 ${step >= s.id ? 'text-blue-700' : 'text-slate-400'}`}>
                  {s.name}
                </div>
              </div>

              {/* Connector with Arrow */}
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4 flex items-center">
                   <div className="w-full h-[2px] bg-slate-200 relative rounded">
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500 ease-out rounded"
                        style={{ width: step > s.id ? '100%' : '0%' }}
                      />
                   </div>
                   {/* Arrow Head */}
                   <div className={`-ml-1.5 transition-colors duration-500 ${step > s.id ? 'text-blue-600' : 'text-slate-200'}`}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                   </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Addresses */}
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card title="Ship From">
            <AddressForm 
                title="" 
                address={fromAddress} 
                onChange={setFromAddress} 
                onValidate={setIsFromFilled}
                savedAddresses={savedAddresses}
                onSelectSaved={(addr) => { setFromAddress(addr); setIsFromFilled(true); }}
                errors={fromErrors}
                onCheckValid={mockValidateAddress}
            />
          </Card>

          <Card title="Ship To">
            <AddressForm 
                title="" 
                address={toAddress} 
                onChange={setToAddress} 
                onValidate={setIsToFilled}
                savedAddresses={savedAddresses}
                onSelectSaved={(addr) => { setToAddress(addr); setIsToFilled(true); }}
                errors={toErrors}
                onCheckValid={mockValidateAddress}
            />
          </Card>
          
          <div className="flex justify-end pt-4">
            <Button 
                onClick={handleValidateAndNext} 
                disabled={!isFromFilled || !isToFilled}
                isLoading={isValidatingAddresses}
                size="lg"
            >
              Next: Package Details
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Package */}
      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <Card title="Package Dimensions & Weight">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input 
                label="Length (in)" 
                type="number" 
                value={pkg.length} 
                onChange={(e) => handlePkgChange('length', e.target.value)}
                error={pkgErrors.length}
                min="0.1"
                step="0.1"
              />
              <Input 
                label="Width (in)" 
                type="number" 
                value={pkg.width} 
                onChange={(e) => handlePkgChange('width', e.target.value)}
                error={pkgErrors.width}
                min="0.1"
                step="0.1"
              />
              <Input 
                label="Height (in)" 
                type="number" 
                value={pkg.height} 
                onChange={(e) => handlePkgChange('height', e.target.value)}
                error={pkgErrors.height}
                min="0.1"
                step="0.1"
              />
              
              <div className="flex space-x-2">
                <div className="flex-1">
                    <Input 
                        label="Weight (lb)" 
                        type="number" 
                        value={weightLbs} 
                        onChange={(e) => handleWeightChange('lbs', e.target.value)}
                        error={pkgErrors.weight}
                        min="0"
                        step="1"
                    />
                </div>
                <div className="flex-1">
                    <Input 
                        label="(oz)" 
                        type="number" 
                        value={weightOz} 
                        onChange={(e) => handleWeightChange('oz', e.target.value)}
                        min="0"
                        step="0.1"
                        max="15.99"
                        className={pkgErrors.weight ? "border-red-300" : ""}
                    />
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 bg-blue-50 p-3 rounded text-blue-700">
                ℹ️ Standard packages are automatically assumed. For hazardous materials or freight, please contact support.
            </p>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button 
                onClick={handleFetchRates} 
                isLoading={isLoadingRates}
                size="lg"
            >
              See Rates
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Rates */}
      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <h2 className="text-xl font-bold text-slate-900">Select a Shipping Rate</h2>
          <div className="space-y-3">
            {rates.map((rate) => (
              <div 
                key={rate.id}
                onClick={() => setSelectedRate(rate)}
                className={`cursor-pointer rounded-xl border-2 p-4 flex items-center justify-between transition-all shadow-sm
                    ${selectedRate?.id === rate.id 
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                        : 'border-slate-200 bg-white hover:border-blue-300'}`}
              >
                <div className="flex items-center space-x-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-white text-xs
                        ${rate.carrier === 'USPS' ? 'bg-blue-800' : rate.carrier === 'UPS' ? 'bg-amber-900' : 'bg-orange-600'}`}>
                        {rate.carrier}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900">{rate.serviceName}</h4>
                        <p className="text-sm text-slate-500">Est. Arrival: {rate.estimatedDeliveryDate} ({rate.deliveryDays} days)</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">${rate.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button 
                onClick={() => setStep(4)} 
                disabled={!selectedRate}
                size="lg"
            >
              Proceed to Payment
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && selectedRate && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card title="Payment Method">
                        <div className="space-y-4">
                             {/* Simulated Stripe Element */}
                             <div className="p-4 border border-slate-300 rounded-md bg-white">
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Card Information</label>
                                <div className="flex items-center space-x-2">
                                    <span className="text-slate-400">💳</span>
                                    <input 
                                        type="text" 
                                        placeholder="4242 4242 4242 4242" 
                                        className="w-full outline-none text-slate-900"
                                        readOnly
                                        defaultValue="4242 4242 4242 4242"
                                    />
                                </div>
                                <div className="flex border-t border-slate-200 mt-3 pt-3 gap-4">
                                     <input 
                                        type="text" 
                                        placeholder="MM / YY" 
                                        className="w-1/2 outline-none text-slate-900"
                                        readOnly
                                        defaultValue="12 / 28"
                                    />
                                     <input 
                                        type="text" 
                                        placeholder="CVC" 
                                        className="w-1/2 outline-none text-slate-900"
                                        readOnly
                                        defaultValue="123"
                                    />
                                </div>
                             </div>
                             <div className="flex items-center space-x-2">
                                <input type="checkbox" id="save-card" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                                <label htmlFor="save-card" className="text-sm text-slate-700">Save card for future shipments</label>
                             </div>
                        </div>
                    </Card>
                </div>
                
                <div className="md:col-span-1">
                    <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg sticky top-24">
                        <h3 className="text-lg font-bold mb-4 border-b border-slate-700 pb-2">Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">From</span>
                                <span className="text-right">{fromAddress.city}, {fromAddress.state}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">To</span>
                                <span className="text-right">{toAddress.city}, {toAddress.state}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Service</span>
                                <span className="text-right">{selectedRate.carrier} {selectedRate.serviceName}</span>
                            </div>
                            <div className="border-t border-slate-700 pt-3 mt-3 flex justify-between items-center">
                                <span className="text-slate-400">Total</span>
                                <span className="text-2xl font-bold">${selectedRate.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button 
                                variant="primary" 
                                className="w-full bg-blue-500 hover:bg-blue-400 text-white border-0" 
                                onClick={handlePaymentAndCreate}
                                isLoading={isProcessingPayment}
                            >
                                Pay & Print Label
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
             <div className="flex justify-start">
                <Button variant="outline" onClick={() => setStep(3)}>Back to Rates</Button>
            </div>
        </div>
      )}
    </div>
  );
};