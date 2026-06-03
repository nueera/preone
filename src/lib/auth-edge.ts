// ============================================================
// PreOne — Edge-compatible Auth for Middleware
// Lightweight token parser without Node.js crypto dependency
// Uses Web APIs only (Edge Runtime compatible)
// ============================================================

// Role enum matching Prisma schema
export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  TASK_MASTER = 'TASK_MASTER',
}

// Route prefixes mapped to required roles
// TASK_MASTER uses /admin routes (same portal, CRM-only access)
export const ROLE_ROUTE_MAP: Record<string, Role> = {
  '/admin': Role.ADMIN,
  '/teacher': Role.TEACHER,
  '/parent': Role.PARENT,
};

// Role-based redirect helper
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

// Lightweight token payload type
interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  branchId?: string | null;
  schoolId?: string | null;
  expiresAt: number;
}

/**
 * Parse and validate JWT token for middleware use (Edge Runtime compatible).
 * This does NOT verify the HMAC signature (that happens in API routes with Node.js crypto).
 * Instead, it checks: valid base64, valid JSON, not expired, valid role.
 * Full cryptographic verification happens in API routes via /src/lib/auth.ts
 */
export function parseToken(token: string): TokenPayload | null {
  try {
    const [payloadB64] = token.split('.');
    if (!payloadB64) return null;

    // Decode payload (base64url → UTF-8 string → JSON)
    const payloadData = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadData) as TokenPayload;

    // Check expiry
    if (!payload.expiresAt || Date.now() > payload.expiresAt) return null;

    // Validate role is a known role
    const validRoles = [Role.ADMIN, Role.TEACHER, Role.PARENT, Role.TASK_MASTER];
    if (!validRoles.includes(payload.role as Role)) return null;

    return payload;
  } catch {
    return null;
  }
}
