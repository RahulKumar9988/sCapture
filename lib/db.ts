
import { createClient } from '@supabase/supabase-js';

// Note: We use the SERVICE ROLE key on the server to bypass RLS (Row Level Security)
// so we can insert videos without the user being logged in.
// If you only have the ANON key, ensure your table RLS policies allow "INSERT" for public/anon.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Database operations will fail.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
