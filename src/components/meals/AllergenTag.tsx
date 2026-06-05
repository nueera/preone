'use client';

import { cn } from '@/lib/utils';
import type { AllergenType } from './types';
import { ALLERGEN_EMOJIS, ALLERGEN_LABELS } from './types';

interface AllergenTagProps {
  allergen: AllergenType;
  size?: 'sm' | 'md';
  variant?: 'default' | 'warning' | 'danger';
  className?: string;
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-0.5',
  md: 'px-2 py-1 text-xs gap-1',
} as const;

const variantClasses = {
  default:
    'bg-white/10 text-white/70 border border-white/10',
  warning:
    'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  danger:
    'bg-red-500/20 text-red-300 border border-red-500/30',
} as const;

export function AllergenTag({
  allergen,
  size = 'md',
  variant = 'default',
  className,
}: AllergenTagProps) {
  const emoji = ALLERGEN_EMOJIS[allergen] ?? '⚠️';
  const label = ALLERGEN_LABELS[allergen] ?? allergen;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <span className="shrink-0">{emoji}</span>
      <span>{label}</span>
    </span>
  );
}
