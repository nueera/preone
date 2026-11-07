'use client';

// ============================================================
// PreOne — Onboarding Progress Bar
//
// Animated bar showing onboarding step progress.
// Uses var(--admin-*) CSS variables exclusively.
// ============================================================

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
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--admin-text-subtle)' }}
          >
            Step {currentStep} of {totalSteps}
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: 'var(--admin-primary)' }}
          >
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        style={{ background: 'var(--admin-surface-2)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--admin-primary)' }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
