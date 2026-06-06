// ============================================================
// PreOne — Unified Middleware
// Handles BOTH page-level auth (cookie → redirect) AND
// API-level auth (Bearer token → 401/403)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// Token Verification (Edge-compatible — uses Web Crypto API)
// ============================================================

const TOKEN_SECRET = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'preone-demo-secret-key-2024';

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
  name?: string;
  role: string;
  branchId?: string | null;
  schoolId?: string | null;
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
      name: payload.name,
      role: payload.role,
      branchId: payload.branchId,
      schoolId: payload.schoolId,
    };
  } catch {
    return null;
  }
}

// ============================================================
// Public Routes (no auth required)
// ============================================================

const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

const PUBLIC_PATTERNS = [
  /^\/_next\//,
  /^\/favicon\.ico/,
  /^\/preonelogo\.png/,
  /^\/logo\.svg/,
  /^\/robots\.txt/,
];

// Auth API routes that skip auth entirely
const AUTH_API_PATTERNS: RegExp[] = [
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/register$/,
  /^\/api\/auth\/otp\//,
];

// ============================================================
// API Route Permission Map
// ============================================================

type RoleName = 'Admin' | 'Teacher' | 'Parent' | 'TaskMaster';

interface RouteRule {
  pattern: RegExp;
  allowedRoles: RoleName[];
}

const API_ROUTE_RULES: RouteRule[] = [
  { pattern: /^\/api\/parent\/?/,        allowedRoles: ['Parent'] },
  { pattern: /^\/api\/teacher\/?/,        allowedRoles: ['Teacher'] },
  { pattern: /^\/api\/students\/?/,       allowedRoles: ['Admin'] },
  { pattern: /^\/api\/teachers\/?/,       allowedRoles: ['Admin'] },
  { pattern: /^\/api\/attendance\/?/,     allowedRoles: ['Admin'] },
  { pattern: /^\/api\/fees\/?/,           allowedRoles: ['Admin'] },
  { pattern: /^\/api\/crm\/?/,            allowedRoles: ['Admin', 'TaskMaster'] },
  { pattern: /^\/api\/dashboard\/?/,      allowedRoles: ['Admin', 'TaskMaster'] },
  { pattern: /^\/api\/growth\/?/,         allowedRoles: ['Admin', 'Teacher'] },
  { pattern: /^\/api\/communication\/?/,  allowedRoles: ['Admin'] },
  { pattern: /^\/api\/onboarding\/?/,     allowedRoles: ['Admin'] },
  { pattern: /^\/api\/auth\/me$/,         allowedRoles: ['Admin', 'Teacher', 'Parent', 'TaskMaster'] },
];

// ============================================================
// TASK_MASTER route restrictions (within /admin)
// ============================================================

const TASK_MASTER_ALLOWED_PREFIXES = [
  '/admin/dashboard',
  '/admin/crm',
  '/admin/chat',
  '/admin/announcements',
];

// ============================================================
// Middleware
// ============================================================

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Allow public routes ────────────────────────────────────
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // ── Allow static assets ────────────────────────────────────
  if (PUBLIC_PATTERNS.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // ── Allow root page ────────────────────────────────────────
  if (pathname === '/') {
    return NextResponse.next();
  }

  // ── Handle API routes (Bearer token auth) ──────────────────
  if (pathname.startsWith('/api/')) {
    // Skip auth API routes
    if (AUTH_API_PATTERNS.some(p => p.test(pathname))) {
      return NextResponse.next();
    }

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

    // ── Check API route permissions ───────────────────────────
    const matchedRule = API_ROUTE_RULES.find(rule => rule.pattern.test(pathname));

    if (matchedRule) {
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

    // Inject user info into request headers
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

  // ── Handle page routes (cookie-based auth) ─────────────────
  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/parent');

  // Legacy /taskmaster routes → redirect to /admin/crm
  if (pathname.startsWith('/taskmaster')) {
    const token = request.cookies.get('preone_token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', '/admin/crm');
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.redirect(new URL('/admin/crm', request.url));
  }

  if (!isProtectedRoute) {
    // Not a protected page route, allow through
    return NextResponse.next();
  }

  // Get token from cookie
  const tokenCookie = request.cookies.get('preone_token');
  const token = tokenCookie?.value;

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const payload = await verifyToken(token);
  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('preone_token');
    return response;
  }

  // ── Role-based page route access ───────────────────────────

  // /admin routes: ADMIN and TASK_MASTER can access
  if (pathname.startsWith('/admin')) {
    if (payload.role !== 'ADMIN' && payload.role !== 'TASK_MASTER') {
      const dashboardPath = payload.role === 'TEACHER' ? '/teacher/dashboard' :
                           payload.role === 'PARENT' ? '/parent/dashboard' : '/login';
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // TASK_MASTER can only access allowed pages within /admin
    if (payload.role === 'TASK_MASTER') {
      const isAllowed = TASK_MASTER_ALLOWED_PREFIXES.some(prefix =>
        pathname === prefix || pathname.startsWith(prefix + '/')
      );
      if (!isAllowed) {
        return NextResponse.redirect(new URL('/admin/crm', request.url));
      }
    }
  }

  // /teacher routes: only TEACHER
  if (pathname.startsWith('/teacher') && payload.role !== 'TEACHER') {
    const defaultRoute = payload.role === 'ADMIN' ? '/admin/dashboard' :
                         payload.role === 'TASK_MASTER' ? '/admin/crm' :
                         payload.role === 'PARENT' ? '/parent/dashboard' : '/login';
    return NextResponse.redirect(new URL(defaultRoute, request.url));
  }

  // /parent routes: only PARENT
  if (pathname.startsWith('/parent') && payload.role !== 'PARENT') {
    const defaultRoute = payload.role === 'ADMIN' ? '/admin/dashboard' :
                         payload.role === 'TASK_MASTER' ? '/admin/crm' :
                         payload.role === 'TEACHER' ? '/teacher/dashboard' : '/login';
    return NextResponse.redirect(new URL(defaultRoute, request.url));
  }

  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-email', payload.email);
  if (payload.schoolId) requestHeaders.set('x-school-id', payload.schoolId);
  if (payload.branchId) requestHeaders.set('x-branch-id', payload.branchId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

// ============================================================
// Matcher — run on all routes except static assets
// ============================================================

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
