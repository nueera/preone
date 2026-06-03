// ============================================================
// PreOne — Next.js Middleware
// Route protection with JWT-based role verification
// Protects /admin, /teacher, /parent routes
// TASK_MASTER uses /admin routes (CRM + Dashboard only)
// Uses edge-compatible token parser (no Node.js crypto)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { parseToken, Role } from '@/lib/auth-edge';

// ============================================================
// Public routes that don't require authentication
// ============================================================

const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

// Static assets and Next.js internals
const PUBLIC_PATTERNS = [
  /^\/_next\//,
  /^\/favicon\.ico/,
  /^\/preonelogo\.png/,
  /^\/logo\.svg/,
  /^\/robots\.txt/,
];

// ============================================================
// TASK_MASTER route restrictions
// Can only access: /admin/dashboard, /admin/crm
// ============================================================

const TASK_MASTER_ALLOWED_PREFIXES = [
  '/admin/dashboard',
  '/admin/crm',
];

// ============================================================
// Middleware
// ============================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (PUBLIC_PATTERNS.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // Allow API routes (they handle their own auth via getAuthUser)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow root page
  if (pathname === '/') {
    return NextResponse.next();
  }

  // ── Check if this is a protected route ──
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
    // Not a protected route, allow through
    return NextResponse.next();
  }

  // Get token from cookie
  let token: string | null = null;
  const tokenCookie = request.cookies.get('preone_token');
  if (tokenCookie) {
    token = tokenCookie.value;
  }

  // No token found → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Parse and validate token (edge-compatible, no crypto)
  const payload = parseToken(token);
  if (!payload) {
    // Invalid or expired token → redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    // Clear invalid cookie
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('preone_token');
    return response;
  }

  // ── Role-based route access ──

  // /admin routes: both ADMIN and TASK_MASTER can access
  if (pathname.startsWith('/admin')) {
    if (payload.role !== Role.ADMIN && payload.role !== Role.TASK_MASTER) {
      // Not admin or taskmaster → redirect to their own dashboard
      const dashboardPath = payload.role === Role.TEACHER ? '/teacher/dashboard' :
                           payload.role === Role.PARENT ? '/parent/dashboard' : '/login';
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // TASK_MASTER can only access CRM + Dashboard within /admin
    if (payload.role === Role.TASK_MASTER) {
      const isAllowed = TASK_MASTER_ALLOWED_PREFIXES.some(prefix =>
        pathname === prefix || pathname.startsWith(prefix + '/')
      );
      if (!isAllowed) {
        // Block non-CRM admin routes for TASK_MASTER → redirect to CRM
        return NextResponse.redirect(new URL('/admin/crm', request.url));
      }
    }
  }

  // /teacher routes: only TEACHER
  if (pathname.startsWith('/teacher') && payload.role !== Role.TEACHER) {
    const defaultRoute = payload.role === Role.ADMIN ? '/admin/dashboard' :
                         payload.role === Role.TASK_MASTER ? '/admin/crm' :
                         payload.role === Role.PARENT ? '/parent/dashboard' : '/login';
    return NextResponse.redirect(new URL(defaultRoute, request.url));
  }

  // /parent routes: only PARENT
  if (pathname.startsWith('/parent') && payload.role !== Role.PARENT) {
    const defaultRoute = payload.role === Role.ADMIN ? '/admin/dashboard' :
                         payload.role === Role.TASK_MASTER ? '/admin/crm' :
                         payload.role === Role.TEACHER ? '/teacher/dashboard' : '/login';
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
    request: {
      headers: requestHeaders,
    },
  });
}

// ============================================================
// Matcher configuration — which routes to run middleware on
// ============================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
