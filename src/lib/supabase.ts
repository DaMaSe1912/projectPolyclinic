import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client for browser / components (public operations & realtime listening)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Admin client for Next.js API route handlers (bypasses RLS securely on server)
export function getSupabaseAdmin() {
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!supabaseUrl || !key) {
    throw new Error('Supabase credentials missing in environment variables');
  }
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

