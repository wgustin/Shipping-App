import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({ onSuccess, onCancel, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReady) {
        setLoadError("Payment form timed out. Please check your internet connection.");
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [isReady]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<{ error?: { message: string }, paymentIntent?: any }>((_, reject) => {
        setTimeout(() => reject(new Error("Payment request timed out. Please check your connection and try again.")), 15000);
      });

      // Race the confirmation against the timeout
      const result = await Promise.race([
        stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.href,
          },
          redirect: 'if_required',
        }),
        timeoutPromise
      ]);

      // TypeScript guard for the result
      const { error, paymentIntent } = result as any;

      if (error) {
        setErrorMessage(error.message || 'An unexpected error occurred.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        setErrorMessage('Payment status: ' + (paymentIntent?.status || 'unknown'));
        setIsProcessing(false);
      }
    } catch (e: any) {
      console.error("Payment Error:", e);
      setErrorMessage(e.message || "An unexpected network error occurred.");
      setIsProcessing(false);
    }
  };

  if (loadError) {
      return (
          <div className="p-6 text-center space-y-4">
              <div className="text-red-500 mb-2">⚠️ {loadError}</div>
              <Button onClick={onCancel} variant="outline">Go Back</Button>
          </div>
      );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[150px] relative">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900">Payment Details</h3>
            <span className="font-mono font-bold text-slate-900">${amount.toFixed(2)}</span>
        </div>
        
        {/* Show loader until Elements is ready */}
        <div className={!isReady ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
            <PaymentElement 
                onReady={() => setIsReady(true)} 
                options={{
                    layout: 'tabs'
                }}
            />
        </div>

        {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )}
      </div>
      
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <div className="text-red-500 mt-0.5 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
                <h4 className="text-sm font-bold text-red-800">Payment Failed</h4>
                <p className="text-sm text-red-700 mt-1 leading-relaxed">{errorMessage}</p>
                <p className="text-xs text-red-500 mt-2 font-medium">Please check your card details and try again.</p>
            </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || !elements || !isReady || isProcessing}
          isLoading={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </Button>
      </div>
    </form>
  );
};

interface PaymentModalProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
}

export const PaymentSection: React.FC<PaymentModalProps> = ({ clientSecret, onSuccess, onCancel, amount }) => {
  if (!clientSecret) return null;
  
  if (!stripePromise) {
      return (
        <Card title="Configuration Error" className="shadow-xl h-full border-red-200">
            <div className="text-red-600 p-4">
                Missing Stripe Publishable Key. Please check your environment configuration.
            </div>
            <Button onClick={onCancel} variant="outline">Back</Button>
        </Card>
      );
  }

  return (
    <Card 
        title="Secure Checkout" 
        description="Complete your purchase securely with Stripe"
        className="shadow-xl h-full"
    >
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
        <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} amount={amount} />
      </Elements>
    </Card>
  );
};
