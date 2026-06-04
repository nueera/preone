'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
  /** Show step label next to the bar */
  showLabel?: boolean;
  /** Height variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function OnboardingProgressBar({
  currentStep,
  totalSteps = 8,
  className,
  showLabel = false,
  size = 'md',
}: OnboardingProgressBarProps) {
  const percentage = Math.min((currentStep / totalSteps) * 100, 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[var(--text-tertiary)]">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs font-semibold text-[var(--preone-primary)]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-[var(--bg-tertiary)] overflow-hidden',
          sizeClasses[size]
        )}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-primary-light)]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
