import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// ============================================================
// Password Hashing (using Node.js crypto HMAC-SHA256)
// ============================================================

const HASH_ALGORITHM = 'sha256';
const SALT_LENGTH = 16;

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
// Stateless Token Management (HMAC-signed JSON tokens)
// ============================================================

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  branchId?: string | null;
}

// Secret key for signing tokens — in production use env var
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'preone-demo-secret-key-2024';

function sign(data: string): string {
  return createHmac('sha256', TOKEN_SECRET).update(data).digest('hex');
}

export function generateToken(payload: TokenPayload): string {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payloadData = JSON.stringify({ ...payload, expiresAt });
  const payloadB64 = Buffer.from(payloadData).toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    // Verify signature
    const expectedSig = sign(payloadB64);
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return null;
    }

    // Decode payload
    const payloadData = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadData);

    // Check expiry
    if (Date.now() > payload.expiresAt) return null;

    // Return without expiresAt
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId,
    };
  } catch {
    return null;
  }
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
