'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getStatusColor } from '@/lib/theme-tokens';

/**
 * StatusBadge — Unified status indicator with a colored dot + label.
 *
 * Replaces the 7+ pages that each define their own STATUS_COLORS maps.
 * Uses `getStatusColor` from `@/lib/theme-tokens` for the color mapping,
 * which checks ATTENDANCE_COLORS, FEE_COLORS, MEAL_COLORS, HEALTH_COLORS,
 * ACHIEVEMENT_COLORS, and falls back to a default gray scheme.
 *
 * @example
 * ```tsx
 * <StatusBadge status="PRESENT" />
 * <StatusBadge status="OVERDUE" size="lg" />
 * <StatusBadge status="custom-unknown" /> // Falls back to gray
 * ```
 */
export interface StatusBadgeProps {
  /** The status string to display (matched case-insensitively) */
  status: string;
  /** Size variant: sm (text-xs), md (text-sm), lg (text-base) */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className for the badge wrapper */
  className?: string;
}

/** Size-specific class mappings */
const SIZE_CLASSES: Record<NonNullable<StatusBadgeProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function StatusBadge({
  status,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const colorMap = getStatusColor(status);

  // Capitalize the status label for display
  const label = status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium',
        colorMap.bg,
        colorMap.text,
        SIZE_CLASSES[size],
        className
      )}
    >
      {/* Colored dot indicator */}
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: colorMap.hex }}
        aria-hidden="true"
      />
      {/* Status label */}
      <span>{label}</span>
    </span>
  );
}
