# Task 2-3: Auth Middleware, Login, Register, Forgot-Password Pages

## Agent: Auth UI Agent
## Date: 2025-01-01

## Summary

Replaced custom JWT middleware with NextAuth middleware and created all auth pages for the PreOne preschool ERP.

## Files Created/Modified

### 1. REPLACED: `/src/middleware.ts`
- **Before**: Custom JWT middleware using HMAC-SHA256 token verification, only protected API routes
- **After**: NextAuth `withAuth` middleware that:
  - Protects portal routes (`/admin/*`, `/teacher/*`, `/parent/*`)
  - Protects API routes (except NextAuth and socket.io routes)
  - Enforces role-based access: ADMIN/TASK_MASTER for admin, TEACHER for teacher, PARENT for parent
  - Restricts TASK_MASTER to CRM pages only within admin portal
  - Redirects un-onboarded admins to `/admin/onboarding`
  - Adds security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)
  - Matcher excludes: `/_next/*`, `/login`, `/register`, `/forgot-password`, `/api/auth/[...nextauth]`, `/api/socketio`

### 2. REPLACED: `/src/app/login/page.tsx`
- **Before**: Custom JWT login with localStorage token storage and inline forgot-password dialog
- **After**: NextAuth-based login page with:
  - Tab switching between Email+Password and OTP login methods
  - `signIn('credentials', { email, password })` for credential login
  - `signIn('credentials', { phone, otp, authType: 'otp' })` for OTP login
  - Session-based role redirect after successful login
  - Onboarding redirect for admins who haven't completed onboarding
  - Demo credentials section
  - Links to Register and Forgot Password pages
  - Framer Motion entrance animation
  - Cosmic purple gradient background with glass morphism card

### 3. CREATED: `/src/app/register/page.tsx`
- School registration page with fields: School Name, Admin Name, Email, Phone, Password, Confirm Password
- Zod validation schema with password confirmation check
- Calls `/api/auth/register` with role=ADMIN
- Redirects to `/login` with success toast after registration
- Same cosmic theme as login page
- Back to Sign In link

### 4. CREATED: `/src/app/forgot-password/page.tsx`
- 3-step forgot password flow:
  1. Enter email → calls `/api/auth/forgot-password`
  2. Enter 6-digit OTP → InputOTP component
  3. Enter new password + confirm → calls `/api/auth/reset-password`
- Step indicator showing progress (Email → Verify → Reset)
- Animated step transitions with Framer Motion
- Success state with redirect to login
- Back navigation at each step

### 5. CREATED: `/src/components/providers/session-provider.tsx`
- Simple `AuthProvider` wrapper around NextAuth's `SessionProvider`
- Client component (`'use client'`)

### 6. MODIFIED: `/src/app/layout.tsx`
- Added import: `import { AuthProvider } from "@/components/providers/session-provider"`
- Wrapped `{children}` with `<AuthProvider>{children}</AuthProvider>`

## Dependencies on Other Agents

- The **auth-config agent** needs to create:
  - `/src/lib/auth-config.ts` — NextAuth configuration with CredentialsProvider supporting:
    - Email+password authentication
    - Phone+OTP authentication (via `authType: 'otp'` parameter)
    - JWT callback that includes `role` and `onboardingComplete` in the token
  - `/src/lib/auth-utils.ts` — Auth utility functions
  - `/src/app/api/auth/[...nextauth]/route.ts` — NextAuth API route handler

## Design Decisions

1. **Middleware**: Uses `NextResponse.rewrite` (not redirect) for unauthorized portal access to keep URL but show login page. Uses `NextResponse.redirect` for TASK_MASTER CRM enforcement.

2. **Login OTP flow**: First calls `/api/auth/otp/send` to trigger OTP, then uses `signIn('credentials', { phone, otp, authType: 'otp' })` so NextAuth creates the session properly.

3. **Forgot Password**: Separate page (not dialog) for better UX and URL sharing. Uses AnimatePresence for smooth step transitions.

4. **Session Provider**: Wraps at layout level so all pages can access session data via `useSession()`.

5. **Zod v4**: The project uses zod@4.x which uses `z.string()` and `.refine()` (compatible with v3 API for basic usage).

## TypeScript Validation

All new files pass `tsc --noEmit` with no errors. Pre-existing errors in other files (prisma seed, API routes) are unrelated.
