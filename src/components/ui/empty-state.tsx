'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState — Consistent empty state placeholder for lists/tables.
 * Shows icon, title, description, and optional action button.
 * Usage: <EmptyState icon={<Users />} title="No leads" description="Add your first lead" action={<Button>Add</Button>} />
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="h-12 w-12 text-gray-300 mb-3 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-gray-500 font-medium">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
