'use client';

/**
 * WarmCard — the core warm surface.
 * White card on cream bg, beige border, colored soft shadow, rounded corners.
 *
 * Variants (warm): 'default' | 'tinted' | 'elevated' | 'glass'
 * Variants (legacy compat): 'strip' | 'emotional' | 'hero' | 'achievement' | 'cosmic'
 * Accent: 'primary' | 'sage' | 'honey' | 'sky' | 'lavender' | 'rose' | 'none'
 * Lift on hover when `interactive` or `hover`.
 *
 * Backward-compatible with PreOneCard: accepts `hover` prop and all PreOneCard variants,
 * plus spreads standard HTMLAttributes.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

type WarmAccent = 'primary' | 'sage' | 'honey' | 'sky' | 'lavender' | 'rose' | 'none';

type WarmCardVariant =
  | 'default'
  | 'tinted'
  | 'elevated'
  | 'glass'
  | 'strip'
  | 'emotional'
  | 'hero'
  | 'achievement'
  | 'cosmic';

export interface WarmCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: WarmCardVariant;
  accent?: WarmAccent;
  interactive?: boolean;
  /** Legacy alias for `interactive` — adds hover lift effect */
  hover?: boolean;
  /** Add warm-fade-in animation on mount */
  fade?: boolean;
  /** Render as a different element */
  as?: React.ElementType;
}

const accentShadowMap: Record<WarmAccent, string> = {
  primary: 'shadow-[var(--warm-shadow-primary)]',
  sage: 'shadow-[var(--warm-shadow-sage)]',
  honey: 'shadow-[var(--warm-shadow-honey)]',
  sky: 'shadow-[var(--warm-shadow-sky)]',
  lavender: 'shadow-[var(--warm-shadow-lavender)]',
  rose: 'shadow-[var(--warm-shadow-rose)]',
  none: '',
};

const accentBorderMap: Record<WarmAccent, string> = {
  primary: 'before:bg-[var(--warm-primary)]',
  sage: 'before:bg-[var(--warm-sage)]',
  honey: 'before:bg-[var(--warm-honey)]',
  sky: 'before:bg-[var(--warm-sky)]',
  lavender: 'before:bg-[var(--warm-lavender)]',
  rose: 'before:bg-[var(--warm-rose)]',
  none: '',
};

const variantClasses: Record<WarmCardVariant, string> = {
  default: 'bg-[var(--warm-surface)] border-[var(--warm-border)] shadow-[var(--warm-shadow-sm)]',
  tinted: 'bg-[var(--warm-surface-tint)] border-[var(--warm-border)]',
  elevated: 'bg-[var(--warm-surface-elevated)] border-[var(--warm-border)] shadow-[var(--warm-shadow-md)]',
  glass: 'bg-white/70 backdrop-blur-md border-[var(--warm-border)] shadow-[var(--warm-shadow-sm)]',
  // Legacy compat variants — mapped to warm aesthetic
  strip: 'bg-[var(--warm-surface)] border-[var(--warm-border)] shadow-[var(--warm-shadow-sm)] relative overflow-hidden',
  emotional:
    'bg-gradient-to-br from-[var(--warm-rose-soft)] via-[var(--warm-sky-soft)] to-[var(--warm-lavender-soft)] border-[var(--warm-border)] shadow-[var(--warm-shadow-sm)]',
  hero:
    'bg-gradient-to-br from-[var(--warm-primary)] via-[var(--warm-honey)] to-[var(--warm-rose)] text-white border-0 shadow-[var(--warm-shadow-md)] overflow-hidden relative',
  achievement:
    'bg-gradient-to-br from-[var(--warm-honey-soft)] via-[var(--warm-primary-soft)] to-[var(--warm-rose-soft)] border-[var(--warm-border)] shadow-[var(--warm-shadow-sm)]',
  cosmic:
    'bg-gradient-to-br from-[var(--warm-lavender-soft)] via-[var(--warm-sky-soft)] to-[var(--warm-primary-soft)] border-[var(--warm-border)] shadow-[var(--warm-shadow-sm)] backdrop-blur-md',
};

export function WarmCard({
  children,
  className,
  variant = 'default',
  accent = 'none',
  interactive = false,
  hover = false,
  fade = false,
  as: Component = 'div',
  ...props
}: WarmCardProps) {
  const base =
    'relative rounded-[var(--warm-radius-lg)] border transition-all duration-300 ease-out';
  const variantClass = variantClasses[variant] ?? variantClasses.default;

  const accentClass =
    accent !== 'none'
      ? `${accentShadowMap[accent]} ${accentBorderMap[accent]} before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-[var(--warm-radius-lg)]`
      : '';

  const isInteractive = interactive || hover;
  const interactiveClass = isInteractive
    ? 'warm-lift cursor-pointer hover:border-[var(--warm-border-strong)]'
    : '';

  const fadeClass = fade ? 'warm-fade-in' : '';

  return (
    <Component
      className={cn(base, variantClass, accentClass, interactiveClass, fadeClass, className)}
      {...props}
    >
      {children}
    </Component>
  );
}

// ── WarmCard sub-components ──
export function WarmCardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-6 pt-5 pb-3', className)}>
      {children}
    </div>
  );
}

export function WarmCardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn('warm-heading text-lg leading-tight text-[var(--warm-ink)]', className)}>
      {children}
    </h3>
  );
}

export function WarmCardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('mt-1 text-sm text-[var(--warm-ink-muted)]', className)}>
      {children}
    </p>
  );
}

export function WarmCardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function WarmCardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-[var(--warm-divider)] flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  );
}
