'use client';

/**
 * WarmSectionHeading — premium section header.
 * Fraunces serif headline + optional kicker + decorative scribble underline.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { WarmScribble } from './warm-illustrations';

type WarmSectionHeadingProps = {
  /** Small uppercase label above the title */
  kicker?: string;
  /** The main headline */
  title: string;
  /** Optional sub-headline / description */
  description?: string;
  /** Optional accent color for kicker + scribble */
  accent?: 'primary' | 'sage' | 'honey' | 'sky' | 'lavender' | 'rose';
  /** Optional actions (buttons) on the right */
  actions?: React.ReactNode;
  /** Show the decorative scribble under the title */
  scribble?: boolean;
  /** Heading level — default h2 */
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
};

const accentColors = {
  primary: 'text-[var(--warm-primary)]',
  sage: 'text-[var(--warm-sage)]',
  honey: 'text-[var(--warm-honey-ink)]',
  sky: 'text-[var(--warm-sky-ink)]',
  lavender: 'text-[var(--warm-lavender-ink)]',
  rose: 'text-[var(--warm-rose-ink)]',
};

export function WarmSectionHeading({
  kicker,
  title,
  description,
  accent = 'primary',
  actions,
  scribble = false,
  as: HeadingTag = 'h2',
  className,
}: WarmSectionHeadingProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4', className)}>
      <div className="min-w-0">
        {kicker && (
          <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', accentColors[accent])}>
            {kicker}
          </p>
        )}
        <HeadingTag
          className="warm-heading mt-1 text-2xl sm:text-3xl font-semibold text-[var(--warm-ink)]"
          style={{ letterSpacing: '-0.025em' }}
        >
          {title}
        </HeadingTag>
        {scribble && (
          <WarmScribble className={cn('mt-1 h-2 w-40', accentColors[accent])} strokeWidth={2.5} />
        )}
        {description && (
          <p className="mt-3 text-sm sm:text-base text-[var(--warm-ink-muted)] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
