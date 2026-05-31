# RBAC Migration — API Route Updates

## Task ID: rbac-migration
## Agent: main

## Summary

Migrated all 25+ API route files from the old `getAuthUser()` pattern to the new RBAC system using `requireAdmin()`, `requireRole()`, and `branchFilter()` from `@/lib/auth`.

## Changes Made

### Auth Pattern Migration

**Old Pattern (replaced):**
```typescript
import { getAuthUser } from '@/lib/auth';
const authUser = getAuthUser(request);
if (!authUser) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}
```

**New Pattern (applied):**
- Admin-only routes → `requireAdmin(request)` with `if (user instanceof NextResponse) return user;`
- Multi-role routes → `requireRole(request, Role.Admin, Role.Teacher)` etc.
- Parent routes → `requireRole(request, Role.Parent)`
- Teacher routes → `requireRole(request, Role.Teacher)`

### Branch Isolation

Applied `branchFilter(user)` to all list queries (GET endpoints) for:
- Students, Teachers, Invoices, Fee Structures, Leads, Announcements, etc.

Applied branch verification on individual record access:
- GET/PUT/DELETE for students/[id], teachers/[id], leads/[id] now check `user.branchId` matches record's `branchId`

For create mutations (POST), ensured the created record uses `user.branchId` when available.

### Files Updated (25+ files)

#### Admin-only routes (requireAdmin):
1. `/api/students/route.ts` — + branchFilter on GET, branchId on POST
2. `/api/students/[id]/route.ts` — + branch verification on GET/PUT/DELETE
3. `/api/teachers/route.ts` — + branchFilter on GET, branchId on POST
4. `/api/teachers/[id]/route.ts` — + branch verification on GET/PUT
5. `/api/attendance/stats/route.ts` — + branchFilter
6. `/api/fees/invoices/route.ts` — + branchFilter on GET, branchId on POST
7. `/api/fees/overview/route.ts` — + branchFilter
8. `/api/fees/payments/route.ts` — uses user.userId
9. `/api/fees/structures/route.ts` — + branchFilter
10. `/api/crm/leads/route.ts` — + branchFilter on GET, branchId on POST
11. `/api/crm/leads/[id]/route.ts` — + branch verification on PUT
12. `/api/crm/pipeline/route.ts` — + branchFilter
13. `/api/crm/insights/route.ts` — + branchFilter
14. `/api/dashboard/stats/route.ts` — removed "allow unauthenticated" comment, + requireAdmin + branchFilter
15. `/api/dashboard/revenue/route.ts` — + branchFilter
16. `/api/dashboard/activities/route.ts` — + branchFilter
17. `/api/communication/announcements/route.ts` — + branchFilter on GET, branchId on POST
18. `/api/communication/stats/route.ts` — + branchFilter

#### Multi-role routes (requireRole):
19. `/api/growth/class/[classId]/route.ts` — requireRole(Role.Admin, Role.Teacher)
20. `/api/growth/observations/route.ts` — requireRole(Role.Admin, Role.Teacher)
21. `/api/growth/students/[id]/route.ts` — requireRole(Role.Admin, Role.Teacher)

#### Parent routes (requireRole with Role.Parent):
22. `/api/parent/dashboard/route.ts`
23. `/api/parent/children/route.ts`
24. `/api/parent/attendance/route.ts`
25. `/api/parent/fees/route.ts`
26. `/api/parent/observations/route.ts`
27. `/api/parent/growth/route.ts`
28. `/api/parent/announcements/route.ts`
29. `/api/parent/daily-updates/route.ts`

#### Teacher routes (requireRole with Role.Teacher):
30. `/api/teacher/dashboard/route.ts`
31. `/api/teacher/observations/route.ts`
32. `/api/teacher/growth/route.ts`
33. `/api/teacher/schedule/route.ts`
34. `/api/teacher/activities/route.ts`
35. `/api/teacher/class/route.ts`
36. `/api/teacher/attendance/mark/route.ts`
37. `/api/teacher/leaves/route.ts`
38. `/api/teacher/daily-updates/route.ts`

#### Auth routes:
39. `/api/auth/login/route.ts` — imports Role enum, uses `user.role as Role`
40. `/api/auth/me/route.ts` — uses `unauthorized()` helper from new auth

## Verification

- `bun run lint` passes with no errors
- Dev server starts successfully with no compilation errors
