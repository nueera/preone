// ============================================================
// PreOne — Module Registry
//
// Central definition of all 15 admin portal modules. Each entry
// drives the dashboard card, the module page header, and
// navigation. The Dashboard card links to /admin/dashboard
// (the KPI + charts page, not the module grid).
//
// Only "communication" gets a notification badge (spec §5).
// Only "daily-milestones" gets a tagline (hero card, spec §5).
// ============================================================

export interface ModuleDef {
  key: string;
  label: string;
  href: string;
  subtitle: string;
  primaryAction: string;
  tagline?: string;
  badge?: number;
}

export const MODULES: ModuleDef[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    subtitle: 'KPIs, charts and school overview',
    primaryAction: '',
  },
  {
    key: 'setup',
    label: 'Setup & Onboarding',
    href: '/admin/setup',
    subtitle: 'Configure your school and academic year',
    primaryAction: '+ Start Setup',
  },
  {
    key: 'admission',
    label: 'Admission',
    href: '/admin/admissions',
    subtitle: 'Manage admissions pipeline and enquiries',
    primaryAction: '+ New Enquiry',
  },
  {
    key: 'students',
    label: 'Students',
    href: '/admin/students',
    subtitle: 'Manage student records and admissions',
    primaryAction: '+ Add Student',
  },
  {
    key: 'parents',
    label: 'Parents',
    href: '/admin/parents',
    subtitle: 'Parent contacts and portal access',
    primaryAction: '+ Add Parent',
  },
  {
    key: 'teachers',
    label: 'Teachers',
    href: '/admin/teachers',
    subtitle: 'Staff records, assignments and leave',
    primaryAction: '+ Add Teacher',
  },
  {
    key: 'classes',
    label: 'Classes',
    href: '/admin/classes',
    subtitle: 'Classes, sections and timetables',
    primaryAction: '+ New Class',
  },
  {
    key: 'operations',
    label: 'Operations',
    href: '/admin/operations',
    subtitle: 'Day-to-day school operations',
    primaryAction: '+ New Task',
  },
  {
    key: 'fees',
    label: 'Fees',
    href: '/admin/fees',
    subtitle: 'Invoices, payments and receipts',
    primaryAction: '+ New Invoice',
  },
  {
    key: 'communication',
    label: 'Communication',
    href: '/admin/communication',
    subtitle: 'Messages, announcements and notifications',
    primaryAction: '+ New Message',
    badge: 8,
  },
  {
    key: 'reports',
    label: 'Reports',
    href: '/admin/reports',
    subtitle: 'Insights, exports and analytics',
    primaryAction: '+ New Report',
  },
  {
    key: 'ai-center',
    label: 'AI Center',
    href: '/admin/ai-center',
    subtitle: 'AI-powered tools and assistants',
    primaryAction: '+ New Workflow',
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    subtitle: 'System configuration and preferences',
    primaryAction: '',
  },
  {
    key: 'growth-passport',
    label: 'Growth Passport',
    href: '/admin/growth-passport',
    subtitle: "Track every child's growth journey",
    primaryAction: '+ New Entry',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    href: '/admin/attendance',
    subtitle: 'Daily attendance and reports',
    primaryAction: '+ Mark Attendance',
  },
  {
    key: 'daily-milestones',
    label: 'Daily Milestones',
    href: '/admin/daily-milestones',
    subtitle: "Capture every child's daily wins",
    primaryAction: '+ Log Milestone',
    tagline: 'Every Child. Every Milestone. Every Day. 💜',
  },
];

/**
 * Look up a module by its key. Returns undefined if not found.
 */
export function getModule(key: string): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key);
}
