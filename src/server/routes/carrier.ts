import { Router, Response, Request } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { getErrorMessage, getErrorStatusCode } from "../../shared/utils/errors";
import * as schemas from "../../shared/schemas/api";
import { fetchEhubRates, voidShipment } from "../services/carrier.service";
import { rateLimit } from "express-rate-limit";
import crypto from "crypto";
import { serverConfig } from "../config";

const router = Router();

router.get("/proxy-label", authenticateUser, async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    
    // Only allow ehub urls
    if (!url.includes('ehub.com') && !url.includes('easypost.com') && !url.includes('amazonaws.com')) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch label: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy label' });
  }
});

const ratesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Limit each IP to 1000 rate requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: "Too many rate requests. Please wait a few minutes." }
});

const SECURE_RATE_TTL = 30 * 60 * 1000; // 30 minutes

// Generate a random secret for signing rates if one isn't provided
const RATE_SIGNING_SECRET = serverConfig.STRIPE_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex');

export function signRate(rateData: any): string {
  const hmac = crypto.createHmac('sha256', RATE_SIGNING_SECRET);
  hmac.update(JSON.stringify(rateData));
  return hmac.digest('hex');
}

export function verifyRate(rateData: any, signature: string): boolean {
  const expectedSignature = signRate(rateData);
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

router.post("/rates", authenticateUser, ratesLimiter, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const requestId = authReq.requestId;
  try {
    const payload = schemas.RatesPayloadSchema.parse(req.body);
    const data = await fetchEhubRates(payload, requestId);

    // Inject secureRateIds
    if (data.service_rates && Array.isArray(data.service_rates)) {
      const from = payload.shipment?.from_location || payload.from_location;
      const to = payload.shipment?.to_location || payload.to_location;
      const parcels = payload.shipment?.parcels || payload.parcels;

      if (!from || !to || !parcels) {
        return res.status(400).json({ error: "Invalid shipment data" });
      }

      const responseRates = data.service_rates.map((r: any) => {
        const rateData = {
          userId: authReq.user.id,
          amount: parseFloat(String(r.rate || 0)),
          carrier: String(r.carrier_code || "Carrier").toUpperCase(),
          serviceName: String(r.service || "Shipping Service"),
          rateId: String(r.service_id),
          expiresAt: new Date(Date.now() + SECURE_RATE_TTL).toISOString(),
        };
        const signature = signRate(rateData);
        // We encode the rateData and signature into the secureRateId
        const secureRateId = Buffer.from(JSON.stringify({ d: rateData, s: signature })).toString('base64');
        
        return {
          ...r,
          secureRateId
        };
      });

      return res.json({ ...data, service_rates: responseRates });
    }

    res.json(data);
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
  }
});

router.post("/void-shipment", authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { shipmentId, carrierId } = req.body;

    if (!shipmentId || !carrierId) {
       return res.status(400).json({ error: "shipmentId and carrierId are required" });
    }

    const data = await voidShipment(String(carrierId), String(shipmentId));
    res.json(data);
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
  }
});

export default router;
