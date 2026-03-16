import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Client Initialization
 * ------------------------------
 * This client is used by the frontend to communicate directly with Supabase
 * for real-time data polling and fetching sensor history.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Initialize the client only if environment variables are present to avoid runtime errors
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
