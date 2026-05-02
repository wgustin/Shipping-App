
/**
 * Unified configuration for the client application.
 * Handles environment variables from both Vite (development) and 
 * server-side injection (production via window.ENV).
 */

interface ClientConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  NODE_ENV: string;
}

declare global {
  interface Window {
    ENV?: Record<string, string>;
  }
}

const getEnv = (key: string, defaultValue: string = ''): string => {
  // 1. Check window.ENV (injected by server in production)
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }

  // 2. Check import.meta.env (Vite development/build-time)
  // Vite prefixes are handled here
  const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  if (import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }

  // 3. Fallback to process.env if available (some test environments)
  // We use literal access for common keys to allow Vite's 'define' to work
  if (key === 'SUPABASE_URL' && typeof process !== 'undefined' && process.env.SUPABASE_URL) {
    return process.env.SUPABASE_URL;
  }
  if (key === 'SUPABASE_ANON_KEY' && typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY) {
    return process.env.SUPABASE_ANON_KEY;
  }
  if (key === 'STRIPE_PUBLISHABLE_KEY' && typeof process !== 'undefined' && process.env.STRIPE_PUBLISHABLE_KEY) {
    return process.env.STRIPE_PUBLISHABLE_KEY;
  }
  if (key === 'VITE_STRIPE_PUBLISHABLE_KEY' && typeof process !== 'undefined' && process.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  }

  if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
    return (process.env as any)[key];
  }

  return defaultValue;
};

export const config: ClientConfig = {
  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('SUPABASE_ANON_KEY'),
  STRIPE_PUBLISHABLE_KEY: getEnv('STRIPE_PUBLISHABLE_KEY'),
  NODE_ENV: import.meta.env.MODE || 'development',
};

// Validation in development
if (config.NODE_ENV === 'development') {
  const missing = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.warn(`[Config] Missing environment variables: ${missing.join(', ')}`);
  }
}
