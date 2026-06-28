'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PreOneCard } from '@/components/ui/preone-card';

/**
 * CosmicStatCard — Animated stat card with count-up number animation.
 *
 * Uses framer-motion's `useMotionValue` + `useTransform` for smooth
 * number interpolation from 0 → value on mount.
 *
 * Layout (mobile-first):
 *   - Mobile: illustration + label + value in a row, trend below
 *   - Desktop: same row, illustration scales up slightly
 *
 * Supports two icon modes:
 *   1. Custom illustration image (imageSrc) — always visible
 *   2. Lucide icon fallback — shown in a gradient badge
 */

export interface CosmicStatCardProps {
  /** Stat label */
  label: string;
  /** Numeric value to display and animate to */
  value: number;
  /** Optional prefix/suffix like '₹' or '%' */
  suffix?: string;
  /** Optional custom display value override (e.g. "₹4.8L" for revenue) */
  displayOverride?: string;
  /** Icon element (fallback when no imageSrc) */
  icon: React.ReactNode;
  /** Tailwind bg class for the left color accent stripe (e.g. 'bg-purple-500') */
  color: string;
  /** Optional custom illustration image src — replaces the icon badge */
  imageSrc?: string;
  /** Trend indicator */
  trend?: {
    value: number;
    positive: boolean;
  };
  /** Additional CSS classes */
  className?: string;
}

export function CosmicStatCard({
  label,
  value,
  suffix,
  displayOverride,
  icon,
  color,
  imageSrc,
  trend,
  className,
}: CosmicStatCardProps) {
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (latest: number) => {
    const rounded = Math.round(latest);
    return suffix ? `${suffix}${rounded.toLocaleString()}` : rounded.toLocaleString();
  });
  const [displayText, setDisplayText] = React.useState(
    suffix ? `${suffix}0` : '0'
  );
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const controls = animate(motionVal, value, {
      duration: 1.2,
      ease: 'easeOut',
    });

    const unsubscribe = display.on('change', (v: string) => {
      setDisplayText(v);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionVal, display]);

  return (
    <PreOneCard
      variant="strip"
      className={cn('relative overflow-hidden', className)}
      hover
    >
      {/* Left color accent stripe */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px]',
          color
        )}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        {/* ── Left: illustration/icon + label + value ── */}
        <div className="flex items-center gap-3 min-w-0">
          {imageSrc ? (
            /* Custom illustration image — always visible, scales with screen */
            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
              <Image
                src={imageSrc}
                alt={label}
                width={48}
                height={48}
                className="h-full w-full object-contain drop-shadow-sm"
              />
            </div>
          ) : (
            /* Fallback: lucide icon in gradient badge */
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 shrink-0 rounded-xl',
                'bg-gradient-to-br from-[var(--preone-primary-50)] to-[var(--preone-primary-100)]',
                'dark:from-[rgba(129,140,248,0.12)] dark:to-[rgba(129,140,248,0.06)]',
                'shadow-sm'
              )}
            >
              <span className="text-[var(--preone-primary)] dark:text-[var(--preone-primary-light)]">
                {icon}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[11px] sm:text-[12px] font-medium uppercase tracking-wider text-[var(--text-secondary)] truncate block">
              {label}
            </span>
            <span className="text-[20px] sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] block leading-tight mt-0.5">
              {displayOverride ?? displayText}
            </span>
          </div>
        </div>

        {/* ── Trend indicator ── */}
        {trend && (
          <div className="flex items-center gap-1 sm:shrink-0">
            {trend.positive ? (
              <TrendingUp className="w-3.5 h-3.5 text-[var(--preone-green)]" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-[var(--preone-coral)]" />
            )}
            <span
              className={cn(
                'text-[11px] sm:text-xs font-semibold',
                trend.positive ? 'text-[var(--preone-green)]' : 'text-[var(--preone-coral)]'
              )}
            >
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)]">vs last month</span>
          </div>
        )}
      </div>

      {/* Planet decoration (bottom-right, 5% opacity) */}
      <div
        className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-[0.05]"
        style={{
          background:
            'radial-gradient(circle, var(--preone-primary) 0%, transparent 70%)',
        }}
      />
    </PreOneCard>
  );
}

export default CosmicStatCard;
