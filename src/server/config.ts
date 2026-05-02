import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required").optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  EHUB_API_KEY: z.string().min(1, "EHUB_API_KEY is required").optional(),
  APP_URL: z.string().url("APP_URL must be a valid URL").optional(),
  GEMINI_API_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required for scheduled tasks").optional(),
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  MAILGUN_FROM_EMAIL: z.string().optional(),
  MAILGUN_REGION: z.enum(['US', 'EU']).default('US'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const parseEnv = () => {
  const result = serverEnvSchema.safeParse(process.env);
  
  if (!result.success) {
    const isProd = process.env.NODE_ENV === 'production';
    const errorMessages = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    
    if (isProd) {
      console.error('❌ Critical environment variable error:', errorMessages);
      throw new Error(`Production startup failed due to invalid environment variables: ${errorMessages}`);
    } else {
      console.warn('⚠️ Environment variable warning:', errorMessages);
      // Return partially parsed data or fallback
      return {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: Number(process.env.PORT) || 3000,
        APP_URL: process.env.APP_URL || 'http://localhost:3000',
      } as unknown as ServerEnv;
    }
  }
  
  const data = result.data;
  
  // Alias STRIPE_PUBLISHABLE_KEY
  if (!data.VITE_STRIPE_PUBLISHABLE_KEY && data.STRIPE_PUBLISHABLE_KEY) {
    data.VITE_STRIPE_PUBLISHABLE_KEY = data.STRIPE_PUBLISHABLE_KEY;
  }

  // Apply default for APP_URL if missing and not in production
  if (!data.APP_URL && data.NODE_ENV !== 'production') {
    data.APP_URL = 'http://localhost:3000';
  }
  
  return data;
};

export const serverConfig = parseEnv();

export const validateConfig = () => {
  const isProd = serverConfig.NODE_ENV === 'production';
  
  const required = [
    { key: 'STRIPE_SECRET_KEY', value: serverConfig.STRIPE_SECRET_KEY },
    { key: 'STRIPE_WEBHOOK_SECRET', value: serverConfig.STRIPE_WEBHOOK_SECRET },
    { key: 'EHUB_API_KEY', value: serverConfig.EHUB_API_KEY },
    { key: 'APP_URL', value: serverConfig.APP_URL },
    { key: 'CRON_SECRET', value: serverConfig.CRON_SECRET },
    { key: 'GOOGLE_MAPS_API_KEY', value: serverConfig.GOOGLE_MAPS_API_KEY },
    { key: 'MAILGUN_API_KEY', value: serverConfig.MAILGUN_API_KEY },
    { key: 'MAILGUN_DOMAIN', value: serverConfig.MAILGUN_DOMAIN },
  ];

  const missing = required.filter(r => !r.value).map(r => r.key);

  console.log('🚀 [Server] Environment Variable Check:');
  required.forEach(r => {
    console.log(`   - ${r.key}: ${r.value ? '✅ Detected' : '❌ MISSING'}`);
  });

  if (missing.length > 0) {
    const msg = `❌ Missing required environment variables for production: ${missing.join(', ')}`;
    if (isProd) {
      console.error(msg);
      throw new Error(msg);
    } else {
      console.warn(`⚠️ ${msg}. Some features will be disabled or broken.`);
    }
  }
};
