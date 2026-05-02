import Stripe from "stripe";
import { serverConfig } from "../config";

let stripeClient: Stripe | null = null;

export const getStripe = () => {
  if (!stripeClient) {
    const key = serverConfig.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2023-10-16" as any,
      timeout: 10000,
      maxNetworkRetries: 2,
    });
  }
  return stripeClient;
};

export async function createPaymentIntent(params: {
  userId: string;
  shipmentId: string;
  rateId: string;
  amount: number;
  carrier: string;
  serviceName: string;
}) {
  const stripe = getStripe();
  return await stripe.paymentIntents.create({
    amount: Math.round(params.amount * 100),
    currency: 'usd',
    metadata: {
      userId: params.userId,
      shipmentId: params.shipmentId,
      rateId: params.rateId,
      carrier: params.carrier,
      serviceName: params.serviceName,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

export async function handleStripeWebhook(payload: string | Buffer, signature: string) {
  const stripe = getStripe();
  const webhookSecret = serverConfig.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  console.log(`[Webhook] Received Stripe event: ${event.type} (${event.id})`);

  if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
    const data = event.data.object as any;
    const shipmentId = data.metadata?.shipmentId;
    
    if (shipmentId) {
      console.log(`[Webhook] ✅ Payment confirmed for shipment ${shipmentId}. Fulfilling...`);
      // Note: Backend cannot fulfill shipment automatically because it requires shipment details
      // which are stored in Firestore, and the backend does not have Firestore access.
      // Fulfillment must be triggered by the client after successful payment.
      console.log(`[Webhook] ⚠️ Backend fulfillment is disabled. Client must trigger fulfillment.`);
    }
  }

  return event;
}
