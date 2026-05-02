import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import { createClient } from 'redis';
import RedisStore from 'rate-limit-redis';

// Initialize Redis client if URL is provided
let redisClient: ReturnType<typeof createClient> | undefined;
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  
  // Connect asynchronously
  redisClient.connect().catch(console.error);
}

// Apply basic security headers to API routes
export const apiSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://*.firebaseio.com", "https://firestore.googleapis.com", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://maps.googleapis.com", "ws:", "wss:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.stripe.com", "https://maps.gstatic.com", "https://maps.googleapis.com", "https://ehub-prod.s3.amazonaws.com", "https://www.usps.com", "https://www.fedex.com", "https://www.ups.com", "https://www.dhl.com", "https://images.unsplash.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      frameAncestors: ["*"], // Allow embedding in AI Studio iframe
    },
  },
  crossOriginEmbedderPolicy: false,
  xFrameOptions: false,
});

// General API speed limiter
export const apiSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 500, // allow 500 requests per 15 minutes, then...
  delayMs: (hits) => (hits - 500) * 100, // begin adding 100ms of delay per request above 500
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  // Use Redis store if client is available
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
    }),
  }),
});

// Stricter rate limiter for sensitive routes (e.g., payments, AI)
export const strictApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests for this endpoint, please try again later' },
  // Use Redis store if client is available
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
      prefix: 'rl:strict:',
    }),
  }),
});
