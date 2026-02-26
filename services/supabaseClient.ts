
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with the project-specific credentials.
const getEnvVar = (key: string) => {
  // Check both process.env and import.meta.env for compatibility
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return '';
};

const rawSupabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');

// Ensure URL has protocol
const SUPABASE_URL = rawSupabaseUrl && !rawSupabaseUrl.startsWith('http') 
  ? `https://${rawSupabaseUrl}` 
  : rawSupabaseUrl;

let supabaseInstance: any = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'shipeasy-auth-token', // Custom key to avoid conflicts with other apps on the same domain
      }
    });
  } catch (e) {
    console.error("Failed to initialize Supabase client", e);
  }
} else {
  console.warn("Supabase credentials missing. Auth and DB features will be limited.");
}

export const getSupabase = async () => {
  return supabaseInstance;
};
