'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NutritionBarProps {
  label: string;
  value: number;
  recommended: number;
  unit?: string;
  color?: string;
  className?: string;
}

function getBarColor(pct: number, override?: string): string {
  if (override) return override;
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

function getTextColor(pct: number, override?: string): string {
  if (override) return override;
  if (pct >= 100) return 'text-emerald-400';
  if (pct >= 60) return 'text-amber-400';
  return 'text-red-400';
}

export function NutritionBar({
  label,
  value,
  recommended,
  unit = '',
  color,
  className,
}: NutritionBarProps) {
  const pct = recommended > 0 ? Math.round((value / recommended) * 100) : 0;
  const barWidth = Math.min(pct, 100);

  return (
    <div className={cn('space-y-1', className)}>
      {/* Label row */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60 font-medium">{label}</span>
        <span className={cn('font-semibold tabular-nums', getTextColor(pct, color))}>
          {value}
          {unit}{' '}
          <span className="text-white/40 font-normal">
            / {recommended}
            {unit}
          </span>
          <span className="ml-1.5 text-[10px]">({pct}%)</span>
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', getBarColor(pct, color))}
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
