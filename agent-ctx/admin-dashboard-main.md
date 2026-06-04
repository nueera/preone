# Task: Build Admin Layout and Dashboard for PreOne Preschool ERP

## Completed: 2026-05-31

## Files Created/Modified

### 1. `/src/app/admin/layout.tsx` (NEW)

- Server component wrapping `SidebarProvider`
- Includes `AdminSidebar` and `AdminHeader` client components
- Gray background main content area with proper padding

### 2. `/src/components/admin-sidebar.tsx` (NEW)

- Client component using shadcn/ui Sidebar with `collapsible="icon"`
- Logo area: PreOne image + "PreOne" text (expanded) / "P" letter (collapsed)
- 11 navigation items with lucide icons and route links
- Active state: bg-purple-600 text-white with border-l-4 border-purple-800
- Hover state: bg-purple-50/10 / dark:bg-purple-900/30
- Tooltips on collapsed state via SidebarMenuButton tooltip prop
- Collapse toggle button in footer with ChevronsLeft/ChevronsRight icons
- Uses `bg-sidebar-gradient` for the purple-to-blue gradient background

### 3. `/src/components/admin-header.tsx` (NEW)

- Sticky top header bar with white bg, shadow-sm, border-b
- Left: SidebarTrigger + Breadcrumb (current page from pathname)
- Right: Search button, Notification bell with red dot, User avatar dropdown
- User menu: Profile, Settings, Logout (redirects to /login)
- Reads user from localStorage (preone_user)

### 4. `/src/app/admin/dashboard/page.tsx` (NEW)

- Client component with full dashboard UI
- **6 Stat Cards**: Total Students, Total Teachers, Monthly Revenue, New Admissions, Occupancy Rate, Attendance Rate
  - Each has colored icon circle (48px), label, bold value, trend percentage
  - Responsive grid: 3 cols desktop, 2 tablet, 1 mobile
- **Revenue Chart** (2/3 width): Recharts AreaChart with Revenue + Collections areas
  - Period selector buttons: "This Year" / "Last Year"
  - Purple and green gradient fills
  - ₹ formatted Y-axis and tooltip
- **Fee Breakdown Pie Chart** (1/3 width): Donut chart with Collected/Pending/Overdue
  - Center: total amount, Legend below with colors + amounts
- **Activity Feed** (1/2 width): Max 400px scrollable
  - 6 activity types: ADMISSION, PAYMENT, LEAD, ATTENDANCE, LEAVE, ANNOUNCEMENT
  - Colored icon circles + message + time ago
- **Admission Pipeline** (1/2 width): Horizontal funnel bars
  - 5 stages: NEW → CONTACTED → VISITED → APPLIED → ENROLLED
  - Width proportional to count, shows count + ₹ value
  - Click links to /admin/crm?stage=STAGE
- Loading skeletons for all sections

### 5. `/src/app/api/dashboard/stats/route.ts` (REPLACED)

- GET endpoint requiring ADMIN role via `requireAdmin`
- Returns: totalStudents, totalTeachers, monthlyRevenue, newAdmissions, occupancyRate, attendanceRate
- Computes trend percentages (month-over-month)
- Attendance fallback: uses most recent attendance date if today has none

### 6. `/src/app/api/dashboard/revenue/route.ts` (REPLACED)

- GET endpoint accepting `?year=2026`
- Returns `{ data: [{ month, revenue, collections }] }` for 12 months
- Revenue = invoiced amount, Collections = actual payments received
- Requires ADMIN role

### 7. `/src/app/api/dashboard/activities/route.ts` (REPLACED)

- GET endpoint accepting `?limit=15`
- Returns activity feed from recent DB changes
- Types: ADMISSION, PAYMENT, LEAD, ATTENDANCE, LEAVE, ANNOUNCEMENT
- Uses date-fns formatDistanceToNow for time ago
- Requires ADMIN role

### 8. `/src/app/api/dashboard/fee-summary/route.ts` (NEW)

- GET endpoint returning fee breakdown: collected, pending, overdue
- Calculated from Invoice table by status
- Requires ADMIN role

### 9. `/src/app/api/dashboard/pipeline/route.ts` (NEW)

- GET endpoint returning CRM pipeline stages
- Groups Leads by stage, sums estimatedValue
- 5 stages: NEW (#9ca3af), CONTACTED (#3b82f6), VISITED (#8b5cf6), APPLIED (#eab308), ENROLLED (#10b981)
- Requires ADMIN role

## Build Verification

- ✅ `npx next build` passes successfully
- ✅ `bun run lint` passes with no errors
- ✅ All routes properly registered in Next.js app router
