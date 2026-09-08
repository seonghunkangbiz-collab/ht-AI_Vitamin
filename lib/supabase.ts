import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) return false;
  return true;
}

let clientInstance: SupabaseClient | null = null;
let adminInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables are missing or invalid.');
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return clientInstance;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables are missing or invalid.');
  }

  if (!adminInstance) {
    const key = supabaseServiceKey && !supabaseServiceKey.includes('your-service-role')
      ? supabaseServiceKey
      : supabaseAnonKey!;
    adminInstance = createClient(supabaseUrl!, key);
  }
  return adminInstance;
}
