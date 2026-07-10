'use client';

/**
 * WarmCard — the core warm surface.
 * White card on cream bg, beige border, colored soft shadow, rounded corners.
 * Variants: 'default' | 'tinted' | 'elevated' | 'glass'
 * Accent: 'primary' | 'sage' | 'honey' | 'sky' | 'lavender' | 'rose' | 'none'
 * Lift on hover when `interactive`.
 */

import React from 'react';
import { cn } from '@/lib/utils';

type WarmAccent = 'primary' | 'sage' | 'honey' | 'sky' | 'lavender' | 'rose' | 'none';

type WarmCardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'tinted' | 'elevated' | 'glass';
  accent?: WarmAccent;
  interactive?: boolean;
  /** Add warm-fade-in animation on mount */
  fade?: boolean;
  /** Render as a different element */
  as?: React.ElementType;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
};

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

export function WarmCard({
  children,
  className,
  variant = 'default',
  accent = 'none',
  interactive = false,
  fade = false,
  as: Component = 'div',
  onClick,
  role,
  tabIndex,
  'aria-label': ariaLabel,
}: WarmCardProps) {
  const base =
    'relative rounded-[var(--warm-radius-lg)] border transition-all duration-300 ease-out';
  const variantClass = {
    default: 'bg-[var(--warm-surface)] border-[var(--warm-border)] shadow-[var(--warm-shadow-sm)]',
    tinted: 'bg-[var(--warm-surface-tint)] border-[var(--warm-border)]',
    elevated: 'bg-[var(--warm-surface-elevated)] border-[var(--warm-border)] shadow-[var(--warm-shadow-md)]',
    glass: 'bg-white/70 backdrop-blur-md border-[var(--warm-border)] shadow-[var(--warm-shadow-sm)]',
  }[variant];

  const accentClass = accent !== 'none'
    ? `${accentShadowMap[accent]} ${accentBorderMap[accent]} before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-[var(--warm-radius-lg)]`
    : '';

  const interactiveClass = interactive
    ? 'warm-lift cursor-pointer hover:border-[var(--warm-border-strong)]'
    : '';

  const fadeClass = fade ? 'warm-fade-in' : '';

  return (
    <Component
      className={cn(base, variantClass, accentClass, interactiveClass, fadeClass, className)}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function WarmCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-6 py-4 border-t border-[var(--warm-divider)] flex items-center', className)}>
      {children}
    </div>
  );
}
