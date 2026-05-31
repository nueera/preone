import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// ROLE SYSTEM — 3 Core Roles
// ============================================================

export enum Role {
  Admin = 'Admin',
  Teacher = 'Teacher',
  Parent = 'Parent',
}

export const ALL_ROLES = [Role.Admin, Role.Teacher, Role.Parent] as const;

// Permission tiers: Admin > Teacher > Parent
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.Admin]: 100,
  [Role.Parent]: 50,
  [Role.Teacher]: 50,
};

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
// Token Payload — Strongly Typed
// ============================================================

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
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

    // Validate role is a known role
    const role = payload.role as string;
    if (!ALL_ROLES.includes(role as Role)) return null;

    return {
      userId: payload.userId,
      email: payload.email,
      role: role as Role,
      branchId: payload.branchId,
    };
  } catch {
    return null;
  }
}

// ============================================================
// Auth Helpers for API Routes
// ============================================================

export function getAuthUser(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireAuth(request: NextRequest): TokenPayload | null {
  return getAuthUser(request);
}

// ============================================================
// Role-Based Access Control (RBAC)
// ============================================================

/**
 * Check if a user has one of the allowed roles.
 */
export function hasRole(user: TokenPayload, ...allowedRoles: Role[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Check if user is Admin.
 */
export function isAdmin(user: TokenPayload): boolean {
  return user.role === Role.Admin;
}

/**
 * Check if user is Teacher.
 */
export function isTeacher(user: TokenPayload): boolean {
  return user.role === Role.Teacher;
}

/**
 * Check if user is Parent.
 */
export function isParent(user: TokenPayload): boolean {
  return user.role === Role.Parent;
}

/**
 * Create a 401 Unauthorized response.
 */
export function unauthorized(message = 'Authentication required'): NextResponse {
  return NextResponse.json({ error: true, message }, { status: 401 });
}

/**
 * Create a 403 Forbidden response.
 */
export function forbidden(message = 'You do not have permission to access this resource'): NextResponse {
  return NextResponse.json({ error: true, message }, { status: 403 });
}

/**
 * Require auth + specific roles. Returns user if authorized, or NextResponse if not.
 * Usage: const user = requireRole(request, Role.Admin); if (user instanceof NextResponse) return user;
 */
export function requireRole(request: NextRequest, ...allowedRoles: Role[]): TokenPayload | NextResponse {
  const user = getAuthUser(request);
  if (!user) return unauthorized();
  if (!hasRole(user, ...allowedRoles)) return forbidden();
  return user;
}

/**
 * Require auth + Admin role. Returns user if authorized, or NextResponse if not.
 * Usage: const user = requireAdmin(request); if (user instanceof NextResponse) return user;
 */
export function requireAdmin(request: NextRequest): TokenPayload | NextResponse {
  return requireRole(request, Role.Admin);
}

/**
 * Require auth + Teacher role.
 */
export function requireTeacher(request: NextRequest): TokenPayload | NextResponse {
  return requireRole(request, Role.Teacher);
}

/**
 * Require auth + Parent role.
 */
export function requireParent(request: NextRequest): TokenPayload | NextResponse {
  return requireRole(request, Role.Parent);
}

// ============================================================
// Branch Isolation Helper
// ============================================================

/**
 * Build a Prisma where clause that enforces branch isolation.
 * Admin can optionally see all branches; Teacher/Parent are scoped to their branch.
 */
export function branchFilter(user: TokenPayload): Record<string, unknown> {
  if (user.branchId) {
    return { branchId: user.branchId };
  }
  return {};
}

/**
 * Enforce that a user can only access data within their branch.
 * Returns the branchId to filter by, or undefined if no restriction (admin without branch).
 */
export function getBranchScope(user: TokenPayload): string | undefined {
  return user.branchId || undefined;
}
