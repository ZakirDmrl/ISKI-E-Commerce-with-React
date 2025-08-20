// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Bu bilgileri .env dosyasından almalısın
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Vite environment variable missing: VITE_SUPABASE_URL');
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
	  throw new Error('Vite environment variable missing: VITE_SUPABASE_ANON_KEY');
}



export const supabase = createClient(supabaseUrl, supabaseAnonKey);
