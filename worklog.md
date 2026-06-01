---
Task ID: 1
Agent: Main
Task: Build Settings Module for PreOne Admin Portal + Root Redirect

Work Log:
- Explored existing project structure: Prisma schema, auth utilities, API patterns, page patterns
- Identified existing Prisma models: School, Branch, User, SchoolSetting, Route, Vehicle
- Created 11 API route files under /src/app/api/settings/:
  - school/route.ts (GET/PATCH - school profile with counts)
  - branches/route.ts (GET/POST - list with filters + create)
  - branches/[id]/route.ts (PATCH/DELETE - update + soft/hard delete)
  - users/route.ts (GET/POST - list with search/filters + create with hashed password)
  - users/[id]/route.ts (PATCH/DELETE - update + deactivate)
  - users/[id]/reset-password/route.ts (POST - generate & return new password)
  - transport/routes/route.ts (GET/POST - list + create)
  - transport/routes/[id]/route.ts (PATCH/DELETE - update + delete if no vehicles)
  - transport/vehicles/route.ts (GET/POST - list with route info + create)
  - transport/vehicles/[id]/route.ts (PATCH/DELETE - update + deactivate)
  - notifications/route.ts (GET/PATCH - SchoolSetting key-value store for channel config + matrix)
- Built Settings page at /src/app/admin/settings/page.tsx (2332 lines) with 5 tabs:
  - School Profile: Form with 12 fields, logo preview, Save Changes
  - Branches: Table with CRUD dialogs, search, status badges
  - Users: Table with CRUD dialogs, role badges, deactivate, reset password
  - Transport: Sub-tabs for Routes (with dynamic stops list) and Vehicles (with route dropdown)
  - Notifications: 4 channel config cards (SMS/WhatsApp/Email/Push) + auto-notifications matrix with checkboxes
- Replaced root page /src/app/page.tsx with auth-based redirect:
  - Checks localStorage for token + user
  - Redirects to role-specific dashboard (ADMIN→/admin, TEACHER→/teacher, etc.)
  - Shows loading spinner with PreOne logo while checking
- Build verified: `next build` passes with 0 errors

Stage Summary:
- Settings Module complete with 11 API routes + full 5-tab Settings page
- Root redirect implemented with role-based routing
- All builds pass, ready for GitHub push
