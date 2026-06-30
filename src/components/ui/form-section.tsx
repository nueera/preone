'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

/* ============================================================
   FormSection — Consistent form section layout for admin pages
   
   Provides the standard pattern for form sections:
   - Section title + description
   - Optional divider
   - Content area with proper spacing
   - Optional actions row at the bottom
   
   Usage:
   <FormSection title="School Details" description="Basic information about your school">
     <div className="grid grid-cols-2 gap-4">
       <FormField ... />
     </div>
   </FormSection>
   ============================================================ */

interface FormSectionProps {
  /** Section title */
  title: string;
  /** Section description (shown below title in muted text) */
  description?: string;
  /** Optional icon displayed next to the title */
  icon?: React.ReactNode;
  /** Whether to show a separator at the top (default: false) */
  separator?: boolean;
  /** Content of the form section */
  children: React.ReactNode;
  /** Actions row at the bottom (save/cancel buttons) */
  actions?: React.ReactNode;
  /** Number of columns for the form grid (default: 1, no grid) */
  columns?: 1 | 2 | 3;
  /** Additional class name */
  className?: string;
}

export function FormSection({
  title,
  description,
  icon,
  separator = false,
  children,
  actions,
  columns = 1,
  className,
}: FormSectionProps) {
  const gridClass = {
    1: '',
    2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  }[columns];

  return (
    <div className={cn('space-y-4', className)}>
      {separator && <Separator />}

      {/* ── Section Header ── */}
      <div>
        <div className="flex items-center gap-2">
          {icon && (
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{ background: 'var(--admin-primary-soft)', color: 'var(--admin-primary)' }}
            >
              {icon}
            </span>
          )}
          <div>
            <h3
              className="text-base font-semibold"
              style={{ color: 'var(--admin-text)' }}
            >
              {title}
            </h3>
            {description && (
              <p
                className="text-sm mt-0.5"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Form Content ── */}
      <div className={cn(gridClass || 'space-y-4')}>
        {children}
      </div>

      {/* ── Actions ── */}
      {actions && (
        <div className="flex items-center justify-end gap-2 pt-2">
          {actions}
        </div>
      )}
    </div>
  );
}
