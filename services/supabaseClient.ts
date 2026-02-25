
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

const rawSupabaseUrl = getEnvVar('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY');

// Ensure URL has protocol
const SUPABASE_URL = rawSupabaseUrl && !rawSupabaseUrl.startsWith('http') 
  ? `https://${rawSupabaseUrl}` 
  : rawSupabaseUrl;

let supabaseInstance: any = null;
let initializationPromise: Promise<any> | null = null;

export const getSupabase = async () => {
  if (supabaseInstance) return supabaseInstance;
  
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn("Supabase credentials missing. Auth and DB features will be limited.");
        return null;
      }

      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });
      return supabaseInstance;
    } catch (e) {
      console.error("Failed to initialize Supabase client", e);
      initializationPromise = null;
      return null;
    }
  })();

  return initializationPromise;
};
