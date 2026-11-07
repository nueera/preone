'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Size variant for the icon container */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * EmptyState — Consistent empty state placeholder for lists/tables.
 * Shows icon, title, description, and optional action button.
 * Uses CSS variable colors for proper dark mode support.
 * 
 * Usage:
 * <EmptyState icon={<Users />} title="No leads" description="Add your first lead" action={<Button>Add</Button>} />
 */
export function EmptyState({ icon, title, description, action, className, size = 'md' }: EmptyStateProps) {
  const iconSizes = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div
        className={cn('mb-3 flex items-center justify-center', iconSizes[size])}
        style={{ color: 'var(--admin-text-subtle, #9CA3AF)' }}
      >
        {icon}
      </div>
      <p
        className="font-medium"
        style={{ color: 'var(--admin-text-muted, #6B7280)' }}
      >
        {title}
      </p>
      {description && (
        <p
          className="text-sm mt-1 max-w-sm"
          style={{ color: 'var(--admin-text-subtle, #9CA3AF)' }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
