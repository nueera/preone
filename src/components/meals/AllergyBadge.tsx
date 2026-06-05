'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AllergySeverity } from './types';
import { SEVERITY_COLORS } from './types';

interface AllergyBadgeProps {
  severity: AllergySeverity;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
} as const;

const dotSizeClasses = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
} as const;

export function AllergyBadge({
  severity,
  size = 'md',
  showPulse,
  className,
}: AllergyBadgeProps) {
  const config = SEVERITY_COLORS[severity];
  const shouldPulse =
    showPulse ?? (severity === 'SEVERE' || severity === 'LIFE_THREATENING');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        config.bg,
        config.text,
        sizeClasses[size],
        severity === 'LIFE_THREATENING' && 'ring-1 ring-red-700/50',
        className
      )}
    >
      <span className="relative flex">
        <motion.span
          className={cn('rounded-full', config.dot, dotSizeClasses[size])}
          {...(shouldPulse && {
            animate: {
              scale: severity === 'LIFE_THREATENING' ? [1, 1.8, 1] : [1, 1.4, 1],
              opacity: severity === 'LIFE_THREATENING' ? [1, 0.4, 1] : [1, 0.5, 1],
            },
            transition: {
              duration: severity === 'LIFE_THREATENING' ? 0.8 : 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          })}
        />
        {/* Glow layer for LIFE_THREATENING */}
        {severity === 'LIFE_THREATENING' && shouldPulse && (
          <motion.span
            className={cn(
              'absolute inset-0 rounded-full',
              config.dot,
              dotSizeClasses[size]
            )}
            animate={{
              scale: [1, 2.5, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </span>
      {config.label}
    </span>
  );
}
