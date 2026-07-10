'use client';

/**
 * WarmProgressRing — circular progress with animated stroke.
 * Used for lead scores, conversion rates, pipeline velocity.
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type WarmAccent = 'primary' | 'sage' | 'honey' | 'sky' | 'lavender' | 'rose';

type WarmProgressRingProps = {
  /** Value 0-100 */
  value: number;
  /** Max value — default 100 */
  max?: number;
  /** Size in px — default 120 */
  size?: number;
  /** Stroke width — default 10 */
  strokeWidth?: number;
  accent?: WarmAccent;
  /** Center label (overrides default percentage) */
  label?: string;
  /** Center sublabel */
  sublabel?: string;
  /** Animate on mount — default true */
  animate?: boolean;
  className?: string;
};

const accentStroke: Record<WarmAccent, string> = {
  primary: 'var(--warm-primary)',
  sage: 'var(--warm-sage)',
  honey: 'var(--warm-honey)',
  sky: 'var(--warm-sky)',
  lavender: 'var(--warm-lavender)',
  rose: 'var(--warm-rose)',
};

const accentSoft: Record<WarmAccent, string> = {
  primary: 'var(--warm-primary-soft)',
  sage: 'var(--warm-sage-soft)',
  honey: 'var(--warm-honey-soft)',
  sky: 'var(--warm-sky-soft)',
  lavender: 'var(--warm-lavender-soft)',
  rose: 'var(--warm-rose-soft)',
};

export function WarmProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  accent = 'primary',
  label,
  sublabel,
  animate = true,
  className,
}: WarmProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const targetOffset = circumference - (pct / 100) * circumference;

  const [offset, setOffset] = useState(animate ? circumference : targetOffset);

  useEffect(() => {
    if (!animate) {
      setOffset(targetOffset);
      return;
    }
    const t = setTimeout(() => setOffset(targetOffset), 100);
    return () => clearTimeout(t);
  }, [targetOffset, animate]);

  const stroke = accentStroke[accent];
  const softBg = accentSoft[accent];
  const gradId = `warm-ring-${accent}-${size}`;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={stroke} stopOpacity="1" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={softBg}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="warm-numeric warm-heading text-2xl font-semibold text-[var(--warm-ink)] leading-none">
          {label ?? `${Math.round(pct)}%`}
        </span>
        {sublabel && (
          <span className="mt-1 text-xs text-[var(--warm-ink-muted)]">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
