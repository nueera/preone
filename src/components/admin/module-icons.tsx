// ============================================================
// PreOne — Module Icon Registry
//
// Maps each module key to:
//   - asset: path under /public for the custom illustrated icon
//   - fallback: lucide-react icon shown when no custom asset exists
//
// Modules with custom webp icons render <Image> directly.
// Modules without custom assets fall back to lucide-react icons.
//
// Custom icons: 96×96+ webp, transparent bg, playful preschool aesthetic.
// Drop new icons into public/icons/admin/<key>.webp and add to the
// CUSTOM_ICON_KEYS set to activate.
// ============================================================

import Image from 'next/image';
import {
  LayoutDashboard,
  Settings2,
  ClipboardCheck,
  Users,
  UsersRound,
  GraduationCap,
  Backpack,
  Cog,
  Wallet,
  Mail,
  BarChart3,
  Bot,
  Settings,
  Sparkles,
  CalendarCheck,
  Castle,
  type LucideIcon,
} from 'lucide-react';

type ModuleIconConfig = {
  asset: string;
  fallback: LucideIcon;
};

/** Modules that have a custom webp icon in public/icons/admin/ */
const CUSTOM_ICON_KEYS = new Set([
  'dashboard',
  'setup',
  'admission',
  'students',
  'parents',
  'teachers',
  'classes',
  'operations',
  'fees',
  'communication',
  'reports',
  'settings',
  'growth-passport',
  'attendance',
]);

export const MODULE_ICONS: Record<string, ModuleIconConfig> = {
  dashboard:          { asset: '/icons/admin/dashboard.webp',        fallback: LayoutDashboard },
  setup:              { asset: '/icons/admin/setup.webp',            fallback: Settings2 },
  admission:          { asset: '/icons/admin/admission.webp',        fallback: ClipboardCheck },
  students:           { asset: '/icons/admin/students.webp',         fallback: Users },
  parents:            { asset: '/icons/admin/parents.webp',          fallback: UsersRound },
  teachers:           { asset: '/icons/admin/teachers.webp',         fallback: GraduationCap },
  classes:            { asset: '/icons/admin/classes.webp',          fallback: Backpack },
  operations:         { asset: '/icons/admin/operations.webp',       fallback: Cog },
  fees:               { asset: '/icons/admin/fees.webp',             fallback: Wallet },
  communication:      { asset: '/icons/admin/communication.webp',    fallback: Mail },
  reports:            { asset: '/icons/admin/reports.webp',          fallback: BarChart3 },
  'ai-center':        { asset: '/icons/admin/ai-center.webp',       fallback: Bot },
  settings:           { asset: '/icons/admin/settings.webp',         fallback: Settings },
  'growth-passport':  { asset: '/icons/admin/growth-passport.webp',  fallback: Sparkles },
  attendance:         { asset: '/icons/admin/attendance.webp',       fallback: CalendarCheck },
  'daily-milestones': { asset: '/icons/admin/daily-milestones.webp', fallback: Castle },
};

interface ModuleIconProps {
  iconKey: string;
  size?: number;
  className?: string;
}

/**
 * Renders a module icon. Modules with custom webp assets render
 * a Next.js <Image>; others fall back to a lucide-react icon.
 */
export function ModuleIcon({ iconKey, size = 48, className = '' }: ModuleIconProps) {
  const cfg = MODULE_ICONS[iconKey];
  if (!cfg) return null;

  // ── Custom webp icon available ──
  if (CUSTOM_ICON_KEYS.has(iconKey)) {
    return (
      <Image
        src={cfg.asset}
        alt=""
        width={size}
        height={size}
        className={`object-contain ${className}`}
        priority={false}
      />
    );
  }

  // ── Lucide fallback for modules without custom icons ──
  const FallbackIcon = cfg.fallback;
  return (
    <FallbackIcon
      size={size}
      className={`text-[var(--admin-primary)] ${className}`}
      strokeWidth={1.5}
    />
  );
}
