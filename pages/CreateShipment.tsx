
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AddressForm } from '../components/AddressForm';
import { Address, PackageDetails, Rate, Shipment, User } from '../types';
import { getRates, createShipment, validateAddress, standardizeAddress } from '../services/mockApiService';
import { PaymentSection } from '../components/PaymentSection';

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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [fromErrors, setFromErrors] = useState<string[]>([]);
  const [toErrors, setToErrors] = useState<string[]>([]);
  
  const [isFromFilled, setIsFromFilled] = useState(!!defaultFrom);
  const [isToFilled, setIsToFilled] = useState(!!initialToAddress);

  useEffect(() => {
    if (initialToAddress) {
      setToAddress(initialToAddress);
      setIsToFilled(true);
    }
  }, [initialToAddress]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (step === 3 && selectedRate && !clientSecret) {
        handlePaymentAndCreate();
    }
  }, [step]);

  useEffect(() => {
    setClientSecret(null);
  }, [selectedRate]);

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
      setSelectedRate(null);
      setLoadStep(3);
      await new Promise(r => setTimeout(r, 400));
      // setStep(3); // No longer changing step
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
    if (c.includes('USPS')) return '/Images/USPS.svg';
    if (c.includes('UPS')) return '/Images/UPS.svg';
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
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rate: selectedRate,
                userId: user.id
            })
        });

        const { clientSecret, error } = await response.json();
        
        if (error) throw new Error(error);
        if (!clientSecret) throw new Error("No client secret returned from server");

        setClientSecret(clientSecret);
        setIsPaymentModalOpen(true);
    } catch(e: any) {
        console.error("Payment Intent Creation Failure:", e);
        setPurchaseError(e.message || "Could not start payment process. Please try again.");
    } finally {
        setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedRate) return;
    
    setIsPaymentModalOpen(false);
    setClientSecret(null); // Prevent reuse of terminal PaymentIntent
    setIsProcessingPayment(true); // Show loading while creating shipment

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
        console.error("Shipment Creation Failure:", e);
        setPurchaseError(e.message || "Payment succeeded but label creation failed. Please contact support.");
    } finally {
        setIsProcessingPayment(false);
    }
  };

  const stepNames = ["Address", "Details", "Payment"];
  const isPkgValid = pkg.length > 0 && pkg.width > 0 && pkg.height > 0 && pkg.weight > 0;
  const minDays = rates.length > 0 ? Math.min(...rates.map(r => r.deliveryDays)) : 999;

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* Steps Progress */}
      <div className="flex items-center justify-center max-w-xl mx-auto px-4 mb-8 md:mb-12">
          {[1, 2, 3].map((num, idx) => (
            <React.Fragment key={num}>
                <div 
                    className={`flex flex-col items-center relative ${step > num ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                        if (step > num) setStep(num);
                    }}
                >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 z-10 ${step >= num ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-white' : 'bg-slate-200 text-slate-500 ring-4 ring-white'}`}>
                        {step > num ? '✓' : num}
                    </div>
                    <span className={`absolute -bottom-6 whitespace-nowrap text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${step >= num ? 'text-blue-600' : 'text-slate-400'}`}>
                        {stepNames[idx]}
                    </span>
                </div>
                {idx < 2 && (
                    <div className="flex-1 flex items-center px-1 md:px-2">
                        <div className={`h-0.5 w-full rounded-full transition-colors duration-500 ${step > num ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    </div>
                )}
            </React.Fragment>
          ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Ship From" className="h-full">
              <AddressForm title="" address={fromAddress} onChange={setFromAddress} onValidate={setIsFromFilled} savedAddresses={savedAddresses} onSelectSaved={(addr) => { setFromAddress(addr); setIsFromFilled(true); }} errors={fromErrors} onCheckValid={validateAddress} />
            </Card>
            <Card title="Ship To" className="h-full">
              <AddressForm title="" address={toAddress} onChange={setToAddress} onValidate={setIsToFilled} savedAddresses={savedAddresses} onSelectSaved={(addr) => { setToAddress(addr); setIsToFilled(true); }} errors={toErrors} onCheckValid={validateAddress} />
            </Card>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleValidateAndNext} disabled={!isFromFilled || !isToFilled} size="lg" className="w-full md:w-auto" isLoading={isValidating}>
              Next: Package Details
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Left Column: Package Details */}
             <div className="space-y-6">
                <Card className="h-full">
                  <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Dimensions</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <Input 
                                    placeholder="L" 
                                    type="number" 
                                    value={pkg.length || ''} 
                                    onChange={(e) => setPkg(p => ({...p, length: parseFloat(e.target.value) || 0}))} 
                                    className="text-center"
                                />
                            </div>
                            <span className="text-slate-400">x</span>
                            <div className="flex-1">
                                <Input 
                                    placeholder="W" 
                                    type="number" 
                                    value={pkg.width || ''} 
                                    onChange={(e) => setPkg(p => ({...p, width: parseFloat(e.target.value) || 0}))} 
                                    className="text-center"
                                />
                            </div>
                            <span className="text-slate-400">x</span>
                            <div className="flex-1">
                                <Input 
                                    placeholder="H" 
                                    type="number" 
                                    value={pkg.height || ''} 
                                    onChange={(e) => setPkg(p => ({...p, height: parseFloat(e.target.value) || 0}))} 
                                    className="text-center"
                                />
                            </div>
                            <div className="w-20">
                                <select 
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-[42px]"
                                    value={pkg.unit}
                                    onChange={(e) => setPkg(p => ({...p, unit: e.target.value as any}))}
                                >
                                    <option value="in">in</option>
                                    <option value="cm">cm</option>
                                </select>
                            </div>
                        </div>
                        <p className="text-xs text-blue-300 mt-2">Enter dimensions of package</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Package Weight</label>
                        <div className="flex items-center gap-2 max-w-[200px]">
                            <div className="flex-1">
                                <Input 
                                    placeholder="Weight" 
                                    type="number" 
                                    value={pkg.weight || ''} 
                                    onChange={(e) => setPkg(p => ({...p, weight: parseFloat(e.target.value) || 0}))} 
                                />
                            </div>
                            <div className="w-20">
                                <select 
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-[42px]"
                                    value={pkg.weightUnit}
                                    onChange={(e) => setPkg(p => ({...p, weightUnit: e.target.value as any}))}
                                >
                                    <option value="lb">lb</option>
                                    <option value="oz">oz</option>
                                    <option value="kg">kg</option>
                                </select>
                            </div>
                        </div>
                        <p className="text-xs text-blue-300 mt-2">Includes packaging</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500 italic">
                            Packages that underestimate dimensions and weight may be subject to additional charges
                        </p>
                    </div>
                    
                    <Button onClick={handleFetchRates} disabled={!isPkgValid || isLoadingRates} className="w-full mt-4" isLoading={isLoadingRates}>
                        {rates.length > 0 ? 'Refresh Rates' : 'Find Rates'}
                    </Button>
                  </div>
                </Card>
             </div>

             {/* Right Column: Rates List */}
             <div>
                {isLoadingRates ? (
                    <Card className="bg-slate-50 border-dashed border-2 h-full flex items-center justify-center p-8">
                       <div className="space-y-4 w-full max-w-sm">
                          <RateLoadingStep active={loadStep >= 1} label="Standardizing Addresses..." done={loadStep > 1} />
                          <RateLoadingStep active={loadStep >= 2} label="Retrieving Carrier Rates..." done={loadStep > 2} />
                          <RateLoadingStep active={loadStep >= 3} label="Optimizing Routes..." done={loadStep > 3} />
                       </div>
                    </Card>
                ) : rates.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-900">Available Services</h3>
                            <span className="text-xs text-slate-500">{rates.length} rates found</span>
                        </div>
                        <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2">
                            {rates.map(rate => {
                                const logoUrl = getCarrierLogo(rate.carrier);
                                const isFastest = rate.deliveryDays === minDays;
                                const isBestValue = rates[0].id === rate.id;
                                const isSelected = selectedRate?.id === rate.id;
                                
                                const displayServiceName = rate.serviceName.toUpperCase().startsWith(rate.carrier.toUpperCase())
                                    ? rate.serviceName
                                    : `${rate.carrier} ${rate.serviceName}`;

                                return (
                                  <div 
                                    key={rate.id} 
                                    onClick={() => setSelectedRate(rate)} 
                                    className={`cursor-pointer rounded-xl border-2 p-4 flex justify-between items-center transition-all ${isSelected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'}`}
                                  >
                                      <div className="flex items-center gap-4 flex-1">
                                          <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 p-1 flex items-center justify-center flex-shrink-0">
                                              {logoUrl ? <img src={logoUrl} alt={rate.carrier} className="max-h-full max-w-full object-contain" /> : <span className="text-xs font-bold text-slate-400">{rate.carrier}</span>}
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-slate-900 text-sm md:text-base">{displayServiceName}</h4>
                                              <div className="flex items-center gap-2 mt-1">
                                                  <span className="text-xs font-bold text-slate-500">{rate.deliveryDays} {rate.deliveryDays === 1 ? 'day' : 'days'}</span>
                                                  {isBestValue && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase">Best Value</span>}
                                                  {isFastest && <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase">Fastest</span>}
                                              </div>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <div className="text-xl font-black text-slate-900">${rate.totalAmount.toFixed(2)}</div>
                                      </div>
                                  </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <Button onClick={() => setStep(3)} disabled={!selectedRate} size="lg" className="w-full md:w-auto px-8">
                                Continue to Payment
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Card className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50 border-dashed border-2">
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-3xl">📦</div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-900">Enter Package Details</h3>
                                <p className="text-slate-500 max-w-xs mx-auto">Enter your package dimensions and weight on the left to see available shipping rates.</p>
                            </div>
                        </div>
                    </Card>
                )}
             </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in zoom-in duration-300">
            <div className="grid gap-6 md:grid-cols-2">
                <Card title="Final Review" className="shadow-xl h-full">
                   <div className="space-y-6">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-white rounded-lg shadow-sm border border-slate-200">
                               {getCarrierLogo(selectedRate?.carrier || '') ? (
                                  <img src={getCarrierLogo(selectedRate?.carrier || '')!} alt={selectedRate?.carrier} className="max-h-full max-w-full object-contain p-1" />
                               ) : (
                                  <span className="text-[10px] font-bold text-slate-400">{selectedRate?.carrier}</span>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Selected Service</p>
                              <p className="font-bold text-slate-900 text-base leading-tight break-words">
                                {selectedRate?.serviceName.toUpperCase().startsWith(selectedRate?.carrier.toUpperCase() || '') 
                                    ? selectedRate?.serviceName 
                                    : `${selectedRate?.carrier} ${selectedRate?.serviceName}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-end border-t border-slate-200 pt-3">
                             <div>
                                 <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    <span className="text-base font-bold text-slate-900">
                                      {selectedRate?.deliveryDays} {selectedRate?.deliveryDays === 1 ? 'Day' : 'Days'}
                                    </span>
                                 </div>
                                 <span className="text-xs text-slate-500 font-medium block">
                                   Est. Arrival: {formatDate(selectedRate?.estimatedDeliveryDate || '')}
                                 </span>
                             </div>
                             <div className="text-right">
                                 <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Total Price</p>
                                 <p className="text-xl font-bold text-slate-900 tracking-tight">${selectedRate?.totalAmount.toFixed(2)}</p>
                             </div>
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors group">
                              <div className="flex items-center gap-3 mb-2">
                                  <div className="w-6 h-6 bg-slate-50 rounded-md flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                      <svg className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                  </div>
                                  <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest group-hover:text-blue-500 transition-colors">Ship From</p>
                              </div>
                              <div className="pl-9">
                                  <p className="text-slate-900 font-bold text-sm mb-0.5">{fromAddress.name}</p>
                                  <p className="text-slate-500 text-xs leading-relaxed">
                                    {fromAddress.street1}<br/>
                                    {fromAddress.street2 && <>{fromAddress.street2}<br/></>}
                                    {fromAddress.city}, {fromAddress.state} {fromAddress.zip}
                                  </p>
                              </div>
                          </div>
                          <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors group">
                              <div className="flex items-center gap-3 mb-2">
                                  <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
                                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                  </div>
                                  <p className="font-bold text-blue-600 uppercase text-[10px] tracking-widest">Ship To</p>
                              </div>
                              <div className="pl-9">
                                  <p className="text-slate-900 font-bold text-sm mb-0.5">{toAddress.name}</p>
                                  <p className="text-slate-500 text-xs leading-relaxed">
                                    {toAddress.street1}<br/>
                                    {toAddress.street2 && <>{toAddress.street2}<br/></>}
                                    {toAddress.city}, {toAddress.state} {toAddress.zip}
                                  </p>
                              </div>
                          </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                          <Button 
                            variant="ghost" 
                            className="w-full text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-700" 
                            onClick={() => setStep(2)}
                          >
                            ← Back to Rates
                          </Button>
                      </div>
                   </div>
                </Card>

                <div className="animate-in slide-in-from-right-8 duration-500 h-full">
                    {clientSecret && selectedRate ? (
                        <PaymentSection 
                            key={clientSecret}
                            onSuccess={handlePaymentSuccess}
                            onCancel={() => setStep(2)}
                            clientSecret={clientSecret}
                            amount={selectedRate.totalAmount}
                        />
                    ) : (
                        <Card className="h-full min-h-[400px] shadow-xl flex flex-col items-center justify-center text-center">
                            {purchaseError ? (
                                <div className="space-y-4">
                                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>
                                    <p className="text-slate-900 font-bold">Payment Initialization Failed</p>
                                    <p className="text-slate-500 text-sm">{purchaseError}</p>
                                    <Button onClick={handlePaymentAndCreate} variant="outline" size="sm">Try Again</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-slate-500 text-sm font-medium">Initializing secure checkout...</p>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
