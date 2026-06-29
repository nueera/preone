'use client';

// ============================================================
// PreOne — Module Card (Dashboard Grid)
//
// A single card in the 16-card dashboard grid. Each card links
// to a module route.
//
// Variants:
//   - Regular: icon (64px) + label, min-h-[160px]
//   - Hero (daily-milestones): icon + two-line label with tagline,
//     min-h-[180px], subtle indigo gradient border on hover
//   - Badge (communication): red count pill in top-right corner
//
// Hover: translate-y -1px + shadow lift + border indigo tint.
// Focus: 2px indigo outline + 2px offset.
// ============================================================

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ModuleIcon } from '@/components/admin/module-icons';
import type { ModuleDef } from '@/components/admin/modules';

interface ModuleCardProps {
  module: ModuleDef;
}

// Per-module icon size overrides — [mobile, desktop]
const ICON_SIZES: Record<string, [number, number]> = {
  attendance: [64, 112],
  operations: [56, 96],
  teachers: [56, 96],
  settings: [48, 80],
  fees: [48, 80],
  communication: [48, 80],
  reports: [48, 80],
  'growth-passport': [48, 80],
};
const DEFAULT_ICON_SIZE: [number, number] = [40, 64];

export function ModuleCard({ module }: ModuleCardProps) {
  const isHero = module.key === 'daily-milestones';
  const hasBadge = module.badge != null && module.badge > 0;
  const [mobileSize, desktopSize] = ICON_SIZES[module.key] ?? DEFAULT_ICON_SIZE;

  return (
    <Link
      href={module.href}
      aria-label={`${module.label} module`}
      className="
        group relative flex flex-col items-center justify-center
        rounded-xl border border-[var(--admin-border)]
        bg-[var(--admin-surface)] p-4 sm:p-6 text-center
        transition-all duration-200
        hover:-translate-y-1 hover:border-[var(--admin-primary)]/30
        hover:shadow-[var(--admin-shadow-card-hover)]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[var(--admin-primary)] focus-visible:ring-offset-2
      "
      style={{ minHeight: isHero ? 160 : 140 }}
    >
      {/* ── Notification badge (communication only) ── */}
      {hasBadge && (
        <span
          className="
            absolute right-3 top-3 flex h-5 w-5 items-center justify-center
            rounded-full bg-[var(--admin-error)] text-[11px] font-bold text-white
          "
          aria-label={`${module.label} module, ${module.badge} unread`}
        >
          {module.badge}
        </span>
      )}

      {/* ── Icon ── */}
      <motion.span
        className="mb-3 sm:mb-4 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <ModuleIcon iconKey={module.key} size={mobileSize} smSize={desktopSize} />
      </motion.span>

      {/* ── Label ── */}
      {isHero ? (
        <span className="flex flex-col items-center gap-1">
          <span className="text-[14px] font-semibold text-[var(--admin-text)]">
            {module.label}
          </span>
          {module.tagline && (
            <span className="text-[12px] font-normal text-[var(--admin-text-muted)]">
              {module.tagline}
            </span>
          )}
        </span>
      ) : (
        <span className="text-[14px] font-semibold text-[var(--admin-text)]">
          {module.label}
        </span>
      )}
    </Link>
  );
}
