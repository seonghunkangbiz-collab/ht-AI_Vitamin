import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const publishableKey = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

export class SupabaseSecretKeyMissingError extends Error {
  constructor(message = 'SUPABASE_SECRET_KEY_MISSING: Operation requires administrative privileges but secret key is not set.') {
    super(message);
    this.name = 'SupabaseSecretKeyMissingError';
  }
}

let serverClientInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

export function hasSupabaseSecretKey(): boolean {
  return Boolean(secretKey && !secretKey.includes('your_secret_key') && !secretKey.includes('your-secret-key'));
}

/**
 * Standard server client. Uses publishable key for public reads.
 * If requireSecret is true, fails closed if secret key is missing.
 */
export function getSupabaseServerClient(options?: { requireSecret?: boolean }): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables are missing or invalid.');
  }

  if (options?.requireSecret) {
    return getSupabaseAdminClient();
  }

  if (!serverClientInstance) {
    const keyToUse = hasSupabaseSecretKey() ? secretKey! : publishableKey!;
    serverClientInstance = createClient(supabaseUrl!, keyToUse, {
      auth: {
        persistSession: false
      }
    });
  }
  return serverClientInstance;
}

/**
 * Strict fail-closed administrative client.
 * NEVER falls back to publishable key.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables are missing or invalid.');
  }

  if (!hasSupabaseSecretKey()) {
    throw new SupabaseSecretKeyMissingError();
  }

  if (!adminClientInstance) {
    adminClientInstance = createClient(supabaseUrl!, secretKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return adminClientInstance;
}
