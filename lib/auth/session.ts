import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase';

export const SESSION_COOKIE_NAME = 'ai_vitamin_session';
const DEFAULT_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  role: 'admin' | 'user';
  name: string;
  team: string;
  avatar?: string;
  iat: number;
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }
  // Fallback persistent seed derived from SUPABASE_URL or a fixed seed
  const seed = process.env.SUPABASE_URL || 'ai_vitamin_default_production_session_secret_2026_ht_deepmind';
  return crypto.createHash('sha256').update(seed).digest('hex');
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Creates a signed JWT compact token (HMAC-SHA256)
 */
export function signSessionToken(payload: Omit<SessionPayload, 'iat' | 'exp'>, expiresInSeconds = DEFAULT_EXPIRATION_SECONDS): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const secret = getSessionSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed JWT compact token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const secret = getSessionSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return null;
  }

  try {
    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts session token from Request cookies or Authorization header
 */
export function getSessionFromRequest(request: Request): SessionPayload | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];

  if (token) {
    const payload = verifySessionToken(token);
    if (payload) return payload;
  }

  // Fallback to Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    return verifySessionToken(bearerToken);
  }

  return null;
}

/**
 * Helper to build Set-Cookie header
 */
export function createSessionCookie(token: string, maxAge = DEFAULT_EXPIRATION_SECONDS): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`;
}

/**
 * Helper to build clear cookie header
 */
export function createClearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

function parseCookies(cookieStr: string): Record<string, string> {
  const map: Record<string, string> = {};
  cookieStr.split(';').forEach(c => {
    const parts = c.trim().split('=');
    if (parts.length >= 2) {
      map[parts[0]] = decodeURIComponent(parts.slice(1).join('='));
    }
  });
  return map;
}

/**
 * Origin and CSRF validation for state-mutating requests (POST, PUT, DELETE, PATCH)
 */
export function checkCsrf(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return false;
      }
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Server middleware check: requires valid user session
 */
export function requireAuth(request: Request): { session: SessionPayload } | { errorResponse: Response } {
  if (!checkCsrf(request)) {
    return {
      errorResponse: new Response(JSON.stringify({ error: 'CSRF_VALIDATION_FAILED' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  const session = getSessionFromRequest(request);
  if (!session) {
    return {
      errorResponse: new Response(JSON.stringify({ error: 'UNAUTHORIZED: Login required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  return { session };
}

/**
 * Server middleware check: requires verified admin session AND checks DB role
 */
export async function requireAdmin(request: Request): Promise<{ session: SessionPayload } | { errorResponse: Response }> {
  const auth = requireAuth(request);
  if ('errorResponse' in auth) {
    return auth;
  }

  const { session } = auth;
  if (session.role !== 'admin') {
    return {
      errorResponse: new Response(JSON.stringify({ error: 'FORBIDDEN: Admin role required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  // Verify against database for current active role
  try {
    const supabase = getSupabaseServerClient();
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.userId)
      .maybeSingle();

    if (error || !dbUser || dbUser.role !== 'admin') {
      return {
        errorResponse: new Response(JSON.stringify({ error: 'FORBIDDEN: Revoked admin role' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      };
    }
  } catch (e) {
    // If Supabase check fails, fail-closed
    return {
      errorResponse: new Response(JSON.stringify({ error: 'AUTH_VERIFICATION_FAILED' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  return { session };
}
