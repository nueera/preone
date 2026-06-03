# Feature 5: Multi-Branch Isolation — Implementation Summary

## Task ID: feature-5-multi-branch-isolation

## Files Created

### 1. `/src/lib/branch.ts` — Core Branch Isolation Utility

- `BranchScope` interface with `branchId`, `schoolId`, `isAllBranches`
- `getBranchFromRequest()` — Derives branch scope from request + user token; ADMIN/TASK_MASTER without branchId can see all branches, with optional `?branchId=xxx` query filter
- `withBranchFilter()` — Returns `{ branchId }` when scoped, `{}` for admin (all branches)
- `withSchoolBranchFilter()` — Returns `{ schoolId, branchId? }` for models with BOTH fields (User, Branch, CrmTask, Notification)
- `withBranchViaRelationFilter()` — Returns `{ branchId }` or `{ branch: { schoolId } }` for models with branchId but NO schoolId (Student, Teacher, Class, Program)
- `validateBranchAccess()` — Checks record belongs to user's branch
- `getBranchInfo()` — Fetches branch info for display
- `getSchoolBranches()` — Lists active branches for a school

### 2. `/src/app/api/branches/route.ts` — Branch Switcher API

- **GET /api/branches** — Lists branches for user's school (any authenticated user)
- **POST /api/branches** — Switches active branch (ADMIN/TASK_MASTER only); generates new JWT token with updated branchId

### 3. `/src/components/ui/branch-switcher.tsx` — Branch Switcher UI Component

- Dropdown showing current branch name or "All Branches"
- Lists all branches from /api/branches
- Switching calls POST /api/branches, updates localStorage token
- Purple theme for admin, emerald for teacher, sky for parent
- Only shown for ADMIN/TASK_MASTER roles with a schoolId
- Building icon + branch name, with Globe icon for "All Branches"

### 4. `/src/components/admin-header.tsx` — Admin Header Integration

- Added `BranchSwitcher` import and component between breadcrumb and search button

## Files Modified (API Routes — Branch Filtering)

### 5. `/src/app/api/students/route.ts`

- Added `getBranchFromRequest` + `withBranchViaRelationFilter` (Student has branchId, no schoolId)
- GET handler now filters by branch/school via `withBranchViaRelationFilter(branchScope)`

### 6. `/src/app/api/teachers/route.ts`

- Added `getBranchFromRequest` + `withBranchViaRelationFilter` (Teacher has branchId, no schoolId)
- GET handler now filters by branch/school

### 7. `/src/app/api/classes/route.ts`

- Added `getBranchFromRequest` + `withBranchViaRelationFilter` (Class has branchId, no schoolId)
- Both Program and Class queries now use branch filter
- Nested classes within programs also filtered

### 8. `/src/app/api/attendance/route.ts`

- Added `getBranchFromRequest` + `withBranchFilter`
- Staff attendance: filtered via `teacher.branchId` or `teacher.branch.schoolId`
- Student attendance: filtered via `student.branchId` or `student.branch.schoolId`

### 9. `/src/app/api/fees/invoices/route.ts`

- Added `getBranchFromRequest` + `withBranchFilter`
- Invoices filtered via `student.branchId` or `student.branch.schoolId`

### 10. `/src/app/api/activities/route.ts`

- Added `getBranchFromRequest` + `withBranchFilter`
- Activities filtered via `class.branchId` or `class.branch.schoolId`

### 11. `/src/app/api/communication/announcements/route.ts`

- Added `getBranchFromRequest` (Announcement has no schoolId/branchId)
- School isolation via `createdBy` user IDs in the school

### 12. `/src/app/api/crm/leads/route.ts`

- Added `getBranchFromRequest` (Lead has no schoolId/branchId)
- School isolation via `assignedTo` user IDs OR `crmTasks.schoolId`
- Uses AND wrapper to combine school filter with existing search filters

## Build Results

- `bun run lint` — Passed with no errors
- TypeScript errors are all pre-existing (unrelated to this feature)
- Dev server running cleanly on port 3000

## Key Design Decisions

1. **Two filter helpers**: `withSchoolBranchFilter` for models with direct schoolId, `withBranchViaRelationFilter` for models with only branchId (filters via branch.schoolId for admin all-branches view)
2. **Backward compatibility**: Old `branchFilter()` and `getBranchScope()` in auth.ts are NOT removed
3. **No schema changes**: All models already had branchId where needed; models without it (Lead, Announcement) use schoolId-based filtering via relations
4. **Admin branch switching**: POST /api/branches generates a new JWT token — the branch context is stored in the token, not server-side session
