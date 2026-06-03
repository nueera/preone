---
Task ID: 1
Agent: Main Agent
Task: Implement Task Master role — CRM-only admin access with updated architecture

Work Log:
- Updated theme-tokens.ts with PREONE_COLORS, PREONE_GRADIENTS, ROLE_THEMES structures
- Updated auth.ts + auth-edge.ts: TASK_MASTER dashboard → /admin/crm, removed /taskmaster route mapping
- Updated middleware.ts: TASK_MASTER uses /admin routes, only CRM + Dashboard allowed
- Updated admin-sidebar.tsx: role-based menu filtering with collapsible CRM section (Pipeline, Leads, Follow-ups, Tasks)
- Updated admin-layout.tsx: client component with data-role attribute, client-side route guard for TASK_MASTER
- Updated admin-header.tsx: orange "Task Master" badge using PREONE_COLORS.star tokens
- Updated login/page.tsx: TASK_MASTER → /admin/crm redirect, added Task Master demo credential
- Updated all CRM API routes (leads, pipeline, insights, followups, convert) to allow TASK_MASTER
- Updated all Dashboard API routes (stats, revenue, activities, pipeline, fee-summary) to allow TASK_MASTER
- Updated src/middleware.ts: added TaskMaster role to CRM/dashboard routes, fixed regex patterns for base paths
- Updated globals.css: added [data-role="taskmaster"] selector (same as admin purple theme)
- Created CRM sub-pages: /admin/crm/leads, /admin/crm/followups, /admin/crm/tasks
- Removed all /taskmaster references (page.tsx, teacher-api.ts, parent-api.ts)
- Created TASK_MASTER user in database (taskmaster@preone.com / admin123)
- Updated prisma/seed.ts with Task Master user creation
- Fixed security bugs: teachers GET, fees/overview, attendance/stats, attendance now use requireAdmin
- Lint passes clean (0 errors)
- Pushed to repo (commit 6c6fcaa)

Stage Summary:
- Architecture: 3 portals (Admin, Teacher, Parent), 4 roles (ADMIN, TASK_MASTER, TEACHER, PARENT)
- TASK_MASTER shares Admin portal but only sees CRM + Dashboard
- CRM section in sidebar with children: Pipeline, Leads, Follow-ups, Tasks
- Orange accent (PREONE_COLORS.star) for Task Master branding
- Both server-side (middleware) and client-side (layout) route guards for TASK_MASTER
- Demo credentials: taskmaster@preone.com / admin123
