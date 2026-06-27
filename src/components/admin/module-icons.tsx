// ============================================================
// PreOne — Module Icon Registry
//
// Maps each module key to:
//   - asset: path under /public for the custom illustrated icon
//   - fallback: lucide-react icon shown when the asset is missing
//
// User will drop custom SVGs into public/icons/admin/<key>.svg.
// Recommended: 96×96 SVG, transparent bg, 1–2 colors, playful
// preschool aesthetic.
//
// Until custom assets are available, the fallback lucide icon is
// rendered at the requested size in --admin-primary (#6366F1).
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

export const MODULE_ICONS: Record<string, ModuleIconConfig> = {
  dashboard:          { asset: '/icons/admin/dashboard.svg',        fallback: LayoutDashboard },
  setup:              { asset: '/icons/admin/setup.svg',            fallback: Settings2 },
  admission:          { asset: '/icons/admin/admission.svg',        fallback: ClipboardCheck },
  students:           { asset: '/icons/admin/students.svg',         fallback: Users },
  parents:            { asset: '/icons/admin/parents.svg',          fallback: UsersRound },
  teachers:           { asset: '/icons/admin/teachers.svg',         fallback: GraduationCap },
  classes:            { asset: '/icons/admin/classes.svg',          fallback: Backpack },
  operations:         { asset: '/icons/admin/operations.svg',       fallback: Cog },
  fees:               { asset: '/icons/admin/fees.svg',             fallback: Wallet },
  communication:      { asset: '/icons/admin/communication.svg',    fallback: Mail },
  reports:            { asset: '/icons/admin/reports.svg',          fallback: BarChart3 },
  'ai-center':        { asset: '/icons/admin/ai-center.svg',       fallback: Bot },
  settings:           { asset: '/icons/admin/settings.svg',         fallback: Settings },
  'growth-passport':  { asset: '/icons/admin/growth-passport.svg',  fallback: Sparkles },
  attendance:         { asset: '/icons/admin/attendance.svg',       fallback: CalendarCheck },
  'daily-milestones': { asset: '/icons/admin/daily-milestones.svg', fallback: Castle },
};

interface ModuleIconProps {
  iconKey: string;
  size?: number;
  className?: string;
}

/**
 * Renders a module icon. Tries the custom SVG asset first; falls back
 * to a lucide icon if the asset hasn't been provided yet.
 *
 * Since we can't reliably detect a missing static asset at render time
 * without an extra network request, we render the lucide fallback by
 * default. Once the user drops SVGs into public/icons/admin/, they can
 * switch this component to prefer the <Image> variant.
 */
export function ModuleIcon({ iconKey, size = 48, className = '' }: ModuleIconProps) {
  const cfg = MODULE_ICONS[iconKey];
  if (!cfg) return null;

  // ── Use lucide fallback until custom assets are available ──
  const FallbackIcon = cfg.fallback;
  return (
    <FallbackIcon
      size={size}
      className={`text-[var(--admin-primary)] ${className}`}
      strokeWidth={1.5}
    />
  );

  // ── Uncomment once custom assets are in place ──
  // return (
  //   <Image
  //     src={cfg.asset}
  //     alt=""
  //     width={size}
  //     height={size}
  //     className={`object-contain ${className}`}
  //   />
  // );
}
