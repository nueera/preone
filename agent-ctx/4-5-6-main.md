# Task 4-6: Auth Portal Layouts, API Endpoints, and Client Hooks

## Agent: main

## Summary

Completed all three phases for the PreOne preschool ERP project authentication system.

## Phase 4: Portal Layouts with Server-Side Session Checks

Updated all three portal layouts to use server-side authentication via `getServerSession`:

### Admin Layout (`src/app/admin/layout.tsx`)
- Converted from `'use client'` to async server component
- Added `getServerSession` check at top
- Redirects to `/login` if no session
- Only allows `ADMIN` and `TASK_MASTER` roles
- Extracted client logic into `admin-layout-client.tsx`
- Passes `userRole`, `onboardingComplete`, and `schoolId` from session to client component
- Removed localStorage-based role detection (now uses session data)

### Teacher Layout (`src/app/teacher/layout.tsx`)
- Converted to async server component
- Redirects to `/login` if no session
- Only allows `TEACHER` role
- Extracted client logic into `teacher-layout-client.tsx`
- Removed `TeacherAuthProvider` wrapper (session is now from NextAuth)

### Parent Layout (`src/app/parent/layout.tsx`)
- Converted to async server component
- Redirects to `/login` if no session
- Only allows `PARENT` role
- Extracted client logic into `parent-layout-client.tsx`
- Removed `ParentAuthProvider` wrapper (session is now from NextAuth)

## Phase 5: Auth API Endpoints

Created 7 API endpoints under `/api/auth/`:

1. **`/api/auth/register/route.ts`** - POST: Register school + admin user
   - Zod validation for schoolName, name, email, phone, password (min 8)
   - Duplicate email check (409)
   - Prisma transaction for school + user creation
   - Audit log creation
   - Dev mode returns OTP code

2. **`/api/auth/send-otp/route.ts`** - POST: Send OTP for login or password reset
   - Zod validation for email, purpose (LOGIN | FORGOT_PASSWORD)
   - Rate limit check (5 OTP per 15 min)
   - Uses `createOTP()` from auth-utils
   - Dev mode returns OTP code

3. **`/api/auth/verify-otp/route.ts`** - POST: Verify OTP code
   - Zod validation for email, code (6 digits), purpose
   - Uses `verifyOTP()` from auth-utils
   - Returns `{ valid: boolean }`

4. **`/api/auth/change-password/route.ts`** - POST: Change password (authenticated)
   - Uses `withAuth()` wrapper
   - Zod validation for currentPassword, newPassword (min 8)
   - Verifies current password before updating
   - Prisma transaction for password update + audit log

5. **`/api/auth/me/route.ts`** - GET: Get current user info (authenticated)
   - Uses `withAuth()` wrapper
   - Returns fresh user data from DB with school, branch, teacher relations

6. **`/api/auth/forgot-password/route.ts`** - POST: Start forgot password flow
   - Zod validation for email
   - Prevents email enumeration (always returns same message)
   - Rate limited
   - Dev mode returns OTP code

7. **`/api/auth/reset-password/route.ts`** - POST: Reset password with OTP
   - Zod validation for email, code, newPassword (min 8)
   - Verifies OTP before resetting
   - Prisma transaction for password update + audit log

## Phase 6: Client-Side Auth Hooks and Role Guard

### `src/hooks/use-auth.ts`
- `useAuth()` hook wrapping `next-auth/react`'s `useSession`
- Exposes: user, isLoading, isAuthenticated, isUnauthenticated, logout
- Role helpers: isAdmin, isTaskMaster, isTeacher, isParent
- School/branch context: role, schoolId, branchId

### `src/components/auth/role-guard.tsx`
- `RoleGuard` component for client-side role-based access control
- Accepts `allowedRoles` and optional `fallback`
- Shows loading spinner while session loads
- Redirects to `/login` if unauthenticated
- Shows "Access Denied" if role not in allowedRoles (or renders fallback)

## Files Modified
- `src/app/admin/layout.tsx` - Converted to server component with auth check
- `src/app/teacher/layout.tsx` - Converted to server component with auth check
- `src/app/parent/layout.tsx` - Converted to server component with auth check

## Files Created
- `src/app/admin/admin-layout-client.tsx` - Client component for admin layout
- `src/app/teacher/teacher-layout-client.tsx` - Client component for teacher layout
- `src/app/parent/parent-layout-client.tsx` - Client component for parent layout
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/send-otp/route.ts`
- `src/app/api/auth/verify-otp/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/hooks/use-auth.ts`
- `src/components/auth/role-guard.tsx`

## Verification
- ESLint passes (0 errors, 1 pre-existing warning)
- TypeScript compilation has 0 errors in all new/modified files
- Pre-existing errors in other files are unrelated
