
// Initialize Supabase with the project-specific credentials.
// Environment variables are checked first for production security.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://outulhuazozssmnmdfcw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_JcuNwX54U-lOwaRH2raHIA_wEXV0HKd';

let supabase: any = null;

export const getSupabase = async () => {
  if (supabase) return supabase;
  
  try {
    // Dynamically importing the Supabase client to ensure compatibility with the runtime environment.
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  } catch (e) {
    console.error("Failed to load Supabase client", e);
    return null;
  }
};
