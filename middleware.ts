// ============================================================
// PreOne — Next.js Middleware
// Route protection with JWT-based role verification
// Protects /admin, /teacher, /parent, /taskmaster routes
// Uses edge-compatible token parser (no Node.js crypto)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { parseToken, ROLE_ROUTE_MAP, getDashboardPath } from '@/lib/auth-edge';

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

  // Check if this is a protected route
  const protectedPrefix = Object.keys(ROLE_ROUTE_MAP).find(prefix =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (!protectedPrefix) {
    // Not a protected route, allow through
    return NextResponse.next();
  }

  // Get token from cookie first
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

  // Check role matches route
  const requiredRole = ROLE_ROUTE_MAP[protectedPrefix];
  if (payload.role !== requiredRole) {
    // Role doesn't match → redirect to their own dashboard
    const dashboardPath = getDashboardPath(payload.role);
    return NextResponse.redirect(new URL(dashboardPath, request.url));
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
