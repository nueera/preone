'use client';

/**
 * WarmEmptyState — friendly, illustrated empty states.
 * Uses line-art SVG illustrations from warm-illustrations.tsx.
 * Custom friendly copy with subtle warmth.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  WarmSeedling,
  WarmBook,
  WarmCalendarCheck,
  WarmSearch,
  WarmPencil,
  WarmPuzzle,
  WarmPhone,
  WarmChildren,
  WarmJourney,
  WarmSparkle,
} from './warm-illustrations';

export type WarmIllustrationType =
  | 'seedling'
  | 'book'
  | 'calendar'
  | 'search'
  | 'pencil'
  | 'puzzle'
  | 'phone'
  | 'children'
  | 'journey'
  | 'sparkle';

type WarmEmptyStateProps = {
  /** Which illustration to show */
  illustration?: WarmIllustrationType;
  /** The headline — keep it warm and friendly */
  title: string;
  /** Supporting copy — 1-2 sentences */
  description?: string;
  /** Optional CTA */
  action?: React.ReactNode;
  /** Optional secondary action */
  secondaryAction?: React.ReactNode;
  /** Compact mode — smaller illustration, less padding */
  compact?: boolean;
  className?: string;
};

const illustrationMap: Record<WarmIllustrationType, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  seedling: WarmSeedling,
  book: WarmBook,
  calendar: WarmCalendarCheck,
  search: WarmSearch,
  pencil: WarmPencil,
  puzzle: WarmPuzzle,
  phone: WarmPhone,
  children: WarmChildren,
  journey: WarmJourney,
  sparkle: WarmSparkle,
};

const illustrationColors: Record<WarmIllustrationType, string> = {
  seedling: 'text-[var(--warm-sage)]',
  book: 'text-[var(--warm-primary)]',
  calendar: 'text-[var(--warm-honey-ink)]',
  search: 'text-[var(--warm-ink-muted)]',
  pencil: 'text-[var(--warm-lavender-ink)]',
  puzzle: 'text-[var(--warm-sky-ink)]',
  phone: 'text-[var(--warm-primary)]',
  children: 'text-[var(--warm-sage)]',
  journey: 'text-[var(--warm-honey-ink)]',
  sparkle: 'text-[var(--warm-honey)]',
};

export function WarmEmptyState({
  illustration = 'seedling',
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
}: WarmEmptyStateProps) {
  const Illustration = illustrationMap[illustration];
  const colorClass = illustrationColors[illustration];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className,
      )}
    >
      <div
        className={cn(
          'relative',
          compact ? 'h-16 w-16' : 'h-28 w-28',
        )}
      >
        {/* Soft circle behind illustration */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-[var(--warm-bg-soft)]',
          )}
        />
        <Illustration
          className={cn(
            'relative h-full w-full',
            colorClass,
          )}
          strokeWidth={1.4}
        />
      </div>

      <h3
        className={cn(
          'warm-heading mt-5 font-semibold text-[var(--warm-ink)]',
          compact ? 'text-base' : 'text-xl',
        )}
        style={{ letterSpacing: '-0.02em' }}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'mt-2 text-[var(--warm-ink-muted)] max-w-md mx-auto',
            compact ? 'text-xs' : 'text-sm leading-relaxed',
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
