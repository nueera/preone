# Task 1: NextAuth v4 Infrastructure Setup

## Agent: Main Agent
## Date: 2025-06-05

## Summary
Set up NextAuth v4 authentication infrastructure alongside the existing custom JWT/Bearer token auth system in the PreOne preschool ERP project.

## Changes Made

### 1. Installed next-auth@4
- Installed `next-auth@4.24.14` via bun

### 2. Updated Prisma Schema (`/home/z/my-project/prisma/schema.prisma`)
- Added `sessions Session[]`, `accounts Account[]`, `refreshTokens RefreshToken[]` relations to User model
- Added 4 new models at end of file:
  - `Account` — OAuth account linking (provider, providerAccountId, tokens)
  - `Session` — NextAuth session tokens
  - `VerificationToken` — Email verification tokens
  - `RefreshToken` — Custom refresh token storage with user agent/IP tracking
- Ran `prisma db push` successfully (SQLite database synced)

### 3. Created `/home/z/my-project/src/lib/auth-config.ts`
- Full NextAuth configuration with:
  - Credentials Provider (email + password)
  - JWT strategy (no DB sessions)
  - `authorize()`: finds user by email, checks isActive, verifies password with bcrypt, updates lastLogin
  - `signIn` callback: passes through (isActive check in authorize)
  - `jwt` callback: adds id, role, schoolId, branchId, isActive, onboardingComplete, schoolName, branchName, teacherId, avatar to JWT token
  - `session` callback: passes all JWT fields to session user object
  - `redirect` callback: handles relative URLs and same-origin redirects
  - Custom pages: signIn: '/login', error: '/login'
  - TypeScript type declarations for Session, User, and JWT interfaces

### 4. Created `/home/z/my-project/src/lib/auth-utils.ts`
- Password utilities: `hashPassword()`, `verifyPassword()` (using bcrypt)
- OTP functions: `createOTP()`, `verifyOTP()` (uses existing Otp model)
- Rate limiting: `checkRateLimit()` (in-memory, configurable attempts/window)
- Session helpers: `getCurrentUser()`, `requireAuth()`
- `withAuth()` wrapper for API routes (supports role-based access control)
- School isolation: `requireSchoolAccess()`
- Token generation: `generateApiToken()`

### 5. Created `/home/z/my-project/src/app/api/auth/[...nextauth]/route.ts`
- NextAuth route handler exporting GET and POST
- Uses authOptions from auth-config.ts

## Compatibility Notes
- The existing `/src/lib/auth.ts` (custom JWT with HMAC-SHA256) is preserved for backward compatibility
- The existing `/src/middleware.ts` (Bearer token auth for API routes) continues working
- The new NextAuth system operates via cookies, alongside the Bearer token API auth
- Both systems can coexist: NextAuth for browser sessions, Bearer tokens for API clients

## Verification
- `bun run lint` passes with 0 errors (1 pre-existing warning in prisma.config.ts)
- `prisma db push` completed successfully
- TypeScript type errors are all pre-existing (seed.ts, skills/) — none related to our changes
