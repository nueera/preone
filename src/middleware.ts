import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// Token Verification (Edge-compatible — uses Web Crypto API)
// Mirrors the Node.js crypto logic in src/lib/auth.ts
// ============================================================

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'preone-demo-secret-key-2024';

async function sign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface VerifiedPayload {
  userId: string;
  email: string;
  role: string;
  branchId?: string | null;
}

async function verifyToken(token: string): Promise<VerifiedPayload | null> {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const expectedSig = await sign(payloadB64);

    // Timing-safe comparison
    if (signature.length !== expectedSig.length) return null;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    // Decode payload
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    // Check expiry
    if (Date.now() > payload.expiresAt) return null;

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
// Route Permission Map
// TASK_MASTER has same access as Admin for CRM routes
// ============================================================

type RoleName = 'Admin' | 'Teacher' | 'Parent' | 'TaskMaster';

interface RouteRule {
  pattern: RegExp;
  allowedRoles: RoleName[];
}

const ROUTE_RULES: RouteRule[] = [
  { pattern: /^\/api\/parent\/?/,        allowedRoles: ['Parent'] },
  { pattern: /^\/api\/teacher\/?/,        allowedRoles: ['Teacher'] },
  { pattern: /^\/api\/students\/?/,       allowedRoles: ['Admin'] },
  { pattern: /^\/api\/teachers\/?/,       allowedRoles: ['Admin'] },
  { pattern: /^\/api\/attendance\/?/,     allowedRoles: ['Admin'] },
  { pattern: /^\/api\/fees\/?/,           allowedRoles: ['Admin'] },
  // CRM routes: both Admin and TaskMaster can access
  { pattern: /^\/api\/crm\/?/,            allowedRoles: ['Admin', 'TaskMaster'] },
  { pattern: /^\/api\/dashboard\/?/,      allowedRoles: ['Admin', 'TaskMaster'] },
  { pattern: /^\/api\/growth\/?/,         allowedRoles: ['Admin', 'Teacher'] },
  { pattern: /^\/api\/communication\/?/,  allowedRoles: ['Admin'] },
  // Onboarding routes: Admin only
  { pattern: /^\/api\/onboarding\/?/,     allowedRoles: ['Admin'] },
  { pattern: /^\/api\/auth\/me$/,        allowedRoles: ['Admin', 'Teacher', 'Parent', 'TaskMaster'] },
];

// Auth routes that skip authentication entirely
const AUTH_ROUTE_PATTERNS: RegExp[] = [
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/register$/,
  /^\/api\/auth\/otp\//,
];

// ============================================================
// Middleware (async for Web Crypto API)
// ============================================================

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Skip auth routes (login, register, OTP) ──────────────
  if (AUTH_ROUTE_PATTERNS.some((p) => p.test(pathname))) {
    return NextResponse.next();
  }

  // ── Extract Bearer token ─────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: true, message: 'Authentication required' },
      { status: 401 },
    );
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: true, message: 'Invalid or expired token' },
      { status: 401 },
    );
  }

  // ── Find matching route rule ─────────────────────────────
  const matchedRule = ROUTE_RULES.find((rule) => rule.pattern.test(pathname));

  if (matchedRule) {
    // Map role string to RoleName for comparison
    const roleMap: Record<string, RoleName> = {
      'ADMIN': 'Admin',
      'TEACHER': 'Teacher',
      'PARENT': 'Parent',
      'TASK_MASTER': 'TaskMaster',
    };
    const roleName = roleMap[payload.role] as RoleName;
    if (!roleName || !matchedRule.allowedRoles.includes(roleName)) {
      return NextResponse.json(
        { error: true, message: 'You do not have permission to access this resource' },
        { status: 403 },
      );
    }
  }

  // ── Inject decoded payload into request headers for downstream use ──
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  if (payload.branchId) {
    requestHeaders.set('x-user-branch-id', payload.branchId);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

// ============================================================
// Matcher — only run on API routes
// ============================================================

export const config = {
  matcher: '/api/:path*',
};
