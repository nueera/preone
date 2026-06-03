/**
 * PreOne Theme Tokens — Centralized color & style configuration
 *
 * All shared color maps, portal themes, and UI tokens are defined here.
 * Portal-specific styles are scoped via CSS variables in globals.css
 * using [data-portal="admin|teacher|parent"] selectors.
 *
 * Architecture: 3 portals (Admin, Teacher, Parent), 4 roles (ADMIN, TASK_MASTER, TEACHER, PARENT)
 * TASK_MASTER shares Admin portal but only sees CRM + Dashboard.
 *
 * Usage:
 *   import { ROLE_THEMES, PREONE_COLORS } from '@/lib/theme-tokens';
 *   const color = ROLE_THEMES.admin.primary;
 */

// ============================================================
// PREONE BRAND COLORS — Semantic color palettes
// ============================================================

export const PREONE_COLORS = {
  /** Purple — Admin / Brand primary */
  purple: {
    50:  '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#7C3AED',
    600: '#6D28D9',
    700: '#5B21B6',
    800: '#4C1D95',
    900: '#3B0764',
    950: '#2E1065',
  },
  /** Blue — Teacher / Trust */
  blue: {
    50:  '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  /** Sky — Parent / Warmth */
  sky: {
    50:  '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  /** Star / Orange — CRM / Energy / Task Master accent */
  star: {
    50:  '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  /** Growth / Green — Progress / Achievement */
  growth: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  /** Pink — Parent accent / Love */
  pink: {
    50:  '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  /** Emerald — Teacher accent */
  emerald: {
    50:  '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  /** Teal — Teacher secondary */
  teal: {
    50:  '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
} as const;

// ============================================================
// PREONE GRADIENTS — Brand gradient definitions
// ============================================================

export const PREONE_GRADIENTS = {
  /** Primary brand gradient: Purple → Sky */
  primary: 'linear-gradient(135deg, #7C3AED 0%, #0EA5E9 100%)',
  /** Primary hover: Darker variant */
  primaryHover: 'linear-gradient(135deg, #6D28D9 0%, #0284C7 100%)',
  /** Admin sidebar: Deep purple → blue → sky */
  adminSidebar: 'linear-gradient(180deg, #5B21B6 0%, #1D4ED8 50%, #0369A1 100%)',
  /** Teacher: Emerald → Teal */
  teacher: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
  /** Teacher sidebar */
  teacherSidebar: 'linear-gradient(180deg, #059669 0%, #0d9488 100%)',
  /** Parent: Sky → Blue */
  parent: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
  /** Parent sidebar */
  parentSidebar: 'linear-gradient(180deg, #0ea5e9 0%, #3b82f6 100%)',
  /** Success: Green → Lime */
  success: 'linear-gradient(135deg, #22C55E, #84CC16)',
  /** Pink */
  pink: 'linear-gradient(135deg, #EC4899, #F472B6)',
  /** Yellow / Warning */
  yellow: 'linear-gradient(135deg, #FACC15, #FB923C)',
  /** Login background */
  login: 'linear-gradient(135deg, #EDE9FE 0%, #E0F2FE 50%, #F0FDF4 100%)',
} as const;

// ============================================================
// ROLE THEME TOKENS — 3 portals, 4 roles
// TASK_MASTER uses Admin theme colors but has orange CRM accent
// ============================================================

export const ROLE_THEMES = {
  admin: {
    name: 'Admin',
    primary: PREONE_COLORS.purple[500],
    primaryLight: PREONE_COLORS.purple[50],
    primaryDark: PREONE_COLORS.purple[900],
    sidebarBg: PREONE_COLORS.purple[950],
    sidebarText: '#E2E8F0',
    sidebarActiveBg: PREONE_COLORS.purple[800],
    sidebarActiveText: '#FFFFFF',
    accent: PREONE_COLORS.star[500],
    gradient: PREONE_GRADIENTS.primary,
    icon: 'ShieldCheck' as const,
  },
  taskmaster: {
    name: 'Task Master',
    // SAME ADMIN LAYOUT — just CRM-only view
    // Uses admin theme colors but orange accent for CRM energy
    primary: PREONE_COLORS.purple[500],
    primaryLight: PREONE_COLORS.purple[50],
    primaryDark: PREONE_COLORS.purple[900],
    sidebarBg: PREONE_COLORS.purple[950],
    sidebarText: '#E2E8F0',
    sidebarActiveBg: PREONE_COLORS.purple[800],
    sidebarActiveText: '#FFFFFF',
    accent: PREONE_COLORS.star[500],
    gradient: PREONE_GRADIENTS.primary,
    icon: 'Zap' as const,
  },
  teacher: {
    name: 'Teacher',
    primary: PREONE_COLORS.blue[500],
    primaryLight: PREONE_COLORS.blue[50],
    primaryDark: PREONE_COLORS.blue[900],
    sidebarBg: PREONE_COLORS.blue[950],
    sidebarText: '#E2E8F0',
    sidebarActiveBg: PREONE_COLORS.blue[800],
    sidebarActiveText: '#FFFFFF',
    accent: PREONE_COLORS.growth[400],
    gradient: 'linear-gradient(135deg, #0096C7 0%, #00F5A0 100%)',
    icon: 'GraduationCap' as const,
  },
  parent: {
    name: 'Parent',
    primary: PREONE_COLORS.purple[400],
    primaryLight: PREONE_COLORS.purple[50],
    primaryDark: PREONE_COLORS.purple[800],
    sidebarBg: '#FFFFFF',
    sidebarText: PREONE_COLORS.purple[700],
    sidebarActiveBg: PREONE_COLORS.purple[50],
    sidebarActiveText: PREONE_COLORS.purple[600],
    accent: PREONE_COLORS.pink[400],
    gradient: 'linear-gradient(135deg, #9D4EDD 0%, #FF4D6D 100%)',
    icon: 'Heart' as const,
  },
} as const;

export type RoleName = keyof typeof ROLE_THEMES;

// ============================================================
// PORTAL THEME DEFINITIONS — Backward-compatible with existing components
// ============================================================

export const PORTAL_THEMES = {
  admin: {
    name: 'Admin',
    /** Primary brand color for the admin portal */
    primary: PREONE_COLORS.purple[500],
    primaryLight: PREONE_COLORS.purple[400],
    primaryDark: PREONE_COLORS.purple[700],
    /** Sidebar gradient */
    sidebarGradient: PREONE_GRADIENTS.adminSidebar,
    /** CTA button gradient */
    btnGradient: PREONE_GRADIENTS.primary,
    btnGradientHover: PREONE_GRADIENTS.primaryHover,
    /** Tailwind gradient classes */
    btnGradientClass: 'from-violet-600 to-sky-500',
    btnGradientHoverClass: 'from-violet-700 to-sky-600',
    /** Avatar fallback gradient */
    avatarGradientClass: 'from-violet-500 to-sky-400',
    /** Card background gradient */
    cardGradientClass: 'from-violet-50 to-sky-50',
    /** Sidebar active nav */
    navActiveClass: 'bg-purple-600 text-white font-medium shadow-sm border-l-4 border-purple-800',
    navInactiveClass: 'text-purple-100 hover:bg-purple-50/10 hover:text-white dark:hover:bg-purple-900/30',
    navLabelClass: 'text-purple-200/70',
    navSubtextClass: 'text-purple-200',
    navFooterClass: 'text-purple-200 hover:bg-white/10 hover:text-white',
    /** Avatar fallback class */
    avatarFallbackClass: 'bg-violet-200 text-violet-700',
    /** Selected item class */
    selectedClass: 'bg-violet-50 text-violet-700',
  },
  teacher: {
    name: 'Teacher',
    primary: PREONE_COLORS.emerald[500],
    primaryLight: PREONE_COLORS.emerald[400],
    primaryDark: PREONE_COLORS.emerald[700],
    sidebarGradient: PREONE_GRADIENTS.teacherSidebar,
    btnGradient: PREONE_GRADIENTS.teacher,
    btnGradientHover: 'linear-gradient(135deg, #047857 0%, #0f766e 100%)',
    btnGradientClass: 'from-emerald-500 to-teal-500',
    btnGradientHoverClass: 'from-emerald-600 to-teal-600',
    avatarGradientClass: 'from-emerald-400 to-teal-500',
    cardGradientClass: 'from-emerald-50 to-teal-50',
    navActiveClass: 'bg-emerald-600 text-white font-medium shadow-sm border-l-4 border-emerald-800',
    navInactiveClass: 'text-emerald-100 hover:bg-emerald-50/10 hover:text-white dark:hover:bg-emerald-900/30',
    navLabelClass: 'text-emerald-200/70',
    navSubtextClass: 'text-emerald-200',
    navFooterClass: 'text-emerald-200 hover:bg-white/10 hover:text-white',
    avatarFallbackClass: 'bg-emerald-200 text-emerald-700',
    selectedClass: 'bg-emerald-50 text-emerald-700',
  },
  parent: {
    name: 'Parent',
    primary: PREONE_COLORS.sky[500],
    primaryLight: PREONE_COLORS.sky[400],
    primaryDark: PREONE_COLORS.sky[700],
    sidebarGradient: PREONE_GRADIENTS.parentSidebar,
    btnGradient: PREONE_GRADIENTS.parent,
    btnGradientHover: 'linear-gradient(135deg, #0284C7 0%, #2563eb 100%)',
    btnGradientClass: 'from-sky-500 to-blue-500',
    btnGradientHoverClass: 'from-sky-600 to-blue-600',
    avatarGradientClass: 'from-sky-400 to-blue-500',
    cardGradientClass: 'from-sky-50 to-blue-50',
    navActiveClass: 'bg-sky-600 text-white font-medium shadow-sm border-l-4 border-blue-800',
    navInactiveClass: 'text-sky-100 hover:bg-sky-50/10 hover:text-white dark:hover:bg-sky-900/30',
    navLabelClass: 'text-sky-200/70',
    navSubtextClass: 'text-sky-200',
    navFooterClass: 'text-sky-200 hover:bg-white/10 hover:text-white',
    avatarFallbackClass: 'bg-sky-200 text-sky-700',
    selectedClass: 'bg-sky-50 text-sky-700',
  },
} as const;

export type PortalName = keyof typeof PORTAL_THEMES;

// ============================================================
// SHARED COLOR MAPS — Used across multiple portals
// ============================================================

/**
 * Activity type colors — Shared across Admin, Teacher activities
 * Key: Prisma ActivityType enum value (UPPERCASE)
 */
export const ACTIVITY_COLORS: Record<string, { bg: string; text: string; hex: string; icon: string }> = {
  ART:        { bg: 'bg-pink-100', text: 'text-pink-700', hex: PREONE_COLORS.pink[500], icon: '🎨' },
  MUSIC:      { bg: 'bg-purple-100', text: 'text-purple-700', hex: PREONE_COLORS.purple[500], icon: '🎵' },
  DANCE:      { bg: 'bg-orange-100', text: 'text-orange-700', hex: PREONE_COLORS.star[500], icon: '💃' },
  OUTDOOR:    { bg: 'bg-green-100', text: 'text-green-700', hex: PREONE_COLORS.growth[500], icon: '🌳' },
  INDOOR:     { bg: 'bg-blue-100', text: 'text-blue-700', hex: PREONE_COLORS.blue[500], icon: '🏠' },
  SPORTS:     { bg: 'bg-teal-100', text: 'text-teal-700', hex: PREONE_COLORS.teal[500], icon: '⚽' },
  STORYTELLING: { bg: 'bg-indigo-100', text: 'text-indigo-700', hex: '#6366f1', icon: '📖' },
  CRAFT:      { bg: 'bg-yellow-100', text: 'text-yellow-700', hex: '#eab308', icon: '✂️' },
  ACADEMIC:   { bg: 'bg-blue-100', text: 'text-blue-700', hex: PREONE_COLORS.blue[500], icon: '📚' },
  OTHER:      { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#9ca3af', icon: '📋' },
};

/**
 * Growth dimension colors — Shared across Admin, Teacher, Parent growth pages
 * Key: Growth dimension slug
 */
export const GROWTH_COLORS: Record<string, { bg: string; text: string; hex: string; lightBg: string }> = {
  creativity:       { bg: 'bg-pink-100', text: 'text-pink-700', hex: PREONE_COLORS.pink[500], lightBg: '#FDF2F8' },
  communication:    { bg: 'bg-blue-100', text: 'text-blue-700', hex: PREONE_COLORS.blue[500], lightBg: '#EFF6FF' },
  social:           { bg: 'bg-green-100', text: 'text-green-700', hex: PREONE_COLORS.growth[500], lightBg: '#F0FDF4' },
  physical:         { bg: 'bg-orange-100', text: 'text-orange-700', hex: PREONE_COLORS.star[500], lightBg: '#FFF7ED' },
  cognitive:        { bg: 'bg-purple-100', text: 'text-purple-700', hex: PREONE_COLORS.purple[500], lightBg: '#FAF5FF' },
  emotional:        { bg: 'bg-teal-100', text: 'text-teal-700', hex: PREONE_COLORS.teal[500], lightBg: '#F0FDFA' },
  language:         { bg: 'bg-sky-100', text: 'text-sky-700', hex: PREONE_COLORS.sky[500], lightBg: '#F0F9FF' },
};

/**
 * Attendance status colors — Used across all 3 portals
 * Key: Prisma AttendanceStatus enum value (UPPERCASE)
 */
export const ATTENDANCE_COLORS: Record<string, { bg: string; text: string; hex: string; dot: string }> = {
  PRESENT:   { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: PREONE_COLORS.emerald[500], dot: 'bg-emerald-500' },
  ABSENT:    { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444', dot: 'bg-red-500' },
  LATE:      { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b', dot: 'bg-amber-500' },
  EXCUSED:   { bg: 'bg-blue-100', text: 'text-blue-700', hex: PREONE_COLORS.blue[500], dot: 'bg-blue-500' },
  HALF_DAY:  { bg: 'bg-yellow-100', text: 'text-yellow-700', hex: '#eab308', dot: 'bg-yellow-500' },
};

/**
 * Fee status colors — Used across Admin, Parent portals
 * Key: Prisma FeeStatus enum value (UPPERCASE)
 */
export const FEE_COLORS: Record<string, { bg: string; text: string; hex: string; dot: string }> = {
  PAID:     { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: PREONE_COLORS.emerald[500], dot: 'bg-emerald-500' },
  PENDING:  { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b', dot: 'bg-amber-500' },
  OVERDUE:  { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444', dot: 'bg-red-500' },
  PARTIAL:  { bg: 'bg-yellow-100', text: 'text-yellow-700', hex: '#eab308', dot: 'bg-yellow-500' },
};

/**
 * Meal status colors — Used in Teacher/Parent daily updates
 * Key: Prisma MealStatus enum value (UPPERCASE)
 */
export const MEAL_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  EATEN:      { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: PREONE_COLORS.emerald[500] },
  PARTIAL:    { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  NOT_EATEN:  { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
};

/**
 * Mood colors — Used in Teacher/Parent daily updates
 * Key: Prisma Mood enum value (UPPERCASE)
 */
export const MOOD_COLORS: Record<string, { bg: string; text: string; hex: string; emoji: string }> = {
  HAPPY:   { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: PREONE_COLORS.emerald[500], emoji: '😊' },
  CALM:    { bg: 'bg-blue-100', text: 'text-blue-700', hex: PREONE_COLORS.blue[500], emoji: '😌' },
  EXCITED: { bg: 'bg-purple-100', text: 'text-purple-700', hex: PREONE_COLORS.purple[500], emoji: '🤩' },
  SAD:     { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444', emoji: '😢' },
};

/**
 * Health rating colors — Used in Teacher/Parent daily updates
 * Key: Prisma HealthRating enum value (UPPERCASE)
 */
export const HEALTH_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  GOOD:   { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: PREONE_COLORS.emerald[500] },
  FAIR:   { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  POOR:   { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
};

/**
 * Observation category colors — Used in Teacher/Parent observations
 */
export const OBSERVATION_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  COGNITIVE:  { bg: 'bg-purple-100', text: 'text-purple-700', hex: '#a855f7' },
  SOCIAL:     { bg: 'bg-blue-100', text: 'text-blue-700', hex: PREONE_COLORS.blue[500] },
  PHYSICAL:   { bg: 'bg-green-100', text: 'text-green-700', hex: PREONE_COLORS.growth[500] },
  EMOTIONAL:  { bg: 'bg-red-100', text: 'text-red-700', hex: '#f43f5e' },
  LANGUAGE:   { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  CREATIVE:   { bg: 'bg-sky-100', text: 'text-sky-700', hex: PREONE_COLORS.sky[500] },
};

/**
 * CRM pipeline stage colors — Used in Admin CRM
 */
export const CRM_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  NEW:            { bg: 'bg-blue-100', text: 'text-blue-700', hex: PREONE_COLORS.blue[500] },
  CONTACTED:      { bg: 'bg-purple-100', text: 'text-purple-700', hex: PREONE_COLORS.purple[500] },
  TOUR_SCHEDULED: { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  TOUR_COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: PREONE_COLORS.emerald[500] },
  APPLICATION:    { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
  ENROLLED:       { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: PREONE_COLORS.emerald[500] },
  LOST:           { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#9ca3af' },
};

/**
 * Communication type colors — Used across all portals
 */
export const COMMUNICATION_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  ANNOUNCEMENT: { bg: 'bg-violet-100', text: 'text-violet-700', hex: PREONE_COLORS.purple[500] },
  MESSAGE:      { bg: 'bg-blue-100', text: 'text-blue-700', hex: PREONE_COLORS.blue[500] },
  ALERT:        { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
  EVENT:        { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  REMINDER:     { bg: 'bg-teal-100', text: 'text-teal-700', hex: PREONE_COLORS.teal[500] },
};

/**
 * Chart color palette — Consistent colors across all portals' Recharts
 * Use these for chart series instead of hardcoded hex values
 */
export const CHART_PALETTE = {
  series: [PREONE_COLORS.purple[500], PREONE_COLORS.sky[500], PREONE_COLORS.growth[500], '#F59E0B', PREONE_COLORS.pink[500], PREONE_COLORS.teal[500], '#6366F1', PREONE_COLORS.star[500]],
  grid: '#e5e7eb',
  gridLight: '#f0f0f0',
  axis: '#6b7280',
  axisLight: '#9ca3af',
  tooltip: '#374151',
} as const;

/**
 * Helper: Get a color from CHART_PALETTE.series by index (wraps around)
 */
export function getChartColor(index: number): string {
  return CHART_PALETTE.series[index % CHART_PALETTE.series.length];
}

/**
 * Growth achievement status colors
 */
export const ACHIEVEMENT_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  ACHIEVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: PREONE_COLORS.emerald[500] },
  PENDING:  { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  HIGH:     { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
};

/**
 * Priority colors — Used for communication priority, etc.
 */
export const PRIORITY_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  HIGH:   { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
  MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  LOW:    { bg: 'bg-green-100', text: 'text-green-700', hex: PREONE_COLORS.growth[500] },
};

/**
 * Generic status color helper — maps common status strings to colors
 * Useful when rendering dynamic status values
 */
export function getStatusColor(status: string): { bg: string; text: string; hex: string } {
  const upper = status.toUpperCase();
  if (ATTENDANCE_COLORS[upper]) return ATTENDANCE_COLORS[upper];
  if (FEE_COLORS[upper]) return FEE_COLORS[upper];
  if (MEAL_COLORS[upper]) return MEAL_COLORS[upper];
  if (HEALTH_COLORS[upper]) return HEALTH_COLORS[upper];
  if (ACHIEVEMENT_COLORS[upper]) return ACHIEVEMENT_COLORS[upper];
  // Default
  return { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#9ca3af' };
}

// ============================================================
// ROLE ACCESS HELPERS
// ============================================================

/** Which sidebar menu items each admin role can see */
export const ADMIN_ROLE_ACCESS = {
  ADMIN: ['dashboard', 'students', 'teachers', 'attendance', 'fees', 'crm', 'activities', 'growth', 'communication', 'transport', 'settings'],
  TASK_MASTER: ['dashboard', 'crm'],
} as const;

/** Check if a role can access a specific admin module */
export function canAccessModule(role: string, module: string): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'TASK_MASTER') {
    const allowed = ADMIN_ROLE_ACCESS.TASK_MASTER;
    return allowed.includes(module as typeof allowed[number]);
  }
  return false;
}

// ============================================================
// LIVING UNIVERSE — Refined Design Tokens
// ============================================================

export const LIVING_UNIVERSE = {
  /** Brand Primary — Indigo-Purple hybrid */
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primary50: '#EEF2FF',
  primary100: '#E0E7FF',

  /** Brand Secondary */
  blue: '#0096C7',
  orange: '#FFB700',
  pink: '#FF4D6D',
  green: '#34D399',
  coral: '#FB7185',

  /** Dark Mode Cosmic Accents */
  dark: {
    primary: '#6c5ce7',
    primaryLight: '#a29bfe',
    blue: '#00d2d3',
    orange: '#fdcb6e',
    pink: '#ff7675',
    green: '#55efc4',
    bgPrimary: '#0a0a1a',
    bgSecondary: '#121234',
    bgTertiary: '#1a1a3a',
    bgGlass: 'rgba(18, 18, 52, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    borderDefault: '#2d2d4a',
  },

  /** Skill Planet colors for Achievement Galaxy */
  skillPlanets: {
    art:     { color: '#FB7185', icon: '🎨', name: 'Art Planet' },
    math:    { color: '#60A5FA', icon: '🔢', name: 'Math Planet' },
    reading: { color: '#34D399', icon: '📚', name: 'Reading Planet' },
    sports:  { color: '#F59E0B', icon: '🏆', name: 'Sports Planet' },
    social:  { color: '#818CF8', icon: '💬', name: 'Social Planet' },
  },

  /** Reaction emojis */
  reactions: {
    love: '❤️',
    celebrate: '🎉',
    proud: '🌟',
    wow: '😮',
    heart: '💙',
  },

  /** Theme packs for customization */
  themePacks: [
    { id: 'cosmic', name: 'Cosmic Purple', icon: '🌌', primary: '#6366F1' },
    { id: 'ocean', name: 'Ocean Blue', icon: '🌊', primary: '#0EA5E9' },
    { id: 'forest', name: 'Forest Green', icon: '🌳', primary: '#10B981' },
    { id: 'sunset', name: 'Sunset Orange', icon: '🌅', primary: '#F97316' },
    { id: 'rose', name: 'Rose Garden', icon: '🌹', primary: '#EC4899' },
    { id: 'midnight', name: 'Midnight', icon: '🌙', primary: '#6c5ce7' },
  ],

  /** Day adjectives for emotional language */
  dayAdjectives: {
    amazing: { emoji: '🌈', text: 'amazing' },
    great: { emoji: '✨', text: 'great' },
    good: { emoji: '😊', text: 'good' },
    nice: { emoji: '👍', text: 'nice' },
    okay: { emoji: '🙂', text: 'okay' },
    quiet: { emoji: '🤫', text: 'quiet' },
    tired: { emoji: '😴', text: 'tired' },
    fussy: { emoji: '😤', text: 'a bit fussy' },
  },
} as const;
