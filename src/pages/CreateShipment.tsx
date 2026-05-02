
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AddressForm } from '../components/AddressForm';
import { Address, Rate, Shipment, User } from '../shared/types';
import { getRates, createShipment, fulfillShipment, getShipment } from '../services/apiService';
import { apiClient, getValidAuthToken } from '../services/apiClient';
import { PaymentSection } from '../features/payments/components/PaymentSection';
import { shipmentFormSchema, ShipmentFormData } from '../shared/schemas/forms';
import { validateAddress, ValidationResult } from '../services/googleAddressService';
import { ValidationModal } from '../features/shipments/components/ValidationModal';

const emptyAddress: Address = { name: '', street1: '', city: '', state: '', zip: '', country: 'US' };

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
    onSaveAddress: (addr: Address, userId?: string, isFrom?: boolean) => void;
    initialToAddress?: Address | null;
}> = ({ user, onComplete, savedAddresses, onSaveAddress, initialToAddress }) => {
  const defaultFrom = user.defaultFromAddressId 
    ? savedAddresses.find(a => a.id === user.defaultFromAddressId) 
    : (savedAddresses.length > 0 ? savedAddresses[0] : null);

  const methods = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      fromAddress: defaultFrom || { ...emptyAddress },
      toAddress: initialToAddress || { ...emptyAddress },
      package: { length: '' as unknown as number, width: '' as unknown as number, height: '' as unknown as number, weight: '' as unknown as number, unit: 'in', weightUnit: 'lb' }
    }
  });

  const { handleSubmit, watch, setValue, trigger, reset, formState: { errors } } = methods;
  const fromAddress = watch('fromAddress');
  const toAddress = watch('toAddress');
  const pkg = watch('package');

  // Automatically load default from address when it becomes available
  useEffect(() => {
    const currentDefaultId = user.defaultFromAddressId || (savedAddresses.length > 0 ? savedAddresses[0]?.id || null : null);
    
    if (currentDefaultId && savedAddresses.length > 0) {
      const defaultAddr = savedAddresses.find(a => a.id === currentDefaultId);
      if (defaultAddr) {
        const currentFrom = methods.getValues('fromAddress');
        // Only auto-populate if the form is currently empty
        if (!currentFrom.name && !currentFrom.street1) {
          Object.entries(defaultAddr).forEach(([key, value]) => {
            setValue(`fromAddress.${key}` as any, value as unknown, { shouldValidate: true });
          });
        }
      }
    }
  }, [user.defaultFromAddressId, savedAddresses, setValue, methods]);

  useEffect(() => {
    if (initialToAddress) {
      Object.entries(initialToAddress).forEach(([key, value]) => {
        setValue(`toAddress.${key}` as any, value as unknown, { shouldValidate: true });
      });
    }
  }, [initialToAddress, setValue]);

  const [step, setStep] = useState<number>(1);
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [loadStep, setLoadStep] = useState(0); 
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Address Validation State
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationTitle, setValidationTitle] = useState('');
  const [validationQueue, setValidationQueue] = useState<{address: Address, title: string, prefix: string}[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    if (step === 3 && selectedRate && !clientSecret && !isProcessingPayment && !purchaseError && !isFinalizing) {
        handlePaymentAndCreate();
    }
  }, [step, selectedRate, clientSecret, isProcessingPayment, purchaseError, isFinalizing]);

  useEffect(() => {
    setClientSecret(null);
    setIsFinalizing(false);
  }, [selectedRate]);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleValidateAndNext = async () => {
    setValidationError(null);
    const fieldsToValidate: Array<`fromAddress.${keyof Address}` | `toAddress.${keyof Address}`> = [
      'fromAddress.name', 'fromAddress.street1', 'fromAddress.city', 'fromAddress.state', 'fromAddress.zip', 'fromAddress.country',
      'toAddress.name', 'toAddress.street1', 'toAddress.city', 'toAddress.state', 'toAddress.zip', 'toAddress.country'
    ];
    const isValid = await trigger(fieldsToValidate as any);
    if (!isValid) return;

    setIsValidatingAddress(true);
    const queue = [
      { address: fromAddress as Address, title: 'Ship From Address', prefix: 'fromAddress' },
      { address: toAddress as Address, title: 'Ship To Address', prefix: 'toAddress' }
    ];
    setValidationQueue(queue);
    await processValidationQueue(queue);
  };

  const processValidationQueue = async (queue: {address: Address, title: string, prefix: string}[]) => {
    if (queue.length === 0) {
      setStep(2);
      setIsValidatingAddress(false);
      setValidationError(null);
      return;
    }

    const current = queue[0];
    if (!current) return;
    try {
      const result = await validateAddress(current.address);
      // Show modal ONLY if the address is invalid (includes partial fixes)
      if (!result.isValid) {
        setValidationResult(result);
        setValidationTitle(current.title);
        setValidationQueue(queue);
        setIsValidationModalOpen(true);
        // We stop here and wait for modal interaction
      } else {
        // If it's valid but standardized (minor typos), fix it silently
        if (result.isStandardized) {
          setValue(current.prefix as 'fromAddress' | 'toAddress', result.standardizedAddress as Address, { shouldValidate: true });
        }
        await processValidationQueue(queue.slice(1));
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[CreateShipment] Validation error:", message);
      setValidationError(`Verification failed for ${current.title}: ${message}`);
      setIsValidatingAddress(false);
    }
  };

  const handleSkipValidation = async () => {
    setValidationError(null);
    setIsValidatingAddress(true);
    // Skip the current one and continue with the rest of the queue
    await processValidationQueue(validationQueue.slice(1));
  };

  const handleConfirmValidation = async (standardized: Address) => {
    const current = validationQueue[0];
    if (!current) return;
    setValue(current.prefix as 'fromAddress' | 'toAddress', standardized as Address, { shouldValidate: true });
    setIsValidationModalOpen(false);
    
    // If it was a partial fix, we stop here so the user can edit the remaining issues
    if (validationResult?.isPartialFix) {
      setIsValidatingAddress(false);
      return;
    }
    
    await processValidationQueue(validationQueue.slice(1));
  };

  const handleKeepOriginal = async () => {
    setIsValidationModalOpen(false);
    await processValidationQueue(validationQueue.slice(1));
  };

  const handleFetchRates = async () => {
    const isValid = await trigger('package');
    if (!isValid) {
      console.warn("[CreateShipment] Package details invalid", errors.package);
      return;
    }

    setIsLoadingRates(true);
    setLoadStep(1);
    
    try {
      setRateError(null);
      
      // Client-side pre-check for dimensions (Length + Girth)
      const l = Number(pkg.length);
      const w = Number(pkg.width);
      const h = Number(pkg.height);
      const unit = pkg.unit || 'in';
      
      // Convert to inches for the check if needed
      const lIn = unit === 'cm' ? l / 2.54 : l;
      const wIn = unit === 'cm' ? w / 2.54 : w;
      const hIn = unit === 'cm' ? h / 2.54 : h;
      
      const girth = 2 * (wIn + hIn);
      const lengthPlusGirth = lIn + girth;
      
      // USPS max is typically 108 or 130 inches. UPS/FedEx max is 165 inches.
      if (lengthPlusGirth > 165) {
        throw new Error(`Shipment is too large for standard carriers. Length + Girth (${Math.round(lengthPlusGirth)} inches) exceeds the maximum limit of 165 inches.`);
      }

      const fetchedRates = await getRates(fromAddress as Address, toAddress as Address, pkg);
      const sortedRates = [...fetchedRates].sort((a, b) => a.totalAmount - b.totalAmount);
      
      if (sortedRates.length === 0) {
        throw new Error("No rates found for this shipment. Please check your package weight and dimensions.");
      }

      setRates(sortedRates);
      setSelectedRate(null);
      setLoadStep(2);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[CreateShipment] Rate fetch error:", message);
        // Rate Fetch Error
        setRateError(message || "Failed to fetch rates. The carrier service may be down or the address is invalid.");
    } finally {
      setIsLoadingRates(false);
      setLoadStep(0);
    }
  };

  const getCarrierLogo = (carrier?: string) => {
    if (!carrier) return null;
    const c = carrier.toUpperCase();
    if (c.includes('USPS')) return '/usps.svg';
    if (c.includes('UPS')) return '/ups.svg';
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
    if (!selectedRate || isProcessingPayment || clientSecret || isFinalizing) return;
    
    // Initialize payment process
    setIsProcessingPayment(true);
    setPurchaseError(null);
    setClientSecret(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 20000); 
    
    let currentIdempotencyKey = idempotencyKey;
    if (!currentIdempotencyKey) {
        currentIdempotencyKey = `ik_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        setIdempotencyKey(currentIdempotencyKey);
    }

    try {
        const token = await getValidAuthToken();
        
        if (!token) {
            throw new Error("Your session has expired or is invalid. Please log in to continue.");
        }

        // 1. Create the shipment first to get a shipmentId
        const shipment = await createShipment(
            user.id,
            fromAddress as Address,
            toAddress as Address,
            selectedRate,
            pkg
        );

        if (!shipment || !shipment.id) {
            throw new Error("Failed to create shipment record.");
        }

        // 2. Create the payment intent with the shipmentId
        const data = await apiClient('/api/create-payment-intent', {
            method: 'POST',
            body: JSON.stringify({
                rate: selectedRate,
                shipmentId: shipment.id,
                idempotencyKey: currentIdempotencyKey
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!data.clientSecret) {
            throw new Error("No client secret returned from server");
        }

        // Store shipmentId for polling after payment
        if (data.shipmentId) {
            localStorage.setItem('last_shipment_id', data.shipmentId);
        }

        // Save pending shipment data for recovery after redirect
        localStorage.setItem('pending_shipment', JSON.stringify({
            fromAddress,
            toAddress,
            pkg,
            selectedRate,
            userId: user.id,
            shipmentId: data.shipmentId,
            idempotencyKey: currentIdempotencyKey
        }));

        setClientSecret(data.clientSecret);
    } catch(e: any) {
        clearTimeout(timeoutId);
        
        if (e.status === 409) {
            console.log("Payment already exists for this idempotency key");
            return;
        }
        
        const message = e instanceof Error ? e.message : String(e);
        const name = e instanceof Error ? e.name : '';
        const msg = name === 'AbortError' 
            ? "The payment server is taking too long to respond. Please check your connection and try again."
            : (message || "Could not start payment process. Please try again.");
        setPurchaseError(msg);
    } finally {
        setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: unknown, overrideRate?: Rate) => {
    const pi = paymentIntent as { id: string };
    const rateToUse = overrideRate || selectedRate;
    if (!rateToUse && !localStorage.getItem('last_shipment_id')) {
      console.warn("[CreateShipment] No rate selected and no pending shipment found.");
      return;
    }
    
    setIsFinalizing(true);
    setClientSecret(null); 
    setIsPaymentModalOpen(false);
    setPurchaseError(null);

    const shipmentId = localStorage.getItem('last_shipment_id');
    
    const maxAttempts = 45; // 90 seconds total with 2s delay
    let attempts = 0;
    
    const pollShipment = async (): Promise<Shipment | null> => {
        console.log(`[CreateShipment] 🔍 Starting polling for shipmentId: ${shipmentId}`);
        
        while (attempts < maxAttempts) {
            try {
                console.log(`[Poll] Attempt ${attempts + 1}/${maxAttempts} for ${shipmentId}...`);
                
                // Use the fulfillment endpoint for polling as it also triggers if needed
                const result = await fulfillShipment(shipmentId!);

                if (result.status === 'error') {
                    console.error(`[Poll] ❌ Error on attempt ${attempts + 1}:`, result.error);
                    throw new Error(result.error || "Fulfillment failed.");
                }

                if (result.shipment) {
                    const data = result.shipment;
                    
                    if (data.status === 'error') {
                        console.error(`[Poll] ❌ Shipment status is error on attempt ${attempts + 1}`);
                        throw new Error(data.packageDetails?.lastError || "Failed to generate shipping label.");
                    }

                    const hasTracking = data.trackingNumber && 
                                       !data.trackingNumber.startsWith('PENDING') && 
                                       !data.trackingNumber.startsWith('PROCESSING-') &&
                                       !data.trackingNumber.startsWith('ERROR-');
                    
                    console.log(`[Poll] Attempt ${attempts + 1}: Status=${data.status}, hasTracking=${hasTracking}`);
                    
                    if (hasTracking || data.status === 'shipped' || data.status === 'delivered') {
                        console.log(`[Poll] ✅ Success on attempt ${attempts + 1}`);
                        return data;
                    }
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`[Poll] Error on attempt ${attempts + 1}:`, message);
                if (message && !message.includes("taking longer than expected")) {
                    throw err; // Re-throw real errors
                }
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.warn('[Poll] Timed out after 90 seconds.');
        throw new Error("Fulfillment is taking longer than expected. We've received your payment and are processing your label. Please check your history in a few minutes.");
    };

    try {
        let shipment: Shipment | null;
        if (shipmentId) {
            try {
                shipment = await pollShipment();
            } catch (pollErr) {
                console.error("[CreateShipment] Polling failed, fetching latest shipment state:", pollErr);
                shipment = await getShipment(shipmentId);
                if (!shipment) {
                    throw pollErr; // Re-throw if we can't even get the shipment
                }
            }
        } else {
            // Fallback
            shipment = await createShipment(user.id, fromAddress as Address, toAddress as Address, rateToUse as Rate, pkg);
        }

        if (shipment) {
            console.log("[CreateShipment] handlePaymentSuccess saving addresses from shipment:", shipment.id);
            onSaveAddress(shipment.fromAddress as Address, user.id, true);
            onSaveAddress(shipment.toAddress as Address, user.id, false);
            onComplete(shipment);
            localStorage.removeItem('pending_shipment');
            localStorage.removeItem('last_shipment_id');
            // Keep isFinalizing true as we are navigating away
            return;
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setPurchaseError(message || "Payment was successful, but we're having trouble generating your label. Please check your history in a moment.");
        setIsFinalizing(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentIntentId = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (paymentIntentId) {
      const pendingDataStr = localStorage.getItem('pending_shipment');
      if (pendingDataStr) {
        try {
          const pendingData = JSON.parse(pendingDataStr);
          Object.entries(pendingData.fromAddress).forEach(([k, v]) => setValue(`fromAddress.${k}` as any, v as unknown));
          Object.entries(pendingData.toAddress).forEach(([k, v]) => setValue(`toAddress.${k}` as any, v as unknown));
          Object.entries(pendingData.pkg).forEach(([k, v]) => setValue(`package.${k}` as any, v as unknown));
          setSelectedRate(pendingData.selectedRate);
          setStep(3);
          
          if (redirectStatus === 'succeeded') {
            // Trigger success handler
            handlePaymentSuccess({ id: paymentIntentId, status: 'succeeded' }, pendingData.selectedRate);
          } else {
            // If failed or canceled, we need to show the payment form again.
            // We don't have the clientSecret, so we need to initialize payment again.
            setPurchaseError("Payment failed or was canceled. Please try again.");
            // We can't automatically call handlePaymentAndCreate because it creates a new shipment.
            // The user will see the error and can click "Try Again".
          }
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error("Failed to recover pending shipment", e);
        }
      }
    }
  }, [setValue]);

  const stepNames = ["Address", "Details", "Payment"];
  const minDays = rates.length > 0 ? Math.min(...rates.map(r => r.deliveryDays)) : 999;

  if (isFinalizing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="space-y-3 max-w-sm mx-auto">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payment Confirmed!</h2>
          <p className="text-slate-500 text-lg">We're generating your shipping label and tracking number now. This usually takes just a few seconds.</p>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
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
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AddressForm 
                key="fromAddress"
                title="Ship From" 
                prefix="fromAddress"
                savedAddresses={savedAddresses} 
                onSelectSaved={(addr) => { 
                  Object.entries(addr).forEach(([key, value]) => {
                    setValue(`fromAddress.${key}` as any, value as unknown, { shouldValidate: true });
                  });
                }} 
              />
              <AddressForm 
                key="toAddress"
                title="Ship To" 
                prefix="toAddress"
                savedAddresses={savedAddresses} 
                onSelectSaved={(addr) => { 
                  Object.entries(addr).forEach(([key, value]) => {
                    setValue(`toAddress.${key}` as any, value as unknown, { shouldValidate: true });
                  });
                }} 
              />
            </div>
            {validationError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <div className="text-amber-500 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <p className="text-sm text-amber-800 font-medium">{validationError}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button onClick={handleSkipValidation} variant="outline" size="sm" className="flex-1 md:flex-none bg-white border-amber-200 text-amber-700 hover:bg-amber-100">
                    Skip & Proceed
                  </Button>
                  <Button onClick={handleValidateAndNext} variant="primary" size="sm" className="flex-1 md:flex-none">
                    Retry
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button onClick={handleValidateAndNext} size="lg" className="w-full md:w-auto" isLoading={isValidatingAddress} disabled={isValidatingAddress}>
                {isValidatingAddress ? "Verifying Addresses..." : "Next: Package Details"}
              </Button>
            </div>
          </div>
        )}

        {/* Address Validation Modal */}
        <ValidationModal 
          isOpen={isValidationModalOpen}
          onClose={() => {
            setIsValidationModalOpen(false);
            setIsValidatingAddress(false);
          }}
          onConfirm={handleConfirmValidation}
          onKeepOriginal={handleKeepOriginal}
          result={validationResult}
          title={validationTitle}
        />

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
                                      {...methods.register('package.length', { valueAsNumber: true })}
                                      onKeyDown={(e) => {
                                          if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                                      }}
                                      className="text-center"
                                      error={errors.package?.length?.message}
                                  />
                              </div>
                              <span className="text-slate-400">x</span>
                              <div className="flex-1">
                                  <Input 
                                      placeholder="W" 
                                      type="number" 
                                      {...methods.register('package.width', { valueAsNumber: true })}
                                      onKeyDown={(e) => {
                                          if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                                      }}
                                      className="text-center"
                                      error={errors.package?.width?.message}
                                  />
                              </div>
                              <span className="text-slate-400">x</span>
                              <div className="flex-1">
                                  <Input 
                                      placeholder="H" 
                                      type="number" 
                                      {...methods.register('package.height', { valueAsNumber: true })}
                                      onKeyDown={(e) => {
                                          if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                                      }}
                                      className="text-center"
                                      error={errors.package?.height?.message}
                                  />
                              </div>
                              <div className="w-20">
                                  <select 
                                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-[42px]"
                                      {...methods.register('package.unit')}
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
                                      {...methods.register('package.weight', { valueAsNumber: true })}
                                      onKeyDown={(e) => {
                                          if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                                      }}
                                      error={errors.package?.weight?.message}
                                  />
                              </div>
                              <div className="w-20">
                                  <select 
                                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-[42px]"
                                      {...methods.register('package.weightUnit')}
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
                      
                      <Button onClick={handleFetchRates} disabled={isLoadingRates} className="w-full mt-4" isLoading={isLoadingRates}>
                          {rates.length > 0 ? 'Refresh Rates' : 'Find Rates'}
                      </Button>
                    </div>
                  </Card>
               </div>

               {/* Right Column: Rates List */}
               <div>
                  {rateError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                          <div className="text-red-500 mt-0.5">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          </div>
                          <p className="text-sm text-red-800 font-medium">{rateError}</p>
                      </div>
                  )}
                  {isLoadingRates ? (
                      <Card className="bg-slate-50 border-dashed border-2 h-full flex items-center justify-center p-8">
                         <div className="space-y-4 w-full max-w-sm">
                            <RateLoadingStep active={loadStep >= 1} label="Retrieving Carrier Rates..." done={loadStep > 1} />
                            <RateLoadingStep active={loadStep >= 2} label="Optimizing Routes..." done={loadStep > 2} />
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
                                  const isBestValue = rates[0]?.id === rate.id;
                                  const isSelected = selectedRate?.id === rate.id;
                                  
                                  const displayServiceName = (rate.serviceName || '').toUpperCase().startsWith((rate.carrier || '').toUpperCase())
                                      ? rate.serviceName
                                      : `${rate.carrier || ''} ${rate.serviceName || ''}`.trim();

                                  return (
                                    <div 
                                      key={rate.id} 
                                      onClick={() => setSelectedRate(rate)} 
                                      className={`cursor-pointer rounded-xl border-2 p-4 flex justify-between items-center transition-all ${isSelected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'}`}
                                    >
                                        <div className="flex items-center gap-5 flex-1">
                                            <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                                                {logoUrl ? (
                                                    <img 
                                                        src={logoUrl} 
                                                        alt={rate.carrier} 
                                                        className="h-full w-full object-contain" 
                                                        referrerPolicy="no-referrer"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            const parent = (e.target as HTMLImageElement).parentElement;
                                                            if (parent) {
                                                                const span = document.createElement('span');
                                                                span.className = 'text-[10px] font-bold text-slate-400 uppercase';
                                                                span.innerText = rate.carrier || 'SHIP';
                                                                parent.appendChild(span);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{rate.carrier}</span>
                                                )}
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
                  <Card title="Final Review" className="shadow-xl h-full order-2 md:order-1">
                     <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-white rounded-lg shadow-sm border border-slate-200">
                                 {getCarrierLogo(selectedRate?.carrier || '') ? (
                                    <img 
                                        src={getCarrierLogo(selectedRate?.carrier || '')!} 
                                        alt={selectedRate?.carrier} 
                                        className="max-h-full max-w-full object-contain p-1" 
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent) {
                                                const span = document.createElement('span');
                                                span.className = 'text-[10px] font-bold text-slate-400 uppercase';
                                                span.innerText = selectedRate?.carrier || 'SHIP';
                                                parent.appendChild(span);
                                            }
                                        }}
                                    />
                                 ) : (
                                    <span className="text-[10px] font-bold text-slate-400">{selectedRate?.carrier}</span>
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Selected Service</p>
                                <p className="font-bold text-slate-900 text-base leading-tight break-words">
                                  {(selectedRate?.serviceName || '').toUpperCase().startsWith((selectedRate?.carrier || '').toUpperCase()) 
                                      ? selectedRate?.serviceName 
                                      : `${selectedRate?.carrier || ''} ${selectedRate?.serviceName || ''}`.trim()}
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
                                   <p className="text-xl font-bold text-slate-900 tracking-tight">${selectedRate?.totalAmount?.toFixed(2)}</p>
                               </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors group">
                                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-tight group-hover:text-blue-500 transition-colors mb-1">Ship From</p>
                                <div className="pl-0">
                                    <p className="text-slate-900 font-bold text-sm mb-0.5">{fromAddress.name}</p>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                      {fromAddress.street1}<br/>
                                      {fromAddress.street2 && <>{fromAddress.street2}<br/></>}
                                      {fromAddress.city}, {fromAddress.state} {fromAddress.zip}
                                    </p>
                                </div>
                            </div>
                            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors group">
                                <p className="font-bold text-blue-600 uppercase text-[10px] tracking-tight mb-1">Ship To</p>
                                <div className="pl-0">
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

                  <div className="animate-in slide-in-from-right-8 duration-500 h-full order-1 md:order-2">
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
                                      <p className="text-slate-900 font-bold">Error</p>
                                      <p className="text-slate-500 text-sm">{purchaseError}</p>
                                      <Button onClick={handlePaymentAndCreate} variant="outline" size="sm">Try Again</Button>
                                  </div>
                              ) : (
                                  <div className="space-y-4">
                                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                      <p className="text-slate-500 text-sm font-medium">
                                          {isFinalizing ? "Processing..." : isProcessingPayment ? "Initializing Secure Checkout..." : "Loading Checkout"}
                                      </p>
                                      {isProcessingPayment && (
                                          <p className="text-[10px] text-slate-400 mt-2">This may take a few seconds...</p>
                                      )}
                                  </div>
                              )}
                          </Card>
                      )}
                  </div>
              </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
};

export default CreateShipment;
