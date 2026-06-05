# Task 4 — Chat REST API Endpoints

## Agent: Code Agent
## Status: Completed

## Summary
Created all 7 Chat REST API endpoint files for the PreOne preschool ERP project.

## Files Created

1. **`/src/app/api/chat/threads/route.ts`**
   - `GET`: List user's chat threads (sorted by lastMessageAt, most recent first; pinned first)
   - Includes participants (with user info), lastMessagePreview, unreadCount from ChatParticipant
   - Returns `{ threads: [...], totalUnread: number }`
   - `POST`: Create new thread
   - Body: `{ type, name?, participantIds, branchId?, classId?, onlyAdminsCanMessage? }`
   - For DIRECT: checks if thread already exists between 2 users, returns existing if found
   - For CLASS_GROUP: verifies teacher or admin is creating
   - For BRANCH_GROUP: verifies admin is creating

2. **`/src/app/api/chat/threads/[threadId]/route.ts`**
   - `GET`: Get thread details with participants, school/branch/class info, and current user's participation state

3. **`/src/app/api/chat/threads/[threadId]/messages/route.ts`**
   - `GET`: Cursor-based pagination with `?cursor=msgId&limit=50`
   - Includes sender info and replyTo context
   - Returns `{ messages: [...], nextCursor, hasMore }`
   - `POST`: Send message (REST fallback for WebSocket)
   - Body: `{ content, type?, mediaUrl?, replyToId? }`
   - Updates thread lastMessage cache, increments unread for others, creates notifications

4. **`/src/app/api/chat/threads/[threadId]/read/route.ts`**
   - `PUT`: Mark thread as read
   - Resets unreadCount to 0, updates lastReadAt
   - Creates MessageReadReceipt entries for all unread messages

5. **`/src/app/api/chat/threads/[threadId]/media/route.ts`**
   - `POST`: Upload media to chat
   - Accepts multipart/form-data
   - Saves file to `/public/uploads/chat/{threadId}/{uuid}.{ext}`
   - Max 10MB for admin, 5MB for teacher, 2MB for parent
   - Validates MIME types

6. **`/src/app/api/chat/threads/[threadId]/participants/route.ts`**
   - `GET`: List thread participants
   - `POST`: Add participants (admin/creator only, re-adds previously left users)
   - `DELETE`: Remove participant (admin/creator only, soft-delete via leftAt, auto-promotes longest member if last admin leaves)

7. **`/src/app/api/chat/search/route.ts`**
   - `GET`: Search messages across all user's threads
   - Query param: `?q=keyword&limit=20`
   - Returns matching messages with thread context

## Auth Approach
- Uses `getAuthUser` from `@/lib/auth` for unified auth across all roles (ADMIN, TEACHER, PARENT)
- Uses `prisma` from `@/lib/db` as instructed (not `db`)
- All routes verify thread participation before allowing access
- Role-based permission checks for creating threads and managing participants

## Lint Status
- `bun run lint` passes with 0 errors (1 pre-existing warning in prisma.config.ts)
