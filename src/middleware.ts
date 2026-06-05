import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // ====== ROLE-BASED ROUTE PROTECTION ======

    // Admin routes: only ADMIN and TASK_MASTER
    if (path.startsWith('/admin')) {
      if (!['ADMIN', 'TASK_MASTER'].includes(token?.role as string)) {
        return NextResponse.rewrite(new URL('/login', req.url));
      }
      // TASK_MASTER can only access CRM pages
      if (token?.role === 'TASK_MASTER') {
        const allowedPaths = ['/admin/crm', '/admin/chat', '/admin/announcements', '/admin/settings'];
        const isAllowed = allowedPaths.some(p => path.startsWith(p)) || path === '/admin';
        if (!isAllowed && path !== '/admin/dashboard') {
          // Redirect to CRM if trying to access non-CRM admin pages
          return NextResponse.redirect(new URL('/admin/crm', req.url));
        }
      }
    }

    // Teacher routes: only TEACHER
    if (path.startsWith('/teacher')) {
      if (token?.role !== 'TEACHER') {
        return NextResponse.rewrite(new URL('/login', req.url));
      }
    }

    // Parent routes: only PARENT
    if (path.startsWith('/parent')) {
      if (token?.role !== 'PARENT') {
        return NextResponse.rewrite(new URL('/login', req.url));
      }
    }

    // ====== ONBOARDING REDIRECT ======
    // If admin hasn't completed onboarding, redirect to onboarding
    // (except if already on onboarding page)
    if (token?.role === 'ADMIN' && !token?.onboardingComplete) {
      if (!path.startsWith('/admin/onboarding') && !path.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/admin/onboarding', req.url));
      }
    }

    // ====== API ROUTE PROTECTION ======
    // API routes are protected — auth routes are excluded by the matcher
    // The existing Bearer token auth in API routes provides a second layer
    // NextAuth session check provides the first layer

    // ====== SECURITY HEADERS ======
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  },
  {
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    // Protect all portal routes
    '/admin/:path*',
    '/teacher/:path*',
    '/parent/:path*',

    // Protect API routes (except NextAuth routes)
    '/api/((?!auth/(?!me)|socketio).*)/:path*',
  ],
};
