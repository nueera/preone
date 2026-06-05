---

Task ID: 12
Agent: Phase 7 - Communication System Integration
Task: Add Chat + Announcements navigation links to all 3 portal sidebars and chat init hook to layouts

Work Log:

- Updated admin sidebar (src/components/admin-sidebar.tsx):
  - Added MessageCircle and Megaphone icon imports
  - Imported useChatStore for unread badge count
  - Added badge field to NavItem interface
  - Added Chat nav item (href: /admin/chat, icon: MessageCircle, badge: 'chat') after Notifications
  - Added Announcements nav item (href: /admin/announcements, icon: Megaphone) after Chat
  - Rendered unread count badge on Chat nav item (red pill with 99+ cap)
  - Both items visible to ADMIN and TASK_MASTER roles

- Updated teacher sidebar (src/components/teacher-sidebar.tsx):
  - Added MessageCircle and Megaphone icon imports
  - Imported useChatStore for unread badge count
  - Added Chat nav item (href: /teacher/chat, icon: MessageCircle, badge: 'chat') after Notifications
  - Added Announcements nav item (href: /teacher/announcements, icon: Megaphone) after Chat
  - Rendered unread count badge on Chat nav item

- Updated parent sidebar (src/components/parent-sidebar.tsx):
  - Added MessageCircle and Megaphone icon imports
  - Imported useChatStore for unread badge count
  - Added Chat nav item (href: /parent/chat, icon: MessageCircle, badge: 'chat') after Notifications
  - Added Announcements nav item (href: /parent/announcements, icon: Megaphone) after Chat
  - Rendered unread count badge on Chat nav item

- Updated parent mobile nav (src/components/parent-mobile-nav.tsx):
  - Changed Chat link from /parent/communication to /parent/chat
  - Updated icon from MessageSquare to MessageCircle

- Updated mobile bottom nav (src/components/layout/mobile-bottom-nav.tsx):
  - Changed all Chat links from /communication to /chat for all 3 roles

- Added useChatInit() hook to all 3 portal layouts:
  - src/app/admin/layout.tsx - imported and called useChatInit()
  - src/app/teacher/layout.tsx - imported and called useChatInit()
  - src/app/parent/layout.tsx - imported and called useChatInit()

- Build test: Passed successfully (npx next build)
  - All 6 new routes visible: /admin/chat, /admin/announcements, /teacher/chat, /teacher/announcements, /parent/chat, /parent/announcements

- Pushed to repo: commit 53973c0 on main

---

Task ID: 1
Agent: Main
Task: Fix PreOne Onboarding Wizard visibility in admin portal

Work Log:

- Analyzed the full onboarding codebase: 8 step components, 17 API routes, Zustand store, wizard-shell, progress-bar
- Identified critical bug: ALL fetch calls in onboarding pages missing Authorization header
- Identified stale localStorage cache preventing redirect in admin layout
- Identified missing POST handler in /api/onboarding/draft route
- Enhanced /api/onboarding/complete to actually create real records (branches, programs, classes, teachers, students, parents, daily update config)

Fixes Applied:

1. `src/app/admin/onboarding/page.tsx` - Added getAuthHeaders() helper, fixed all fetch calls to include auth tokens, changed auto-save to POST /api/onboarding/draft
2. `src/app/admin/onboarding/step/[step]/page.tsx` - Added getAuthHeaders() helper, fixed fetch calls with auth tokens
3. `src/app/admin/layout.tsx` - Removed stale localStorage cache check that prevented redirect, now always checks API
4. `src/app/api/onboarding/draft/route.ts` - Added POST handler for auto-save, syncs school profile data alongside draft
5. `src/app/api/onboarding/complete/route.ts` - Complete rewrite: creates real DB records from draft (branches, programs, classes, teachers, students, parents, daily update config)
6. `src/components/onboarding/steps/review-launch-step.tsx` - Added auth headers to launch fetch
7. `src/components/onboarding/steps/teachers-step.tsx` - Added auth headers to CSV import
8. `src/components/onboarding/steps/students-step.tsx` - Added auth headers to CSV import

Stage Summary:

- All onboarding fetch calls now properly include Bearer token authorization
- Admin layout always checks API for onboarding status (no stale cache blocking)
- Draft API now supports POST for auto-save and syncs school data
- Complete API now creates actual database records from wizard data
- Build passes successfully with all routes visible
