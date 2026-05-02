import { Router, Response, Request } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { strictApiLimiter } from "../middleware/security";
import { getErrorMessage, getErrorStatusCode } from "../../shared/utils/errors";
import { 
  createPaymentIntent, 
  handleStripeWebhook,
  getStripe
} from "../services/payment.service";
import { verifyRate } from "./carrier";

const router = Router();

router.post("/create-payment-intent", strictApiLimiter, authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { rate, shipmentId } = req.body;
    
    if (!shipmentId) {
      return res.status(400).json({ error: "shipmentId is required" });
    }

    let amount = rate.amount || rate.totalAmount;
    
    // Verify secureRateId if present
    if (rate.secureRateId) {
      try {
        const decoded = JSON.parse(Buffer.from(rate.secureRateId, 'base64').toString('utf8'));
        if (verifyRate(decoded.d, decoded.s)) {
          // Ensure the rate belongs to the user and hasn't expired
          if (decoded.d.userId === authReq.user.id && new Date(decoded.d.expiresAt) > new Date()) {
            amount = decoded.d.amount;
          } else {
            return res.status(400).json({ error: "Rate expired or invalid for this user" });
          }
        } else {
          return res.status(400).json({ error: "Invalid rate signature" });
        }
      } catch (e) {
        console.warn("Failed to verify secureRateId:", e);
        return res.status(400).json({ error: "Invalid secureRateId format" });
      }
    } else {
      return res.status(400).json({ error: "secureRateId is required" });
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      userId: authReq.user.id,
      shipmentId: shipmentId,
      rateId: rate.id || rate.secureRateId,
      amount: amount,
      carrier: rate.carrier,
      serviceName: rate.service || rate.serviceName
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret, 
      shipmentId: shipmentId 
    });
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
  }
});

router.get("/payment-intent/:id", authenticateUser, async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id as string);
    res.json(paymentIntent);
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
  }
});

router.post("/webhooks/stripe", async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  try {
    const event = await handleStripeWebhook(req.body, sig);
    res.json({ received: true });
  } catch (error: unknown) {
    console.error(`[Webhook] Error:`, getErrorMessage(error));
    res.status(400).send(`Webhook Error: ${getErrorMessage(error)}`);
  }
});

export default router;
