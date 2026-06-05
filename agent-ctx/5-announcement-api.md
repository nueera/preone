# Task 5 — Announcement REST API Endpoints

## Summary

Created all 5 Announcement REST API endpoint files with full CRUD, read tracking, and publish functionality.

## Files Created

### 1. `/src/app/api/announcements/route.ts`
- **GET**: List announcements with role-based visibility
  - Admin: sees all for their school (with optional branchId filter)
  - Teacher: sees published + their branch/class targeted
  - Parent: sees published + their child's class targeted
  - Query params: `?status=PUBLISHED&type=GENERAL&target=ALL&page=1&limit=20&branchId=xxx`
  - Returns: `{ announcements: [...], pagination: {...} }` with `readCount` and `isRead` per announcement

- **POST**: Create announcement (ADMIN + TEACHER only)
  - Auto-sets `schoolId` from auth, `createdBy` from auth.userId
  - Teachers restricted to their own branch/class
  - If status is PUBLISHED, sets `publishedAt`, creates notifications, and posts to class chat if `sendAsChat`
  - Calculates and sets `totalRecipients`

### 2. `/src/app/api/announcements/[id]/route.ts`
- **GET**: Single announcement with creator info + read count + isRead for current user
- **PUT**: Update announcement (creator or admin only); cannot edit published unless admin
- **DELETE**: Delete announcement (admin only); cascades read deletion

### 3. `/src/app/api/announcements/[id]/read/route.ts`
- **PUT**: Mark announcement as read using `AnnouncementRead` upsert (unique on announcementId + userId)

### 4. `/src/app/api/announcements/[id]/read-receipts/route.ts`
- **GET**: Admin-only read receipts
  - Returns: `{ readBy: [{userId, name, avatar, readAt}], notReadBy: [{userId, name, avatar}], stats: {total, read, unread} }`

### 5. `/src/app/api/announcements/[id]/publish/route.ts`
- **POST**: Publish draft/scheduled announcement
  - Changes status to PUBLISHED, sets publishedAt
  - Creates Notification records for all recipients
  - Posts to class group chat if sendAsChat + classId
  - Posts to branch group chat if sendAsChat + branchId (no classId)
  - Calculates and sets totalRecipients

## Key Design Decisions
- Used `import { prisma } from '@/lib/db'` as specified
- Auth: `getAuthUser` + `requireAdmin` from `@/lib/auth`; `requireTeacher`/`requireParent`/`isAuthError` from `@/lib/api-auth`
- All Prisma enums uppercase: `DRAFT`, `PUBLISHED`, `SCHEDULED`, `GENERAL`, etc.
- Params pattern: `{ params }: { params: Promise<{ id: string }> }` then `const { id } = await params;`
- School isolation enforced on all endpoints
- `AnnouncementRead` uses composite unique `@@unique([announcementId, userId])` with upsert
- Notifications via `createBulkNotifications` from `@/lib/notifications`

## Lint Status
✅ Passes with 0 errors (1 pre-existing warning in prisma.config.ts)
