# Task 12: Sidebar Navigation + Layout Integration

## Summary

Added Chat and Announcements navigation links to all 3 portal sidebars, with unread badge support, and integrated the `useChatInit()` hook into all portal layouts.

## Files Modified

### Sidebar Navigation (3 files)

- `src/components/admin-sidebar.tsx` - Added Chat (MessageCircle, /admin/chat) + Announcements (Megaphone, /admin/announcements) nav items with unread badge
- `src/components/teacher-sidebar.tsx` - Added Chat (MessageCircle, /teacher/chat) + Announcements (Megaphone, /teacher/announcements) nav items with unread badge
- `src/components/parent-sidebar.tsx` - Added Chat (MessageCircle, /parent/chat) + Announcements (Megaphone, /parent/announcements) nav items with unread badge

### Mobile Navigation (2 files)

- `src/components/parent-mobile-nav.tsx` - Updated Chat link to /parent/chat
- `src/components/layout/mobile-bottom-nav.tsx` - Updated all Chat links from /communication to /chat

### Portal Layouts (3 files)

- `src/app/admin/layout.tsx` - Added useChatInit() hook
- `src/app/teacher/layout.tsx` - Added useChatInit() hook
- `src/app/parent/layout.tsx` - Added useChatInit() hook

## Key Decisions

- Chat nav items placed after Notifications and before Transport/Settings
- Unread badge uses useChatStore's totalUnread count with red pill style (99+ cap)
- Admin Chat nav visible to both ADMIN and TASK_MASTER roles
- Badge field added as optional string identifier on NavItem interface
