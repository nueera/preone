# Task 10-11: Announcement Components & Portal Pages

## Summary
Created 10 files total (9 required + 1 prerequisite ChatLayout) for the PreOne preschool ERP project.

## Files Created

### Prerequisite (1 file)
1. **`/home/z/my-project/src/components/chat/chat-layout.tsx`** — Full chat layout with thread list, message display, and real-time messaging via useChatStore (Socket.io). Responsive with mobile/desktop layouts.

### Announcement Components (3 files)
2. **`/home/z/my-project/src/components/announcements/create-announcement-dialog.tsx`** — Full-featured announcement creation/edit dialog with:
   - Title, content, type, priority, target audience selectors
   - Branch/class dropdowns (fetched from API when relevant target selected)
   - Cover image URL input, file attachment management
   - Channel selection (in-app, email, SMS) with checkboxes
   - "Post in class chat" toggle (sendAsChat)
   - Schedule for later (datetime picker)
   - Save as Draft / Publish buttons
   - Support for restricted targets (teacher can only use CLASS/PARENTS)

3. **`/home/z/my-project/src/components/announcements/announcement-card.tsx`** — Announcement display card with:
   - Priority color indicator (red=HIGH/CONCERN, amber=NORMAL, green=LOW)
   - Type badge, target badge, status badge
   - Cover image display
   - Attachment links with download icons
   - Content truncation with expand/collapse
   - Read progress bar (readCount/totalRecipients)
   - Unread indicator (portal-colored ring)
   - Action buttons (edit, delete, publish) when showActions=true
   - Date display with formatDistanceToNow

4. **`/home/z/my-project/src/components/announcements/announcement-read-receipts.tsx`** — Read receipt viewer with:
   - Two columns: Read (green) / Not Read (red)
   - User avatars with names
   - Read timestamps for those who read
   - Percentage progress bar
   - Fetches from `/api/announcements/[id]/read-receipts`

### Portal Pages (6 files)
5. **`/home/z/my-project/src/app/admin/chat/page.tsx`** — Admin chat page using ChatLayout
6. **`/home/z/my-project/src/app/admin/announcements/page.tsx`** — Admin announcements dashboard with:
   - Tabs: All, Published, Drafts, Scheduled
   - Stats cards: Total, Published, Draft, Read Rate
   - Create Announcement button
   - Announcement cards with edit/delete/publish actions
   - Filter by type, priority, search
   - Read receipt viewer dialog
   - Full announcement store integration

7. **`/home/z/my-project/src/app/teacher/chat/page.tsx`** — Teacher chat page using ChatLayout
8. **`/home/z/my-project/src/app/teacher/announcements/page.tsx`** — Teacher announcements page with:
   - View published announcements targeted to them
   - Create for class only (restricted to CLASS/PARENTS targets)
   - Filter by type, priority, search
   - Mark as read on click

9. **`/home/z/my-project/src/app/parent/chat/page.tsx`** — Parent chat page using ChatLayout
10. **`/home/z/my-project/src/app/parent/announcements/page.tsx`** — Parent read-only feed with:
    - Published announcements as card list
    - Unread highlighted with portal border ring
    - Click to mark as read and expand
    - Priority badges for HIGH/CONCERN
    - Cover images, attachment downloads
    - Date display, unread count indicator

## Verification
- TypeScript: 0 errors in all new files
- ESLint: 0 errors, 0 warnings in new files
- All files use `'use client'` directive
- All files use CSS custom properties (`var(--preone-primary)`, etc.) and portal-scoped classes
- All shadcn/ui imports use `@/components/ui/` paths
- All store imports use correct paths
- Responsive design with mobile-first approach
