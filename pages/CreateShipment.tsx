
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AddressForm } from '../components/AddressForm';
import { Address, PackageDetails, Rate, Shipment, User } from '../types';
import { getRates, createShipment, validateAddress, standardizeAddress } from '../services/mockApiService';

const emptyAddress: Address = { name: '', street1: '', city: '', state: '', zip: '', country: 'US' };
const initialPackage: PackageDetails = { length: 0, width: 0, height: 0, weight: 0, unit: 'in', weightUnit: 'lb' };

const RateLoadingStep: React.FC<{ active: boolean; label: string; done: boolean }> = ({ active, label, done }) => (
  <div className={`flex items-center gap-3 py-2 transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}>
    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${done ? 'bg-green-500 text-white' : active ? 'border-2 border-blue-600 animate-pulse' : 'border-2 border-slate-300'}`}>
      {done ? '✓' : ''}
    </div>
    <span className={`text-sm ${active ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{label}</span>
  </div>
);

export const CreateShipment: React.FC<{
    user: User;
    onComplete: (shipment: Shipment) => void;
    savedAddresses: Address[];
    onSaveAddress: (addr: Address) => void;
    initialToAddress?: Address | null;
}> = ({ user, onComplete, savedAddresses, onSaveAddress, initialToAddress }) => {
  const defaultFrom = user.defaultFromAddressId 
    ? savedAddresses.find(a => a.id === user.defaultFromAddressId) 
    : null;

  const [step, setStep] = useState<number>(1);
  const [fromAddress, setFromAddress] = useState<Address>(defaultFrom || { ...emptyAddress });
  const [toAddress, setToAddress] = useState<Address>(initialToAddress || { ...emptyAddress });
  const [pkg, setPkg] = useState<PackageDetails>(initialPackage);
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [loadStep, setLoadStep] = useState(0); 
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const [fromErrors, setFromErrors] = useState<string[]>([]);
  const [toErrors, setToErrors] = useState<string[]>([]);
  
  const [isFromFilled, setIsFromFilled] = useState(!!defaultFrom);
  const [isToFilled, setIsToFilled] = useState(!!initialToAddress);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleValidateAndNext = async () => {
    setIsValidating(true);
    setFromErrors([]);
    setToErrors([]);
    try {
      const [fromRes, toRes] = await Promise.all([
        validateAddress(fromAddress), 
        validateAddress(toAddress)
      ]);
      
      if (fromRes.isValid && toRes.isValid) {
        setStep(2);
      } else {
        if (!fromRes.isValid) setFromErrors(fromRes.messages);
        if (!toRes.isValid) setToErrors(toRes.messages);
      }
    } catch (e: any) {
      alert("Address validation service is currently unavailable. Please try again later.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleFetchRates = async () => {
    setIsLoadingRates(true);
    setLoadStep(1);
    
    try {
      // AI Standardization has its own internal timeout
      const [stdFrom, stdTo] = await Promise.all([
        standardizeAddress(fromAddress),
        standardizeAddress(toAddress)
      ]);
      setFromAddress(stdFrom);
      setToAddress(stdTo);
      
      await new Promise(r => setTimeout(r, 600));
      setLoadStep(2);
      
      const fetchedRates = await getRates(stdFrom, stdTo, pkg);
      const sortedRates = [...fetchedRates].sort((a, b) => a.totalAmount - b.totalAmount);
      
      if (sortedRates.length === 0) {
        throw new Error("No rates found for this shipment. Please check your package weight and dimensions.");
      }

      setRates(sortedRates);
      setLoadStep(3);
      await new Promise(r => setTimeout(r, 400));
      setStep(3);
    } catch (e: any) {
        console.error("Rate Fetch Error:", e);
        alert(e.message || "Failed to fetch rates. The carrier service may be down or the address is invalid.");
    } finally {
      setIsLoadingRates(false);
      setLoadStep(0);
    }
  };

  const getCarrierLogo = (carrier: string) => {
    const c = carrier.toUpperCase();
    if (c.includes('USPS')) return 'https://sitetesting.shiptronix.com/images/USPS%20Logo.png';
    if (c.includes('UPS')) return 'https://upload.wikimedia.org/wikipedia/commons/1/1b/UPS_logo_2014.svg';
    if (c.includes('FEDEX')) return 'https://upload.wikimedia.org/wikipedia/commons/9/9d/FedEx_Express_logo.svg';
    if (c.includes('DHL')) return 'https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg';
    return null;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const y = date.getFullYear();
      return `${m}/${d}/${y}`;
    } catch {
      return dateStr;
    }
  };

  const handlePaymentAndCreate = async () => {
    if (!selectedRate) return;
    
    setIsProcessingPayment(true);
    setPurchaseError(null);
    
    try {
        const shipment = await createShipment(user.id, fromAddress, toAddress, selectedRate, pkg);
        if (shipment) {
            onSaveAddress(fromAddress);
            onSaveAddress(toAddress);
            onComplete(shipment);
        } else {
            throw new Error("Label purchase returned an empty result.");
        }
    } catch(e: any) {
        console.error("Purchase View Failure:", e);
        setPurchaseError(e.message || "Label creation failed. Check logs for details.");
    } finally {
        setIsProcessingPayment(false);
    }
  };

  const stepNames = ["Address", "Package", "Rates", "Confirm"];
  const isPkgValid = pkg.length > 0 && pkg.width > 0 && pkg.height > 0 && pkg.weight > 0;
  const minDays = rates.length > 0 ? Math.min(...rates.map(r => r.deliveryDays)) : 999;

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
      {/* Steps Progress */}
      <div className="flex items-center justify-center max-w-xl mx-auto px-4 mb-8 md:mb-12">
          {[1, 2, 3, 4].map((num, idx) => (
            <React.Fragment key={num}>
                <div className="flex flex-col items-center relative">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 z-10 ${step >= num ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-white' : 'bg-slate-200 text-slate-500 ring-4 ring-white'}`}>
                        {step > num ? '✓' : num}
                    </div>
                    <span className={`absolute -bottom-6 whitespace-nowrap text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${step >= num ? 'text-blue-600' : 'text-slate-400'}`}>
                        {stepNames[idx]}
                    </span>
                </div>
                {idx < 3 && (
                    <div className="flex-1 flex items-center px-1 md:px-2">
                        <div className={`h-0.5 w-full rounded-full transition-colors duration-500 ${step > num ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    </div>
                )}
            </React.Fragment>
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
            <Button onClick={handleValidateAndNext} disabled={!isFromFilled || !isToFilled} size="lg" className="w-full md:w-auto" isLoading={isValidating}>
              Next: Package Details
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div>
            <Card title="Package Dimensions & Weight">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label="Length (in)" type="number" placeholder="10" value={pkg.length || ''} onChange={(e) => setPkg(p => ({...p, length: parseFloat(e.target.value) || 0}))} />
                <Input label="Width (in)" type="number" placeholder="8" value={pkg.width || ''} onChange={(e) => setPkg(p => ({...p, width: parseFloat(e.target.value) || 0}))} />
                <Input label="Height (in)" type="number" placeholder="4" value={pkg.height || ''} onChange={(e) => setPkg(p => ({...p, height: parseFloat(e.target.value) || 0}))} />
                <Input label="Weight (lb)" type="number" placeholder="2.5" value={pkg.weight || ''} onChange={(e) => setPkg(p => ({...p, weight: parseFloat(e.target.value) || 0}))} />
              </div>
            </Card>
            <p className="mt-3 text-xs text-slate-500 font-medium px-2">
                If actual dimensions or weight exceed stated values, additional charges may apply.
            </p>
          </div>
          
          {isLoadingRates ? (
            <Card className="bg-slate-50 border-dashed border-2">
               <div className="space-y-1">
                  <RateLoadingStep active={loadStep === 1} label="AI Address Standardization..." done={loadStep > 1} />
                  <RateLoadingStep active={loadStep === 2} label="Retrieving Carrier Rates..." done={loadStep > 2} />
                  <RateLoadingStep active={loadStep === 3} label="Calculating Optimal Shipping Paths..." done={loadStep > 3} />
               </div>
            </Card>
          ) : (
            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleFetchRates} disabled={!isPkgValid} size="lg">Find Best Rates</Button>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-400">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Available Shipping Services</h2>
          </div>
          <div className="grid gap-4">
              {rates.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-white border rounded-2xl">
                    No services found. Try adjusting your package weight or addresses.
                </div>
              ) : rates.map(rate => {
                const logoUrl = getCarrierLogo(rate.carrier);
                const isFastest = rate.deliveryDays === minDays;
                const isBestValue = rates[0].id === rate.id;
                
                const displayServiceName = rate.serviceName.toUpperCase().startsWith(rate.carrier.toUpperCase())
                    ? rate.serviceName
                    : `${rate.carrier} ${rate.serviceName}`;

                return (
                  <div key={rate.id} onClick={() => setSelectedRate(rate)} className={`cursor-pointer rounded-2xl border-2 p-4 md:p-5 flex justify-between items-center transition-all ${selectedRate?.id === rate.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'}`}>
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0">
                              {logoUrl ? (
                                <img src={logoUrl} alt={rate.carrier} className="max-h-full max-w-full object-contain" />
                              ) : (
                                <span className="font-bold text-xs text-slate-400">{rate.carrier}</span>
                              )}
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-slate-900 text-base md:text-lg leading-tight break-words">{displayServiceName}</h4>
                              <p className="text-sm md:text-base font-bold text-blue-600 mt-1">
                                {rate.deliveryDays} {rate.deliveryDays === 1 ? 'day' : 'days'}
                              </p>
                              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">Est: {formatDate(rate.estimatedDeliveryDate)}</p>
                          </div>
                      </div>
                      <div className="text-right flex flex-col items-end flex-shrink-0 ml-4">
                          <span className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">${rate.totalAmount.toFixed(2)}</span>
                          <div className="flex flex-col items-end gap-1 mt-2">
                              {isBestValue && (
                                <div className="text-[8px] md:text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded uppercase tracking-tighter">Best Value</div>
                              )}
                              {isFastest && (
                                <div className="text-[8px] md:text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded uppercase tracking-tighter">Fastest</div>
                              )}
                          </div>
                      </div>
                  </div>
                );
              })}
          </div>
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={() => setStep(4)} disabled={!selectedRate} size="lg">Confirm & Pay</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="animate-in zoom-in duration-300">
            <Card title="Final Review" className="shadow-xl">
               <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50/50 p-4 md:p-6 rounded-2xl border border-blue-100 gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                        <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0">
                           {getCarrierLogo(selectedRate?.carrier || '') ? (
                              <img src={getCarrierLogo(selectedRate?.carrier || '')!} alt={selectedRate?.carrier} className="max-h-full max-w-full object-contain" />
                           ) : (
                              <span className="text-[10px] font-bold text-slate-400">{selectedRate?.carrier}</span>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest mb-1">Selected Service</p>
                          <p className="font-extrabold text-slate-900 text-lg md:text-xl leading-tight break-words">
                            {selectedRate?.serviceName.toUpperCase().startsWith(selectedRate?.carrier.toUpperCase() || '') 
                                ? selectedRate?.serviceName 
                                : `${selectedRate?.carrier} ${selectedRate?.serviceName}`}
                          </p>
                          <div className="mt-1.5 flex items-center gap-3">
                             <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                <span className="text-sm font-bold text-slate-900">
                                  {selectedRate?.deliveryDays} {selectedRate?.deliveryDays === 1 ? 'day' : 'days'}
                                </span>
                             </div>
                             <span className="text-xs text-slate-500 font-medium">
                               Est. Arrival: {formatDate(selectedRate?.estimatedDeliveryDate || '')}
                             </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto text-left sm:text-right pt-4 sm:pt-0 border-t sm:border-t-0 border-blue-100/50 flex-shrink-0">
                         <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest mb-1">Total Price</p>
                         <p className="text-3xl md:text-4xl font-black text-blue-600 tracking-tighter">${selectedRate?.totalAmount.toFixed(2)}</p>
                      </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                              <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                                  <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                              </div>
                              <p className="font-black text-slate-400 uppercase text-[10px] tracking-[0.15em]">Ship From</p>
                          </div>
                          <div className="space-y-0.5">
                              <p className="text-slate-900 font-bold text-sm">{fromAddress.name}</p>
                              <p className="text-slate-600 text-sm leading-relaxed">
                                {fromAddress.street1}<br/>
                                {fromAddress.street2 && <>{fromAddress.street2}<br/></>}
                                {fromAddress.city}, {fromAddress.state} {fromAddress.zip}
                              </p>
                          </div>
                      </div>
                      <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                              <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                              </div>
                              <p className="font-black text-blue-600 uppercase text-[10px] tracking-[0.15em]">Ship To</p>
                          </div>
                          <div className="space-y-0.5">
                              <p className="text-slate-900 font-bold text-sm">{toAddress.name}</p>
                              <p className="text-slate-600 text-sm leading-relaxed">
                                {toAddress.street1}<br/>
                                {toAddress.street2 && <>{toAddress.street2}<br/></>}
                                {toAddress.city}, {toAddress.state} {toAddress.zip}
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-3">
                      {purchaseError && (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm animate-in shake duration-500">
                             <p className="font-bold flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Purchase Failed
                             </p>
                             <p className="mt-1">{purchaseError}</p>
                          </div>
                      )}
                      <Button 
                        className="w-full py-5 text-xl font-bold shadow-2xl shadow-blue-200" 
                        onClick={handlePaymentAndCreate} 
                        isLoading={isProcessingPayment}
                      >
                        Purchase Label
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full text-slate-500 font-bold text-sm uppercase tracking-widest" 
                        onClick={() => setStep(3)}
                        disabled={isProcessingPayment}
                      >
                        Back to Rates
                      </Button>
                  </div>
               </div>
            </Card>
        </div>
      )}
    </div>
  );
};
