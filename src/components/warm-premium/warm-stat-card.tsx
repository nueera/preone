'use client';

/**
 * WarmStatCard — premium stat card with:
 * - Count-up animation on mount (subtle, 800ms ease-out)
 * - Sparkline (optional)
 * - Accent-colored soft shadow
 * - Delta badge (up/down vs previous period)
 * - Fraunces serif for the big number
 *
 * This is the hero of the Warm Premium system — replaces every "Total Leads: 247"
 * style card with something that feels alive and premium.
 */

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type WarmAccent = 'primary' | 'sage' | 'honey' | 'sky' | 'lavender' | 'rose';

type WarmStatCardProps = {
  /** The stat label, e.g. "Total Leads" */
  label: string;
  /** The numeric value to display (will be animated) */
  value: number;
  /** Optional formatting: prefix (₹, $) or suffix (%, /mo) */
  prefix?: string;
  suffix?: string;
  /** Optional delta vs previous period — % as a number, e.g. 12 for +12% */
  delta?: number;
  /** Whether a positive delta is good (default true). If false, positive = red. */
  positiveIsGood?: boolean;
  /** Accent color for the card */
  accent?: WarmAccent;
  /** Lucide icon component */
  icon?: React.ElementType;
  /** Optional sparkline data — array of numbers */
  sparkline?: number[];
  /** Optional caption shown under the value */
  caption?: string;
  /** Size: 'sm' for compact cards, 'lg' (default) for hero cards */
  size?: 'sm' | 'lg';
  className?: string;
  fade?: boolean;
  /** Disable the count-up animation (e.g. for SSR tests) */
  disableAnimation?: boolean;
};

const accentClasses: Record<WarmAccent, { bg: string; text: string; shadow: string; spark: string }> = {
  primary: {
    bg: 'bg-[var(--warm-primary-soft)]',
    text: 'text-[var(--warm-primary)]',
    shadow: 'shadow-[var(--warm-shadow-primary)]',
    spark: 'var(--warm-primary)',
  },
  sage: {
    bg: 'bg-[var(--warm-sage-soft)]',
    text: 'text-[var(--warm-sage)]',
    shadow: 'shadow-[var(--warm-shadow-sage)]',
    spark: 'var(--warm-sage)',
  },
  honey: {
    bg: 'bg-[var(--warm-honey-soft)]',
    text: 'text-[var(--warm-honey-ink)]',
    shadow: 'shadow-[var(--warm-shadow-honey)]',
    spark: 'var(--warm-honey)',
  },
  sky: {
    bg: 'bg-[var(--warm-sky-soft)]',
    text: 'text-[var(--warm-sky-ink)]',
    shadow: 'shadow-[var(--warm-shadow-sky)]',
    spark: 'var(--warm-sky)',
  },
  lavender: {
    bg: 'bg-[var(--warm-lavender-soft)]',
    text: 'text-[var(--warm-lavender-ink)]',
    shadow: 'shadow-[var(--warm-shadow-lavender)]',
    spark: 'var(--warm-lavender)',
  },
  rose: {
    bg: 'bg-[var(--warm-rose-soft)]',
    text: 'text-[var(--warm-rose-ink)]',
    shadow: 'shadow-[var(--warm-shadow-rose)]',
    spark: 'var(--warm-rose)',
  },
};

// ── Count-up hook ──
function useCountUp(end: number, durationMs = 900, enabled = true) {
  const [value, setValue] = useState(enabled ? 0 : end);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }
    if (typeof window === 'undefined') return;

    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(end * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(end);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, durationMs, enabled]);

  return value;
}

// ── Sparkline ──
function WarmSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const w = 100;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`);
  const path = `M ${points.join(' L ')}`;
  const areaPath = `${path} L ${w},${h} L 0,${h} Z`;
  const gradId = `warm-spark-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-7"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WarmStatCard({
  label,
  value,
  prefix = '',
  suffix = '',
  delta,
  positiveIsGood = true,
  accent = 'primary',
  icon: Icon,
  sparkline,
  caption,
  size = 'lg',
  className,
  fade = true,
  disableAnimation = false,
}: WarmStatCardProps) {
  const animatedValue = useCountUp(value, 900, !disableAnimation);
  const a = accentClasses[accent];

  // Delta rendering
  const showDelta = typeof delta === 'number' && !Number.isNaN(delta);
  const isPositive = (delta ?? 0) > 0;
  const isNegative = (delta ?? 0) < 0;
  const isFlat = (delta ?? 0) === 0;
  const deltaGood = isFlat ? true : (isPositive === positiveIsGood);
  const deltaColor = isFlat
    ? 'bg-[var(--warm-bg-soft)] text-[var(--warm-ink-muted)]'
    : deltaGood
    ? 'bg-[var(--warm-sage-soft)] text-[var(--warm-sage-ink)]'
    : 'bg-[var(--warm-rose-soft)] text-[var(--warm-rose-ink)]';
  const DeltaIcon = isFlat ? Minus : isPositive ? TrendingUp : TrendingDown;

  const isLg = size === 'lg';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--warm-radius-lg)] bg-[var(--warm-surface)] border border-[var(--warm-border)] px-5 py-4',
        a.shadow,
        fade && 'warm-fade-in',
        className,
      )}
    >
      {/* Decorative blob — adds depth */}
      <div className={cn('pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl', a.bg)} />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className={cn('text-[var(--warm-ink-muted)] font-medium', isLg ? 'text-sm' : 'text-xs')}>
            {label}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1">
            {prefix && (
              <span className={cn('warm-numeric text-[var(--warm-ink-soft)]', isLg ? 'text-base' : 'text-sm')}>
                {prefix}
              </span>
            )}
            <span
              className={cn(
                'warm-numeric warm-heading font-semibold leading-none text-[var(--warm-ink)]',
                isLg ? 'text-3xl' : 'text-2xl',
              )}
            >
              {animatedValue.toLocaleString('en-IN')}
            </span>
            {suffix && (
              <span className={cn('warm-numeric text-[var(--warm-ink-muted)]', isLg ? 'text-base' : 'text-sm')}>
                {suffix}
              </span>
            )}
          </div>
          {caption && (
            <p className="mt-1 text-xs text-[var(--warm-ink-muted)]">{caption}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--warm-radius-md)]', a.bg)}>
            <Icon className={cn('h-5 w-5', a.text)} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2">
        {showDelta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              deltaColor,
            )}
          >
            <DeltaIcon className="h-3 w-3" strokeWidth={2.5} />
            {isFlat ? '0%' : `${Math.abs(delta as number).toFixed(1)}%`}
          </span>
        )}
        {sparkline && sparkline.length >= 2 && (
          <div className="ml-auto w-24">
            <WarmSparkline data={sparkline} color={a.spark} />
          </div>
        )}
      </div>
    </div>
  );
}
