import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

// ============================================================
// ROLE SYSTEM — 4 Core Roles (Uppercase, matching Prisma enum)
// ============================================================

export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  TASK_MASTER = 'TASK_MASTER',
}

export const ALL_ROLES = [Role.ADMIN, Role.TEACHER, Role.PARENT, Role.TASK_MASTER] as const;

// Permission tiers: Admin > Task_Master > Teacher > Parent
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.ADMIN]: 100,
  [Role.TASK_MASTER]: 80,
  [Role.TEACHER]: 50,
  [Role.PARENT]: 30,
};

// ============================================================
// Password Hashing (using bcrypt)
// ============================================================

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, storedHash);
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
  name: string;
  role: Role;
  branchId?: string | null;
  schoolId?: string | null;
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
      name: payload.name || '',
      role: role as Role,
      branchId: payload.branchId,
      schoolId: payload.schoolId,
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

export function hasRole(user: TokenPayload, ...allowedRoles: Role[]): boolean {
  return allowedRoles.includes(user.role);
}

export function isAdmin(user: TokenPayload): boolean {
  return user.role === Role.ADMIN;
}

export function isTeacher(user: TokenPayload): boolean {
  return user.role === Role.TEACHER;
}

export function isParent(user: TokenPayload): boolean {
  return user.role === Role.PARENT;
}

export function unauthorized(message = 'Authentication required'): NextResponse {
  return NextResponse.json({ error: true, message }, { status: 401 });
}

export function forbidden(message = 'You do not have permission to access this resource'): NextResponse {
  return NextResponse.json({ error: true, message }, { status: 403 });
}

/**
 * Require auth + specific roles. Returns user if authorized, or NextResponse if not.
 */
export function requireRole(request: NextRequest, ...allowedRoles: Role[]): TokenPayload | NextResponse {
  const user = getAuthUser(request);
  if (!user) return unauthorized();
  if (!hasRole(user, ...allowedRoles)) return forbidden();
  return user;
}

export function requireAdmin(request: NextRequest): TokenPayload | NextResponse {
  return requireRole(request, Role.ADMIN);
}

export function requireTeacher(request: NextRequest): TokenPayload | NextResponse {
  return requireRole(request, Role.TEACHER);
}

export function requireParent(request: NextRequest): TokenPayload | NextResponse {
  return requireRole(request, Role.PARENT);
}

// ============================================================
// Branch Isolation Helper
// ============================================================

export function branchFilter(user: TokenPayload): Record<string, unknown> {
  if (user.branchId) {
    return { branchId: user.branchId };
  }
  return {};
}

export function getBranchScope(user: TokenPayload): string | undefined {
  return user.branchId || undefined;
}
