# Tasks 6, 7, 8 — Chat Auto-Threads, Zustand Stores, Chat Hooks

## Completed Files

### 1. `/home/z/my-project/src/lib/chat-auto-threads.ts` (Task 6)
Server-side auto-thread creation logic with 5 exported functions:
- **`findOrCreateDirectThread(schoolId, userId1, userId2)`** — Finds or creates a DIRECT thread between 2 users
- **`createClassGroupThread(schoolId, classId, className, branchId?)`** — Creates a CLASS_GROUP thread for a class (idempotent)
- **`addParentToClassGroup(parentUserId, classId)`** — Auto-adds a parent as member to class group
- **`addTeacherToClassGroup(teacherUserId, classId)`** — Auto-adds a teacher as admin to class group
- **`postAnnouncementToChat(announcementId)`** — Posts ANNOUNCEMENT-type messages to matching class group threads

All functions use `import { prisma } from '@/lib/db'` and respect the Prisma schema's `ChatThreadType` enum values (`DIRECT`, `CLASS_GROUP`).

### 2. `/home/z/my-project/src/lib/stores/chat-store.ts` (Task 7)
Full Zustand store (`useChatStore`) with Socket.io integration:
- **State**: `socket`, `isConnected`, `threads`, `activeThread`, `messages` (keyed by threadId), `typingUsers`, `onlineUsers`, `hasMore`, `totalUnread`
- **connect(token)** — Creates socket.io client at `/api/socketio` path, sets up all event listeners
- **disconnect()** — Cleanup socket and reset presence/typing state
- **loadThreads()** — Fetches from `/api/chat/threads`
- **loadMessages(threadId, cursor?)** — Fetches from `/api/chat/threads/[id]/messages` with cursor pagination, deduplicates, supports prepending older messages
- **sendMessage / editMessage / deleteMessage / reactToMessage** — Emit corresponding socket events
- **markAsRead(threadId)** — Optimistic update + socket emit
- **setTyping(threadId, isTyping)** — Emits `message:typing`
- **createThread(data)** — Emits `thread:create`
- **setActiveThread(thread)** — Sets active thread, auto-loads messages, marks as read

Socket event listeners that update state: `message:new`, `message:edited`, `message:deleted`, `message:reaction`, `thread:new`, `thread:read`, `user:typing`, `user:online`, `user:offline`, `presence:onlineUsers`

### 3. `/home/z/my-project/src/lib/stores/announcement-store.ts` (Task 7)
Full Zustand store (`useAnnouncementStore`) with REST API integration:
- **State**: `announcements`, `drafts`, `currentAnnouncement`, `isLoading`
- **fetchAnnouncements(filters?)** — GET `/api/communication/announcements` with query params
- **fetchDrafts()** — GET with `status=DRAFT` filter
- **createAnnouncement(data)** — POST to `/api/communication/announcements`, adds to local state
- **updateAnnouncement(id, data)** — PUT, optimistic local update
- **deleteAnnouncement(id)** — DELETE, removes from local state
- **publishAnnouncement(id)** — PUT with `status=PUBLISHED`, moves from drafts to announcements
- **markAsRead(id)** — Optimistic update + PUT with `markRead: true`
- **setCurrentAnnouncement(announcement)** — Simple setter for detail view

### 4. `/home/z/my-project/src/hooks/use-chat.ts` (Task 8)
Three React hooks:
- **`useChatInit()`** — Reads `preone_token` from localStorage, connects socket, loads threads, disconnects on unmount
- **`useTypingIndicator(threadId)`** — Debounced typing indicator (3s timeout), returns `{ handleTyping, handleStopTyping }`
- **`useMessageScroll(threadId)`** — Infinite scroll with cursor-based pagination, auto-scrolls to bottom on new messages, returns `{ scrollRef, loadMore, hasMore }`

## Lint Status
- 0 errors, 1 warning (pre-existing `prisma.config.ts` anonymous default export)
- All new files pass lint cleanly

## Key Design Decisions
- Used `import { prisma } from '@/lib/db'` (not `import db`) as required
- Prisma enums use ALL UPPERCASE strings matching the schema
- Socket.io client connects at `/api/socketio` path matching the server config in `server.js`
- Chat store uses `'use client'` directive since it depends on browser APIs (localStorage, socket.io)
- Announcement store uses `'use client'` for consistency with client-side usage
- Messages are deduplicated by id when merging paginated results
- Thread read uses optimistic update before socket emit for snappy UX
