'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PreOneCard } from '@/components/ui/preone-card';

/**
 * CosmicStatCard — Animated stat card with count-up number animation.
 *
 * Uses framer-motion's `useMotionValue` + `useTransform` for smooth
 * number interpolation from 0 → value on mount.
 */

export interface CosmicStatCardProps {
  /** Stat label */
  label: string;
  /** Numeric value to display and animate to */
  value: number;
  /** Optional prefix/suffix like '₹' or '%' */
  suffix?: string;
  /** Icon element rendered in top-right */
  icon: React.ReactNode;
  /** Tailwind bg class for the left color accent stripe (e.g. 'bg-purple-500') */
  color: string;
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
  icon,
  color,
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
      {/* Left color accent stripe (overrides the default gradient stripe) */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px]',
          color
        )}
      />

      {/* Icon with gradient glow */}
      <div className="flex items-start justify-between mb-3">
        <div />
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl',
            'bg-gradient-to-br from-[var(--preone-primary-50)] to-[var(--preone-primary-100)]',
            'dark:from-[rgba(129,140,248,0.12)] dark:to-[rgba(129,140,248,0.06)]',
            'shadow-sm'
          )}
        >
          <span className="text-[var(--preone-primary)] dark:text-[var(--preone-primary-light)]">
            {icon}
          </span>
        </div>
      </div>

      {/* Value */}
      <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        {displayText}
      </div>

      {/* Label + Trend */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              trend.positive ? 'text-[var(--preone-green)]' : 'text-[var(--preone-coral)]'
            )}
          >
            {trend.positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.positive ? '+' : ''}
            {trend.value}%
          </span>
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
