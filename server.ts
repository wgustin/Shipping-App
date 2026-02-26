import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

let stripeClient: Stripe | null = null;
const getStripe = () => {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2023-10-16",
    });
  }
  return stripeClient;
};

// Initialize Supabase on server
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Warning: STRIPE_SECRET_KEY is missing. Stripe features will not work.");
}

// Helper to format addresses for eHub
const formatAddressForEhub = (addr: any) => {
  return {
    company: (addr.name || "Recipient").substring(0, 50),
    first_name: "",
    last_name: "",
    phone: (addr.phone || "5555555555").replace(/\D/g, '').substring(0, 10) || "5555555555",
    email: (addr.email || "customer@shipeasy.app").substring(0, 50),
    address1: (addr.street1 || "").substring(0, 50),
    address2: (addr.street2 || "").substring(0, 50),
    city: (addr.city || "").substring(0, 35),
    state: (addr.state || "").toUpperCase().trim().substring(0, 2),
    country: (addr.country || "US").toUpperCase().trim().substring(0, 2),
    postal_code: (addr.zip || "").trim().substring(0, 10)
  };
};

async function startServer() {
  const app = express();
  // Default to 3000 for local/preview environment, but respect PORT for Cloud Run
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { rate, from, to, pkg, userId } = req.body;

      if (!rate || !userId) {
        return res.status(400).json({ error: "Missing required information" });
      }

      // In a real app, you'd verify the rate price on the server
      const amount = Math.round(rate.totalAmount * 100); // Stripe expects cents

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Shipping Label: ${rate.carrier} ${rate.serviceName}`,
                description: `From: ${from.city}, ${from.state} To: ${to.city}, ${to.state}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        // APP_URL is provided by the platform
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/?status=cancel`,
        metadata: {
          userId,
          rateId: rate.id,
          carrier: rate.carrier,
          serviceName: rate.serviceName
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Session Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { rate, userId } = req.body;

      if (!rate || !userId) {
        return res.status(400).json({ error: "Missing required information" });
      }

      // In a real app, verify the rate price on the server
      const amount = Math.round(rate.totalAmount * 100);

      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          userId,
          rateId: rate.id,
          carrier: rate.carrier,
          serviceName: rate.serviceName
        },
        payment_method_types: ['card'],
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe Payment Intent Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/rates", async (req, res) => {
    try {
      const payload = req.body;
      const EHUB_API_KEY = process.env.EHUB_API_KEY;
      const EHUB_BASE_URL = "https://api.ehub.com/api/v2";

      if (!EHUB_API_KEY || EHUB_API_KEY.trim() === '') {
        console.error("EHUB_API_KEY is missing or empty");
        return res.status(500).json({ error: "Server configuration error: eHub API key is not set." });
      }

      const response = await fetch(`${EHUB_BASE_URL}/rates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EHUB_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("eHub API Error:", data);
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (error: any) {
      console.error("Rate Fetch Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/validate-address", async (req, res) => {
    try {
      const params = new URLSearchParams(req.body);
      const EHUB_API_KEY = process.env.EHUB_API_KEY;
      const EHUB_BASE_URL = "https://api.ehub.com/api/v2";

      if (!EHUB_API_KEY) {
        return res.status(500).json({ error: "Server configuration error" });
      }

      const response = await fetch(`${EHUB_BASE_URL}/shipping/validate_address?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${EHUB_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/shipments", async (req, res) => {
    try {
      const { userId, from, to, rate, pkg } = req.body;
      const EHUB_API_KEY = process.env.EHUB_API_KEY;
      const EHUB_BASE_URL = "https://api.ehub.com/api/v2";
      const authHeader = req.headers.authorization;

      if (!EHUB_API_KEY) {
        return res.status(500).json({ error: "Server configuration error" });
      }

      if (!userId || !from || !to || !rate || !pkg) {
        return res.status(400).json({ error: "Missing required shipment data" });
      }

      // Create authenticated Supabase client if token exists
      let authenticatedSupabase = supabase;
      if (authHeader) {
        authenticatedSupabase = createClient(supabaseUrl, supabaseKey, {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        });
      }

      const payload = {
        shipment: {
          to_location: formatAddressForEhub(to),
          from_location: formatAddressForEhub(from),
          return_location: formatAddressForEhub(from),
          parcels: [{
            length: Number(pkg.length) || 1,
            width: Number(pkg.width) || 1,
            height: Number(pkg.height) || 1,
            weight: Math.max(Number(pkg.weight) * 16.0, 1),
            package_type: "parcel"
          }],
          service_id: parseInt(rate.id, 10),
          label_format: "pdf",
          label_size: "4x6"
        }
      };

      const response = await fetch(`${EHUB_BASE_URL}/shipments/ship`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EHUB_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const rawText = await response.text();
      let ehubData;
      try {
        ehubData = JSON.parse(rawText);
      } catch (e) {
        return res.status(500).json({ error: "Invalid JSON response from carrier" });
      }

      if (!response.ok) {
        const errMsg = ehubData.message || ehubData.error || `Carrier Error: ${response.status}`;
        return res.status(response.status).json({ error: errMsg, details: ehubData });
      }

      const sData = ehubData.shipment || ehubData;
      const trackingNumber = sData.tracking_number || (sData.parcels && sData.parcels[0]?.tracking_number);
      const labelUrl = sData.parcels && sData.parcels[0]?.postage_label?.image_url;
      const carrierId = sData.id || ehubData.id || sData.shipment_id || ehubData.shipment_id;

      if (!trackingNumber) {
        return res.status(500).json({ error: "Label purchased, but no tracking number returned." });
      }

      const packageWithCarrierId = {
        ...pkg,
        carrierId: String(carrierId || "")
      };

      // Save to Supabase using authenticated client
      const { data: dbData, error: dbError } = await authenticatedSupabase
        .from('shipments')
        .insert([{
          user_id: userId,
          from_address_json: from,
          to_address_json: to,
          package_details: packageWithCarrierId,
          selected_rate: rate,
          tracking_number: trackingNumber,
          label_url: labelUrl || "",
          status: 'created'
        }])
        .select()
        .single();

      if (dbError) {
        console.error("Supabase Save Error:", dbError);
        // Even if DB save fails, return the label so the user isn't charged for nothing
        return res.json({
          id: 'temp_' + Date.now(),
          createdDate: new Date().toISOString(),
          fromAddress: from,
          toAddress: to,
          packageDetails: packageWithCarrierId,
          selectedRate: rate,
          trackingNumber: trackingNumber,
          labelUrl: labelUrl || "",
          status: 'created',
          warning: "Shipment created but failed to save to history."
        });
      }

      // Return the DB object structure expected by the frontend
      res.json({
        id: dbData.id,
        createdDate: dbData.created_at,
        fromAddress: dbData.from_address_json,
        toAddress: dbData.to_address_json,
        packageDetails: dbData.package_details,
        selectedRate: dbData.selected_rate,
        trackingNumber: dbData.tracking_number,
        labelUrl: dbData.label_url,
        status: dbData.status
      });

    } catch (error: any) {
      console.error("Shipment Creation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/void-shipment", async (req, res) => {
    try {
      const { carrierId } = req.body;
      const EHUB_API_KEY = process.env.EHUB_API_KEY;
      const EHUB_BASE_URL = "https://api.ehub.com/api/v2";

      if (!EHUB_API_KEY) {
        return res.status(500).json({ error: "Server configuration error" });
      }

      const response = await fetch(`${EHUB_BASE_URL}/shipments/${carrierId}/void`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EHUB_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/checkout-session/:id", async (req, res) => {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(req.params.id);
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware loaded in development mode");
    } catch (e) {
      console.error("Failed to load Vite middleware:", e);
    }
  } else {
    app.use(express.static("dist"));
    app.get('(.*)', (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
