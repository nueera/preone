'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PreOneCard } from '@/components/ui/preone-card';

export interface CosmicStatCardProps {
  label: string;
  value: number;
  suffix?: string;
  displayOverride?: string;
  icon: React.ReactNode;
  color: string;
  imageSrc?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
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

      {/* Icon / Illustration area — always visible, responsive sizing */}
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div />
        {imageSrc ? (
          <div className="relative h-10 w-10 shrink-0 sm:h-12 sm:w-12 lg:h-14 lg:w-14">
            <Image
              src={imageSrc}
              alt={label}
              width={64}
              height={64}
              className="h-10 w-10 object-contain drop-shadow-sm sm:h-12 sm:w-12 lg:h-14 lg:w-14"
            />
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl sm:w-12 sm:h-12',
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

      {/* Value — responsive typography */}
      <div className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
        {displayOverride ?? displayText}
      </div>

      {/* Label + Trend — responsive */}
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:mt-2">
        <span className="text-xs text-[var(--text-secondary)] sm:text-sm">{label}</span>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[10px] font-medium sm:text-xs',
              trend.positive ? 'text-[var(--preone-green)]' : 'text-[var(--preone-coral)]'
            )}
          >
            {trend.positive ? (
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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

      {/* Planet decoration — scales down on mobile */}
      <div
        className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full opacity-[0.05] sm:-bottom-6 sm:-right-6 sm:h-24 sm:w-24"
        style={{
          background:
            'radial-gradient(circle, var(--preone-primary) 0%, transparent 70%)',
        }}
      />
    </PreOneCard>
  );
}

export default CosmicStatCard;
