---
Task ID: 1
Agent: Phase 1 Agent
Task: Install socket.io, update Prisma schema, create custom server, create socket.io server

Work Log:
- Confirmed socket.io + socket.io-client already installed in package.json
- Updated Prisma schema:
  - Replaced ChatThread model with enhanced version (ChatThreadType enum, schoolId, branchId, classId, lastMessagePreview, lastMessageAt, onlyAdminsCanMessage, isActive fields)
  - Replaced ChatParticipant model with enhanced version (unreadCount, lastReadAt, isMuted, isPinned, leftAt, cascade delete)
  - Replaced Message model with enhanced version (MessageType enum, mediaThumbnail, mediaType, mediaSize, replyToId, isEdited, isDeleted, reactions JSON, metadata JSON, self-relation for replies)
  - Added MessageReadReceipt model
  - Replaced Announcement model with enhanced version (AnnouncementType + AnnouncementStatus enums, schoolId, branchId, classId, attachments, coverImage, channels, sendAsChat, totalRecipients, creator relation)
  - Added AnnouncementRead model with user relation
- Added new relations to User model: chatThreads, sentMessages, announcementReads, createdAnnouncements
- Added new relations to School model: chatThreads, announcements
- Added chatThreads relation to Branch model
- Added chatThreads relation to Class model
- Fixed channels default value escaping for Prisma compatibility
- Added `user` relation to AnnouncementRead (required by Prisma)
- Added `prisma` export alias to db.ts for convenience
- Ran prisma db push --force-reset successfully
- Updated seed.ts to match new schema:
  - ChatThread.create now includes schoolId and uses `name` instead of `title`
  - ChatParticipant roles now use 'admin'/'member' instead of 'TEACHER'/'PARENT'
  - Message.create no longer includes `isRead` field
  - Announcement.create now includes schoolId and uses UPPERCASE enum values
- Seeded database successfully
- Created custom server.js for Next.js + Socket.io integration
- Updated package.json scripts: dev → node server.js, start → NODE_ENV=production node server.js
- Created /src/lib/socket.ts Socket.io server singleton with:
  - JWT token verification (HMAC-SHA256 matching middleware.ts)
  - Room management (school, user, thread rooms)
  - Event handlers: message:send, message:edit, message:delete, message:react, message:read, message:typing, thread:create, presence:getOnline
  - Auto-join user to thread rooms on connect
  - Online/offline presence broadcasting
  - Notification creation for offline users
- Updated existing API routes for new schema:
  - /api/teacher/chat/threads/route.ts
  - /api/teacher/chat/[threadId]/messages/route.ts
  - /api/parent/chat/threads/route.ts
  - /api/parent/chat/[threadId]/messages/route.ts
  - /api/communication/announcements/route.ts
  - /api/communication/stats/route.ts
- Fixed `actionUrl` → `link` in notification creation across 7 files
- Added missing `schoolId` and `category` fields to notification.create calls
- Updated ChatThreadData and ChatMessageData types in use-parent.ts
- Updated teacher communication page to use msg.readByOthers instead of msg.isRead

Stage Summary:
- All Phase 1 database + server setup complete
- Socket.io server ready at /api/socketio path
- Custom server runs Next.js + Socket.io on same port
- All existing API routes updated for new schema
- All lint errors resolved
