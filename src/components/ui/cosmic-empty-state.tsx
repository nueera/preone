'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * CosmicEmptyState — Animated empty state with floating icon.
 *
 * The icon container floats with a gentle y: [-6, 6] animation (3s infinite).
 * An optional action button uses the .preone-btn .preone-btn-primary CSS classes.
 */

export interface CosmicEmptyStateProps {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** Optional CTA action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
}

export function CosmicEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: CosmicEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {/* Floating icon container */}
      <motion.div
        animate={{ y: [-6, 6] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
        className={cn(
          'flex items-center justify-center w-20 h-20 rounded-2xl mb-6',
          'bg-[var(--preone-primary-50)] dark:bg-[rgba(129,140,248,0.08)]',
          'border border-[var(--border-default)] dark:border-[var(--border-default)]'
        )}
      >
        <span className="text-[var(--preone-primary)] dark:text-[var(--preone-primary-light)]">
          {icon}
        </span>
      </motion.div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed">
        {description}
      </p>

      {/* Optional action button */}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="preone-btn preone-btn-primary mt-6"
        >
          {action.label}
        </motion.button>
      )}
    </div>
  );
}

export default CosmicEmptyState;
