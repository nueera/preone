/**
 * PreOne Theme Tokens — Centralized color & style configuration
 *
 * All shared color maps, portal themes, and UI tokens are defined here.
 * Portal-specific styles are scoped via CSS variables in globals.css
 * using [data-portal="admin|teacher|parent"] selectors.
 *
 * Usage:
 *   import { ACTIVITY_COLORS, STATUS_COLORS } from '@/lib/theme-tokens';
 *   const color = ACTIVITY_COLORS[activityType];
 */

// ============================================================
// PORTAL THEME DEFINITIONS
// ============================================================

export const PORTAL_THEMES = {
  admin: {
    name: 'Admin',
    /** Primary brand color for the admin portal */
    primary: '#7C3AED',
    primaryLight: '#A78BFA',
    primaryDark: '#5B21B6',
    /** Sidebar gradient */
    sidebarGradient: 'linear-gradient(180deg, #5B21B6 0%, #1D4ED8 50%, #0369A1 100%)',
    /** CTA button gradient */
    btnGradient: 'linear-gradient(135deg, #7C3AED 0%, #0EA5E9 100%)',
    btnGradientHover: 'linear-gradient(135deg, #6D28D9 0%, #0284C7 100%)',
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
    primary: '#059669',
    primaryLight: '#34D399',
    primaryDark: '#047857',
    sidebarGradient: 'linear-gradient(180deg, #059669 0%, #0d9488 100%)',
    btnGradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
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
    primary: '#0ea5e9',
    primaryLight: '#38BDF8',
    primaryDark: '#0284C7',
    sidebarGradient: 'linear-gradient(180deg, #0ea5e9 0%, #3b82f6 100%)',
    btnGradient: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
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
  ART:        { bg: 'bg-pink-100', text: 'text-pink-700', hex: '#ec4899', icon: '🎨' },
  MUSIC:      { bg: 'bg-purple-100', text: 'text-purple-700', hex: '#8b5cf6', icon: '🎵' },
  DANCE:      { bg: 'bg-orange-100', text: 'text-orange-700', hex: '#f97316', icon: '💃' },
  OUTDOOR:    { bg: 'bg-green-100', text: 'text-green-700', hex: '#22c55e', icon: '🌳' },
  INDOOR:     { bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6', icon: '🏠' },
  SPORTS:     { bg: 'bg-teal-100', text: 'text-teal-700', hex: '#14b8a6', icon: '⚽' },
  STORYTELLING: { bg: 'bg-indigo-100', text: 'text-indigo-700', hex: '#6366f1', icon: '📖' },
  CRAFT:      { bg: 'bg-yellow-100', text: 'text-yellow-700', hex: '#eab308', icon: '✂️' },
  ACADEMIC:   { bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6', icon: '📚' },
  OTHER:      { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#9ca3af', icon: '📋' },
};

/**
 * Growth dimension colors — Shared across Admin, Teacher, Parent growth pages
 * Key: Growth dimension slug
 */
export const GROWTH_COLORS: Record<string, { bg: string; text: string; hex: string; lightBg: string }> = {
  creativity:       { bg: 'bg-pink-100', text: 'text-pink-700', hex: '#ec4899', lightBg: '#FDF2F8' },
  communication:    { bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6', lightBg: '#EFF6FF' },
  social:           { bg: 'bg-green-100', text: 'text-green-700', hex: '#22c55e', lightBg: '#F0FDF4' },
  physical:         { bg: 'bg-orange-100', text: 'text-orange-700', hex: '#f97316', lightBg: '#FFF7ED' },
  cognitive:        { bg: 'bg-purple-100', text: 'text-purple-700', hex: '#8b5cf6', lightBg: '#FAF5FF' },
  emotional:        { bg: 'bg-teal-100', text: 'text-teal-700', hex: '#14b8a6', lightBg: '#F0FDFA' },
  language:         { bg: 'bg-sky-100', text: 'text-sky-700', hex: '#0ea5e9', lightBg: '#F0F9FF' },
};

/**
 * Attendance status colors — Used across all 3 portals
 * Key: Prisma AttendanceStatus enum value (UPPERCASE)
 */
export const ATTENDANCE_COLORS: Record<string, { bg: string; text: string; hex: string; dot: string }> = {
  PRESENT:   { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#10b981', dot: 'bg-emerald-500' },
  ABSENT:    { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444', dot: 'bg-red-500' },
  LATE:      { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b', dot: 'bg-amber-500' },
  EXCUSED:   { bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6', dot: 'bg-blue-500' },
  HALF_DAY:  { bg: 'bg-yellow-100', text: 'text-yellow-700', hex: '#eab308', dot: 'bg-yellow-500' },
};

/**
 * Fee status colors — Used across Admin, Parent portals
 * Key: Prisma FeeStatus enum value (UPPERCASE)
 */
export const FEE_COLORS: Record<string, { bg: string; text: string; hex: string; dot: string }> = {
  PAID:     { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#10b981', dot: 'bg-emerald-500' },
  PENDING:  { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b', dot: 'bg-amber-500' },
  OVERDUE:  { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444', dot: 'bg-red-500' },
  PARTIAL:  { bg: 'bg-yellow-100', text: 'text-yellow-700', hex: '#eab308', dot: 'bg-yellow-500' },
};

/**
 * Meal status colors — Used in Teacher/Parent daily updates
 * Key: Prisma MealStatus enum value (UPPERCASE)
 */
export const MEAL_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  EATEN:      { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#10b981' },
  PARTIAL:    { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  NOT_EATEN:  { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
};

/**
 * Mood colors — Used in Teacher/Parent daily updates
 * Key: Prisma Mood enum value (UPPERCASE)
 */
export const MOOD_COLORS: Record<string, { bg: string; text: string; hex: string; emoji: string }> = {
  HAPPY:   { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#10b981', emoji: '😊' },
  CALM:    { bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6', emoji: '😌' },
  EXCITED: { bg: 'bg-purple-100', text: 'text-purple-700', hex: '#8b5cf6', emoji: '🤩' },
  SAD:     { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444', emoji: '😢' },
};

/**
 * Health rating colors — Used in Teacher/Parent daily updates
 * Key: Prisma HealthRating enum value (UPPERCASE)
 */
export const HEALTH_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  GOOD:   { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#10b981' },
  FAIR:   { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  POOR:   { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
};

/**
 * Observation category colors — Used in Teacher/Parent observations
 */
export const OBSERVATION_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  COGNITIVE:  { bg: 'bg-purple-100', text: 'text-purple-700', hex: '#a855f7' },
  SOCIAL:     { bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6' },
  PHYSICAL:   { bg: 'bg-green-100', text: 'text-green-700', hex: '#10b981' },
  EMOTIONAL:  { bg: 'bg-red-100', text: 'text-red-700', hex: '#f43f5e' },
  LANGUAGE:   { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  CREATIVE:   { bg: 'bg-sky-100', text: 'text-sky-700', hex: '#0ea5e9' },
};

/**
 * CRM pipeline stage colors — Used in Admin CRM
 */
export const CRM_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  NEW:          { bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6' },
  CONTACTED:    { bg: 'bg-purple-100', text: 'text-purple-700', hex: '#8b5cf6' },
  TOUR_SCHEDULED: { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  TOUR_COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#10b981' },
  APPLICATION:  { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
  ENROLLED:     { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#10b981' },
  LOST:         { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#9ca3af' },
};

/**
 * Communication type colors — Used across all portals
 */
export const COMMUNICATION_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  ANNOUNCEMENT: { bg: 'bg-violet-100', text: 'text-violet-700', hex: '#7C3AED' },
  MESSAGE:      { bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6' },
  ALERT:        { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
  EVENT:        { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  REMINDER:     { bg: 'bg-teal-100', text: 'text-teal-700', hex: '#14b8a6' },
};

/**
 * Chart color palette — Consistent colors across all portals' Recharts
 * Use these for chart series instead of hardcoded hex values
 */
export const CHART_PALETTE = {
  series: ['#7C3AED', '#0EA5E9', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1', '#F97316'],
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
  ACHIEVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#10b981' },
  PENDING:  { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  HIGH:     { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
};

/**
 * Priority colors — Used for communication priority, etc.
 */
export const PRIORITY_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  HIGH:   { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
  MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  LOW:    { bg: 'bg-green-100', text: 'text-green-700', hex: '#22c55e' },
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
