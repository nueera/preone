/**
 * PreOne Cosmic Theme System
 *
 * Central source of truth for all theme constants, time-of-day theming,
 * role-based accents, and cosmic color definitions.
 *
 * CSS custom properties in globals.css map to these values.
 * Components should use CSS variables (--preone-*) for styling,
 * and import from here only when JS values are needed.
 */

// ============================================================
// COSMIC COLOR CONSTANTS
// ============================================================

export const COSMIC_COLORS = {
  // Primary brand
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primary50: '#EEF2FF',
  primary100: '#E0E7FF',

  // Accent palette
  blue: '#0096C7',
  orange: '#FFB700',
  pink: '#FF4D6D',
  green: '#34D399',
  coral: '#FB7185',
  coralDark: '#ff7675',
  turquoise: '#00d2d3',

  // Dark mode cosmic
  cosmicVoid: '#0a0a1a',
  nebula: '#121234',
  deepSpace: '#1a1a3a',
  cosmicPurple: '#6c5ce7',

  // Status colors
  success: '#34D399',
  successDark: '#55efc4',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#60A5FA',
} as const;

// ============================================================
// TIME-OF-DAY THEME
// ============================================================

export type TimeOfDay = 'morning' | 'afternoon' | 'night';

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

export const TIME_THEME_CONFIG = {
  morning: {
    bg: '#FFFCF5',        // Warm white
    surface: '#FFF8ED',   // Warm surface
    accent: '#FFB700',    // Golden sun
    aurora: 'rgba(255, 183, 0, 0.06)',
    greeting: 'Good Morning',
    icon: '\u2600\uFE0F',
  },
  afternoon: {
    bg: '#FFFFFF',        // Clean white
    surface: '#F9FAFB',   // Cool surface
    accent: '#0096C7',    // Sky blue
    aurora: 'rgba(0, 150, 199, 0.06)',
    greeting: 'Good Afternoon',
    icon: '\uD83C\uDF24\uFE0F',
  },
  night: {
    bg: '#0a0a1a',        // Cosmic void
    surface: '#121234',   // Nebula
    accent: '#6c5ce7',    // Cosmic purple
    aurora: 'rgba(108, 92, 231, 0.12)',
    greeting: 'Good Evening',
    icon: '\uD83C\uDF0C',
  },
} as const;

// ============================================================
// ROLE-BASED COLOR ACCENTS
// ============================================================

export const ROLE_ACCENTS = {
  admin: { primary: '#7B2CBF', tint: 'rgba(123, 44, 191, 0.04)' },
  teacher: { primary: '#0096C7', tint: 'rgba(0, 150, 199, 0.04)' },
  parent: { primary: '#FF4D6D', tint: 'rgba(255, 77, 109, 0.04)' },
  taskmaster: { primary: '#00F5A0', tint: 'rgba(0, 245, 160, 0.04)' },
} as const;

export type UserRole = keyof typeof ROLE_ACCENTS;

// ============================================================
// COSMIC GRADIENT HELPERS
// ============================================================

export const COSMIC_GRADIENTS = {
  /** Primary brand gradient */
  brand: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
  /** Sidebar gradient (light mode) */
  sidebar: 'linear-gradient(180deg, #4F46E5 0%, #6366F1 100%)',
  /** Sidebar gradient (dark mode) */
  sidebarDark: 'linear-gradient(180deg, #0a0a1a 0%, #121234 100%)',
  /** Hero card gradient */
  hero: 'linear-gradient(135deg, #6366F1 0%, #0096C7 50%, #FF4D6D 100%)',
  /** Story circle unseen gradient */
  storyUnseen: 'linear-gradient(135deg, #6366F1, #0096C7, #FF4D6D)',
  /** Aurora gradient for dark mode backgrounds */
  aurora: 'linear-gradient(135deg, rgba(108,92,231,0.15) 0%, rgba(0,150,199,0.10) 50%, rgba(255,77,109,0.08) 100%)',
  /** Achievement gold gradient */
  achievement: 'linear-gradient(135deg, #FFB700 0%, #FF4D6D 100%)',
} as const;

// ============================================================
// EMOTIONAL LANGUAGE HELPERS (for parent portal)
// ============================================================

export const EMOTIONAL_ADJECTIVES: Record<string, string> = {
  excellent: 'amazing',
  great: 'wonderful',
  good: 'lovely',
  okay: 'pleasant',
  poor: 'challenging',
  bad: 'tough',
};

export const MOOD_EMOJIS: Record<string, string> = {
  HAPPY: '\uD83E\uDD29',
  EXCITED: '\uD83E\uDD73',
  CALM: '\uD83D\uDE0C',
  SAD: '\uD83E\uDD72',
  TIRED: '\uD83D\uDE34',
  ANGRY: '\uD83D\uDE24',
};

export function getDayAdjective(mood: string | null): { adjective: string; emoji: string } {
  if (!mood) return { adjective: 'wonderful', emoji: '\u2728' };
  const m = mood.toUpperCase();
  if (m.includes('HAPPY') || m.includes('EXCITED')) return { adjective: 'amazing', emoji: '\uD83C\uDF1F' };
  if (m.includes('CALM') || m.includes('PEACEFUL')) return { adjective: 'peaceful', emoji: '\uD83C\uDF3F' };
  if (m.includes('SAD') || m.includes('UPSET')) return { adjective: 'tough', emoji: '\uD83D\uDC96' };
  if (m.includes('TIRED')) return { adjective: 'quiet', emoji: '\uD83C\uDF19' };
  return { adjective: 'lovely', emoji: '\u2728' };
}
