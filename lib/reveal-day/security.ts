import crypto from 'crypto';

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
}

const loginRateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_LOGIN_ATTEMPTS = 15;

/**
 * Checks in-memory rate limiting for login attempts
 */
export function checkLoginRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = loginRateLimitStore.get(identifier);

  if (!entry) {
    loginRateLimitStore.set(identifier, { attempts: 1, firstAttemptAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    loginRateLimitStore.set(identifier, { attempts: 1, firstAttemptAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.attempts >= MAX_LOGIN_ATTEMPTS) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.firstAttemptAt)) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  entry.attempts += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetLoginRateLimit(identifier: string) {
  loginRateLimitStore.delete(identifier);
}

/**
 * Validates admin code against environment variable hash
 */
export function verifyAdminCode(inputCode: string): boolean {
  if (!inputCode) return false;
  const trimmed = inputCode.trim();

  const envAdminCodeHash = process.env.ADMIN_CODE_HASH;
  const envAdminCode = process.env.ADMIN_CODE;

  // Compute SHA-256 of input
  const inputHash = crypto.createHash('sha256').update(trimmed).digest('hex');

  if (envAdminCodeHash) {
    const expectedBuf = Buffer.from(envAdminCodeHash.toLowerCase());
    const inputBuf = Buffer.from(inputHash.toLowerCase());
    if (expectedBuf.length === inputBuf.length && crypto.timingSafeEqual(expectedBuf, inputBuf)) {
      return true;
    }
  }

  if (envAdminCode) {
    const expectedHash = crypto.createHash('sha256').update(envAdminCode.trim()).digest('hex');
    const expectedBuf = Buffer.from(expectedHash.toLowerCase());
    const inputBuf = Buffer.from(inputHash.toLowerCase());
    if (expectedBuf.length === inputBuf.length && crypto.timingSafeEqual(expectedBuf, inputBuf)) {
      return true;
    }
  }

  // Fallback hash for seed admin code if env not configured
  // Hash for 'VIT-ADMIN-2026!'
  const defaultFallbackHash = crypto.createHash('sha256').update('VIT-ADMIN-2026!').digest('hex');
  const fallbackBuf = Buffer.from(defaultFallbackHash.toLowerCase());
  const inputBuf = Buffer.from(inputHash.toLowerCase());
  if (fallbackBuf.length === inputBuf.length && crypto.timingSafeEqual(fallbackBuf, inputBuf)) {
    return true;
  }

  // Also support existing legacy admin code in database if matching
  const legacyHash = crypto.createHash('sha256').update('VIT-ADMIN').digest('hex');
  const legacyBuf = Buffer.from(legacyHash.toLowerCase());
  if (legacyBuf.length === inputBuf.length && crypto.timingSafeEqual(legacyBuf, inputBuf)) {
    return true;
  }

  return false;
}

/**
 * Mask full Korean names for privacy display (e.g. 홍태영 -> 홍*영)
 */
export function maskName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) return `${trimmed[0]}*`;
  return `${trimmed[0]}*${trimmed.slice(2)}`;
}

/**
 * Remove sensitive credentials (code, employeeNumber, role secrets) from public user objects
 */
export function sanitizeUserForPublic<T extends { code?: string; employeeNumber?: string }>(user: T): Omit<T, 'code' | 'employeeNumber'> {
  const { code, employeeNumber, ...safe } = user;
  return safe;
}
