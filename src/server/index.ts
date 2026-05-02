
import express, { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import hpp from "hpp";
import { serverConfig } from "./config";
import { getErrorMessage } from "../shared/utils/errors";
import { apiSecurityHeaders, apiLimiter, strictApiLimiter, apiSpeedLimiter } from "./middleware/security";

// Routes
import addressRoutes from "./routes/addresses";
import shipmentRoutes from "./routes/shipments";
import aiRoutes from "./routes/ai";
import paymentRoutes from "./routes/payments";
import carrierRoutes from "./routes/carrier";
import authRoutes from "./routes/auth";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

dotenv.config();

export const app = express();

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0, 
    profilesSampleRate: 1.0,
  });
}

// Trust proxy for rate limiting behind Nginx/Cloud Run
app.set("trust proxy", 1);

// Middlewares
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [serverConfig.APP_URL || '', process.env.SHARED_APP_URL || ''] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(morgan("dev"));

// Apply security headers to all routes
app.use(apiSecurityHeaders);

// Stripe Webhook needs raw body - mount BEFORE express.json()
app.use("/api/webhooks/stripe", express.raw({ type: "application/json", limit: '500kb' }));

app.use(express.json({ limit: '50kb' }));
app.use(hpp());

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestId = req.headers["x-request-id"] as string || Math.random().toString(36).substring(7);
  next();
});

// Apply general API rate limiter to all /api routes
app.use("/api", apiSpeedLimiter);
app.use("/api", apiLimiter);

// API Routes
app.use("/api/addresses", addressRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/ai", strictApiLimiter, aiRoutes); // Strict limiter for AI
app.use("/api/auth", authRoutes);
app.use("/api", paymentRoutes); // We can apply strict limiter to payment routes inside the router or here
app.use("/api", carrierRoutes);

// Vite middleware for development
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));
    app.get("*all", async (req, res) => {
      try {
        const htmlPath = path.join(distPath, "index.html");
        let html = await fs.promises.readFile(htmlPath, "utf-8");
        
        const env = {
          STRIPE_PUBLISHABLE_KEY: serverConfig.VITE_STRIPE_PUBLISHABLE_KEY || serverConfig.STRIPE_PUBLISHABLE_KEY,
          NODE_ENV: "production"
        };
        
        const envScript = `<script>window.ENV = ${JSON.stringify(env)};</script>`;
        html = html.replace("<head>", `<head>${envScript}`);
        
        res.send(html);
      } catch (err) {
        console.error("Error serving index.html:", err);
        res.status(500).send("Internal Server Error");
      }
    });
  }

  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[${req.requestId}] 🚨 Unhandled Error:`, err);
    res.status(err.status || 500).json({
      error: getErrorMessage(err),
      requestId: req.requestId
    });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

if (process.env.NODE_ENV !== "test") {
  setupServer().catch(err => {
    console.error("🚨 Failed to start server:", err);
    process.exit(1);
  });
}

// Global error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("🚨 Uncaught Exception:", error);
  setTimeout(() => process.exit(1), 1000);
});

export default app;
