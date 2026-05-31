import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// ============================================================
// Password Hashing (using Node.js crypto - scrypt-like approach)
// ============================================================

const HASH_ALGORITHM = 'sha256';
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const hash = createHmac(HASH_ALGORITHM, salt)
    .update(password)
    .digest('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const computedHash = createHmac(HASH_ALGORITHM, salt)
    .update(password)
    .digest('hex');
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch {
    return false;
  }
}

// ============================================================
// Simple Token Management (in-memory for dev, use DB in prod)
// ============================================================

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  branchId?: string | null;
}

// In-memory token store — replace with Redis/DB in production
const tokenStore = new Map<string, { payload: TokenPayload; expiresAt: number }>();

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateToken(payload: TokenPayload): string {
  const token = randomBytes(32).toString('hex');
  tokenStore.set(token, {
    payload,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
  });
  return token;
}

export function verifyToken(token: string): TokenPayload | null {
  const entry = tokenStore.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokenStore.delete(token);
    return null;
  }
  return entry.payload;
}

export function revokeToken(token: string): void {
  tokenStore.delete(token);
}

// ============================================================
// Auth Helper for API Routes
// ============================================================

import { NextRequest } from 'next/server';

export function getAuthUser(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireAuth(request: NextRequest): TokenPayload | { error: boolean; message: string; status: number } {
  const user = getAuthUser(request);
  if (!user) {
    return { error: true, message: 'Authentication required', status: 401 };
  }
  return user;
}
