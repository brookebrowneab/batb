/**
 * Supabase client adapter.
 *
 * Initializes and exports the Supabase client using the anon/public key.
 * Service role key must NEVER be used in frontend code.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not set. Copy .env.example to .env and fill in your values.',
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
