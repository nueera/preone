'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

/**
 * FormSection — A form grouping with title + description + separator + children.
 *
 * Provides a consistent layout for form sections across admin pages:
 * - Title (h3, font-heading)
 * - Optional description text
 * - A visual separator line
 * - Children area with consistent spacing
 *
 * @example
 * ```tsx
 * <FormSection title="Personal Information" description="Basic student details">
 *   <FormField label="First Name" required>...</FormField>
 *   <FormField label="Last Name">...</FormField>
 * </FormSection>
 * ```
 */
export interface FormSectionProps {
  /** Section title rendered as h3 */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Form fields or content within this section */
  children: React.ReactNode;
  /** Additional className for the wrapper div */
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Section header */}
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-semibold text-[var(--admin-text)]">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[var(--admin-text-muted)]">
            {description}
          </p>
        )}
      </div>

      {/* Visual separator */}
      <Separator />

      {/* Content area */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
