import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !publishableKey) return false;
  if (
    supabaseUrl.includes('your-project') ||
    publishableKey.includes('your-publishable-key') ||
    publishableKey.includes('your-anon-key')
  ) {
    return false;
  }
  return true;
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are missing or invalid.');
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl!, publishableKey!);
  }
  return clientInstance;
}
