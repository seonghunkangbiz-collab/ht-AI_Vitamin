import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

let serverInstance: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables are missing or invalid.');
  }

  if (!serverInstance) {
    // Prefer SUPABASE_SECRET_KEY for full server-side database access if provided
    const key = (secretKey && !secretKey.includes('your-secret-key'))
      ? secretKey
      : publishableKey!;
    serverInstance = createClient(supabaseUrl!, key, {
      auth: {
        persistSession: false
      }
    });
  }
  return serverInstance;
}
