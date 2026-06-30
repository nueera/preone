'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/* ============================================================
   StatusBadge — Unified status indicator for the entire product
   
   Replaces the various badge patterns (CSS classes, inline styles,
   shadcn Badge) with a single consistent component.
   
   Supports both preset statuses and custom colors.
   
   Usage:
   <StatusBadge status="active" />
   <StatusBadge status="upcoming" label="Starts Soon" />
   <StatusBadge status="custom" color="purple" bg="soft" label="Review" />
   ============================================================ */

type StatusPreset =
  | 'active'
  | 'inactive'
  | 'upcoming'
  | 'completed'
  | 'pending'
  | 'cancelled'
  | 'overdue'
  | 'draft'
  | 'paid'
  | 'unpaid'
  | 'partial'
  | 'present'
  | 'absent'
  | 'late';

interface StatusBadgePresetProps {
  status: StatusPreset;
  /** Override the display label (default: capitalized status) */
  label?: string;
  /** Show a dot indicator before the label */
  dot?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface StatusBadgeCustomProps {
  status?: never;
  /** Custom label text */
  label: string;
  /** Text color (CSS value) */
  color: string;
  /** Background color (CSS value) */
  bg: string;
  /** Show a dot indicator before the label */
  dot?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type StatusBadgeProps = StatusBadgePresetProps | StatusBadgeCustomProps;

const presetConfig: Record<StatusPreset, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: '#059669', bg: '#D1FAE5' },
  inactive:  { label: 'Inactive',  color: '#6B7280', bg: '#F3F4F6' },
  upcoming:  { label: 'Upcoming',  color: '#2563EB', bg: '#DBEAFE' },
  completed: { label: 'Completed', color: '#6B7280', bg: '#F3F4F6' },
  pending:   { label: 'Pending',   color: '#D97706', bg: '#FEF3C7' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' },
  overdue:   { label: 'Overdue',   color: '#DC2626', bg: '#FEE2E2' },
  draft:     { label: 'Draft',     color: '#6B7280', bg: '#F3F4F6' },
  paid:      { label: 'Paid',      color: '#059669', bg: '#D1FAE5' },
  unpaid:    { label: 'Unpaid',    color: '#DC2626', bg: '#FEE2E2' },
  partial:   { label: 'Partial',   color: '#D97706', bg: '#FEF3C7' },
  present:   { label: 'Present',   color: '#059669', bg: '#D1FAE5' },
  absent:    { label: 'Absent',    color: '#DC2626', bg: '#FEE2E2' },
  late:      { label: 'Late',      color: '#D97706', bg: '#FEF3C7' },
};

const sizeClasses = {
  sm: 'text-[11px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2 h-2',
};

export function StatusBadge(props: StatusBadgeProps) {
  const { dot = true, size = 'md', className } = props;

  let label: string;
  let color: string;
  let bg: string;

  if (props.status) {
    const config = presetConfig[props.status];
    label = props.label ?? config.label;
    color = config.color;
    bg = config.bg;
  } else {
    // Custom props
    label = props.label;
    color = props.color;
    bg = props.bg;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
        sizeClasses[size],
        className
      )}
      style={{ color, backgroundColor: bg }}
    >
      {dot && (
        <span
          className={cn('rounded-full flex-shrink-0', dotSizes[size])}
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  );
}
