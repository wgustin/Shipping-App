
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AddressForm } from '../components/AddressForm';
import { Address, PackageDetails, Rate, Shipment, User } from '../types';
import { getRates, createShipment, validateAddress, standardizeAddress } from '../services/mockApiService';

const emptyAddress: Address = { name: '', street1: '', city: '', state: '', zip: '', country: 'US' };
const initialPackage: PackageDetails = { length: 10, width: 8, height: 4, weight: 2, unit: 'in', weightUnit: 'lb' };

interface CreateShipmentProps {
    user: User;
    onComplete: (shipment: Shipment) => void;
    savedAddresses: Address[];
    onSaveAddress: (addr: Address) => void;
    initialToAddress?: Address | null;
}

const RateLoadingStep: React.FC<{ active: boolean; label: string; done: boolean }> = ({ active, label, done }) => (
  <div className={`flex items-center gap-3 py-2 transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}>
    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${done ? 'bg-green-500 text-white' : active ? 'border-2 border-blue-600 animate-pulse' : 'border-2 border-slate-300'}`}>
      {done ? '✓' : ''}
    </div>
    <span className={`text-sm ${active ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{label}</span>
  </div>
);

export const CreateShipment: React.FC<CreateShipmentProps> = ({ user, onComplete, savedAddresses, onSaveAddress, initialToAddress }) => {
  const [step, setStep] = useState<number>(1);
  const [fromAddress, setFromAddress] = useState<Address>({ ...emptyAddress });
  const [toAddress, setToAddress] = useState<Address>(initialToAddress || { ...emptyAddress });
  const [pkg, setPkg] = useState<PackageDetails>(initialPackage);
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  
  // Loading states
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [loadStep, setLoadStep] = useState(0); // 0: Idle, 1: Standardizing, 2: Fetching, 3: Done
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Validation
  const [fromErrors, setFromErrors] = useState<string[]>([]);
  const [toErrors, setToErrors] = useState<string[]>([]);
  const [isFromFilled, setIsFromFilled] = useState(false);
  const [isToFilled, setIsToFilled] = useState(!!initialToAddress);

  const handleValidateAndNext = async () => {
    const [fromRes, toRes] = await Promise.all([validateAddress(fromAddress), validateAddress(toAddress)]);
    if (fromRes.isValid && toRes.isValid) setStep(2);
    else {
      setFromErrors(fromRes.messages);
      setToErrors(toRes.messages);
    }
  };

  const handleFetchRates = async () => {
    setIsLoadingRates(true);
    setLoadStep(1); // Standardizing
    
    try {
      // Step 1: Standardize with Gemini
      const [stdFrom, stdTo] = await Promise.all([
        standardizeAddress(fromAddress),
        standardizeAddress(toAddress)
      ]);
      setFromAddress(stdFrom);
      setToAddress(stdTo);
      
      await new Promise(r => setTimeout(r, 600)); // Smooth transition
      setLoadStep(2); // Fetching from eHub
      
      const fetchedRates = await getRates(stdFrom, stdTo, pkg);
      setRates(fetchedRates);
      
      setLoadStep(3); // Done
      await new Promise(r => setTimeout(r, 400));
      setStep(3);
    } catch (e: any) {
        alert(e.message || "Failed to fetch rates.");
    } finally {
      setIsLoadingRates(false);
      setLoadStep(0);
    }
  };

  const getCarrierColor = (carrier: string) => {
    switch(carrier.toUpperCase()) {
      case 'USPS': return 'border-blue-500 bg-blue-50 text-blue-800';
      case 'UPS': return 'border-amber-800 bg-amber-50 text-amber-900';
      case 'FEDEX': return 'border-purple-600 bg-purple-50 text-purple-900';
      case 'DHL': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      default: return 'border-slate-300 bg-slate-50 text-slate-700';
    }
  };

  const handlePaymentAndCreate = async () => {
    if (!selectedRate) return;
    setIsProcessingPayment(true);
    try {
        const shipment = await createShipment(user.id, fromAddress, toAddress, selectedRate, pkg);
        if (shipment) {
            onSaveAddress(fromAddress);
            onSaveAddress(toAddress);
            onComplete(shipment);
        }
    } catch(e) {
        alert("Error creating label. Payment may not have been processed.");
    } finally {
        setIsProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Steps Progress */}
      <div className="flex items-center justify-between px-4">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= num ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {num}
                </div>
            </div>
          ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <Card title="Ship From">
            <AddressForm title="" address={fromAddress} onChange={setFromAddress} onValidate={setIsFromFilled} savedAddresses={savedAddresses} onSelectSaved={(addr) => { setFromAddress(addr); setIsFromFilled(true); }} errors={fromErrors} onCheckValid={validateAddress} />
          </Card>
          <Card title="Ship To">
            <AddressForm title="" address={toAddress} onChange={setToAddress} onValidate={setIsToFilled} savedAddresses={savedAddresses} onSelectSaved={(addr) => { setToAddress(addr); setIsToFilled(true); }} errors={toErrors} onCheckValid={validateAddress} />
          </Card>
          <div className="flex justify-end pt-4">
            <Button onClick={handleValidateAndNext} disabled={!isFromFilled || !isToFilled} size="lg" className="w-full md:w-auto">Next: Package Details</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <Card title="Package Dimensions & Weight">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Length (in)" type="number" value={pkg.length} onChange={(e) => setPkg(p => ({...p, length: +e.target.value}))} />
              <Input label="Width (in)" type="number" value={pkg.width} onChange={(e) => setPkg(p => ({...p, width: +e.target.value}))} />
              <Input label="Height (in)" type="number" value={pkg.height} onChange={(e) => setPkg(p => ({...p, height: +e.target.value}))} />
              <Input label="Weight (lb)" type="number" value={pkg.weight} onChange={(e) => setPkg(p => ({...p, weight: +e.target.value}))} />
            </div>
          </Card>
          
          {isLoadingRates ? (
            <Card className="bg-slate-50 border-dashed border-2">
               <div className="space-y-1">
                  <RateLoadingStep active={loadStep === 1} label="AI Address Standardization..." done={loadStep > 1} />
                  <RateLoadingStep active={loadStep === 2} label="Retrieving Carrier Rates from eHub..." done={loadStep > 2} />
                  <RateLoadingStep active={loadStep === 3} label="Calculating Optimal Shipping Paths..." done={loadStep > 3} />
               </div>
            </Card>
          ) : (
            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleFetchRates} size="lg">Find Best Rates</Button>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-400">
          <h2 className="text-xl font-bold text-slate-900">Available Shipping Services</h2>
          <div className="grid gap-4">
              {rates.map(rate => (
                <div 
                    key={rate.id} 
                    onClick={() => setSelectedRate(rate)} 
                    className={`cursor-pointer rounded-xl border-2 p-5 flex justify-between items-center transition-all ${selectedRate?.id === rate.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xs ${getCarrierColor(rate.carrier)}`}>
                            {rate.carrier}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">{rate.serviceName}</h4>
                            <p className="text-sm text-slate-500">Est. delivery: {rate.estimatedDeliveryDate}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-extrabold text-slate-900">${rate.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
              ))}
          </div>
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>Change Package</Button>
            <Button onClick={() => setStep(4)} disabled={!selectedRate} size="lg">Confirm & Pay</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="animate-in zoom-in duration-300">
            <Card title="Final Review">
               <div className="space-y-6">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Selected Service</p>
                        <p className="font-bold text-slate-900">{selectedRate?.carrier} {selectedRate?.serviceName}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs text-slate-500 uppercase font-bold">Total Price</p>
                         <p className="text-2xl font-black text-blue-600">${selectedRate?.totalAmount.toFixed(2)}</p>
                      </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 border rounded-lg">
                          <p className="font-bold text-slate-700 mb-1">From</p>
                          <p className="text-slate-600">{fromAddress.name}<br/>{fromAddress.street1}<br/>{fromAddress.city}, {fromAddress.state}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                          <p className="font-bold text-slate-700 mb-1">To</p>
                          <p className="text-slate-600">{toAddress.name}<br/>{toAddress.street1}<br/>{toAddress.city}, {toAddress.state}</p>
                      </div>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                      <Button className="w-full py-4 text-lg" onClick={handlePaymentAndCreate} isLoading={isProcessingPayment}>
                        Purchase Label
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => setStep(3)}>Back to Rates</Button>
                  </div>
               </div>
            </Card>
        </div>
      )}
    </div>
  );
};
