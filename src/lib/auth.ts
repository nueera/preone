// ============================================================
// PreOne — Auth Utility
// JWT-based authentication with HMAC-SHA256 signing
// Uses bcryptjs for password hashing
// ============================================================

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

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

// Route prefixes mapped to required roles
// TASK_MASTER uses /admin routes (same layout, CRM-only access filtered by sidebar + middleware)
export const ROLE_ROUTE_MAP: Record<string, Role> = {
  '/admin': Role.ADMIN,
  '/teacher': Role.TEACHER,
  '/parent': Role.PARENT,
};

// ============================================================
// Password Hashing (using bcryptjs)
// ============================================================

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// Legacy alias for backward compatibility
export const verifyPassword = comparePassword;

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

// Secret key for signing tokens — JWT_SECRET in production
const JWT_SECRET = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'preone-demo-secret-key-2024';

function sign(data: string): string {
  return createHmac('sha256', JWT_SECRET).update(data).digest('hex');
}

export function generateToken(payload: { userId: string; role: string; schoolId?: string | null; email?: string; name?: string; branchId?: string | null }): string {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const fullPayload: TokenPayload & { expiresAt: number } = {
    userId: payload.userId,
    email: payload.email || '',
    name: payload.name || '',
    role: payload.role as Role,
    branchId: payload.branchId ?? null,
    schoolId: payload.schoolId ?? null,
    expiresAt,
  };

  const payloadData = JSON.stringify(fullPayload);
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
      email: payload.email || '',
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

export function getAuthUser(request: NextRequest | Request): TokenPayload | null {
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

export function isTaskMaster(user: TokenPayload): boolean {
  return user.role === Role.TASK_MASTER;
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

export function requireTaskMaster(request: NextRequest): TokenPayload | NextResponse {
  return requireRole(request, Role.TASK_MASTER);
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

// ============================================================
// Role-based redirect helper
// ============================================================

export function getDashboardPath(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return '/admin/dashboard';
    case Role.TASK_MASTER:
      return '/admin/crm';  // TASK_MASTER lands on CRM page within Admin portal
    case Role.TEACHER:
      return '/teacher/dashboard';
    case Role.PARENT:
      return '/parent/dashboard';
    default:
      return '/login';
  }
}
