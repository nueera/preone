'use client';

/**
 * WarmPill — sticker-style pill badge.
 * Pastel background, rounded-full, subtle border, friendly type.
 * Variants match warm accents. Used for lead stages, sources, priorities, statuses.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type WarmPillVariant =
  | 'primary'
  | 'sage'
  | 'honey'
  | 'sky'
  | 'lavender'
  | 'rose'
  | 'neutral';

type WarmPillProps = {
  children: React.ReactNode;
  variant?: WarmPillVariant;
  /** Optional dot before label */
  dot?: boolean;
  /** Optional icon */
  icon?: React.ElementType;
  className?: string;
  size?: 'sm' | 'md';
};

const variantClasses: Record<WarmPillVariant, { bg: string; text: string; border: string; dot: string }> = {
  primary: {
    bg: 'bg-[var(--warm-primary-soft)]',
    text: 'text-[var(--warm-primary-ink)]',
    border: 'border-[var(--warm-primary-soft)]',
    dot: 'bg-[var(--warm-primary)]',
  },
  sage: {
    bg: 'bg-[var(--warm-sage-soft)]',
    text: 'text-[var(--warm-sage-ink)]',
    border: 'border-[var(--warm-sage-soft)]',
    dot: 'bg-[var(--warm-sage)]',
  },
  honey: {
    bg: 'bg-[var(--warm-honey-soft)]',
    text: 'text-[var(--warm-honey-ink)]',
    border: 'border-[var(--warm-honey-soft)]',
    dot: 'bg-[var(--warm-honey)]',
  },
  sky: {
    bg: 'bg-[var(--warm-sky-soft)]',
    text: 'text-[var(--warm-sky-ink)]',
    border: 'border-[var(--warm-sky-soft)]',
    dot: 'bg-[var(--warm-sky)]',
  },
  lavender: {
    bg: 'bg-[var(--warm-lavender-soft)]',
    text: 'text-[var(--warm-lavender-ink)]',
    border: 'border-[var(--warm-lavender-soft)]',
    dot: 'bg-[var(--warm-lavender)]',
  },
  rose: {
    bg: 'bg-[var(--warm-rose-soft)]',
    text: 'text-[var(--warm-rose-ink)]',
    border: 'border-[var(--warm-rose-soft)]',
    dot: 'bg-[var(--warm-rose)]',
  },
  neutral: {
    bg: 'bg-[var(--warm-bg-soft)]',
    text: 'text-[var(--warm-ink-soft)]',
    border: 'border-[var(--warm-border)]',
    dot: 'bg-[var(--warm-ink-muted)]',
  },
};

export function WarmPill({
  children,
  variant = 'neutral',
  dot = false,
  icon: Icon,
  className,
  size = 'sm',
}: WarmPillProps) {
  const v = variantClasses[variant];
  const sizeClass = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        sizeClass,
        v.bg,
        v.text,
        v.border,
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', v.dot)} />}
      {Icon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={2.5} />}
      {children}
    </span>
  );
}

// ── Helpers: map common CRM domain values to pill variants ──
const stageToVariant: Record<string, WarmPillVariant> = {
  NEW: 'sky',
  ENQUIRY: 'sky',
  CONTACTED: 'lavender',
  TOUR_SCHEDULED: 'honey',
  TOUR_COMPLETED: 'honey',
  APPLICATION_SENT: 'primary',
  APPLICATION_RECEIVED: 'primary',
  FOLLOW_UP: 'honey',
  NEGOTIATION: 'lavender',
  ENROLLED: 'sage',
  CONVERTED: 'sage',
  WON: 'sage',
  LOST: 'rose',
  DROPPED: 'rose',
};

const priorityToVariant: Record<string, WarmPillVariant> = {
  HIGH: 'rose',
  URGENT: 'rose',
  MEDIUM: 'honey',
  NORMAL: 'honey',
  LOW: 'sky',
};

const sourceToVariant: Record<string, WarmPillVariant> = {
  WEBSITE: 'primary',
  REFERRAL: 'sage',
  WALK_IN: 'honey',
  SOCIAL_MEDIA: 'lavender',
  FACEBOOK: 'lavender',
  INSTAGRAM: 'lavender',
  GOOGLE_ADS: 'sky',
  EVENT: 'honey',
  CALL: 'sky',
  OTHER: 'neutral',
};

export function WarmStagePill({ stage }: { stage: string }) {
  const variant = stageToVariant[stage?.toUpperCase()] ?? 'neutral';
  return (
    <WarmPill variant={variant} dot>
      {stage ? stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '—'}
    </WarmPill>
  );
}

export function WarmPriorityPill({ priority }: { priority: string }) {
  const variant = priorityToVariant[priority?.toUpperCase()] ?? 'neutral';
  return (
    <WarmPill variant={variant} dot>
      {priority ? priority.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '—'}
    </WarmPill>
  );
}

export function WarmSourcePill({ source }: { source: string }) {
  const variant = sourceToVariant[source?.toUpperCase().replace(/\s+/g, '_')] ?? 'neutral';
  return (
    <WarmPill variant={variant}>
      {source ? source.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '—'}
    </WarmPill>
  );
}
