'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

/**
 * FormField — Unified form field wrapper combining label + input + error/hint.
 *
 * Provides a consistent layout for form fields across admin pages:
 * - Label with optional required asterisk (red)
 * - Children slot for the actual Input/Select/Textarea
 * - Error message (red, shown when error is present)
 * - Hint text (muted, shown when hint is present and no error)
 *
 * @example
 * ```tsx
 * <FormField label="First Name" required error={errors.firstName}>
 *   <Input {...register('firstName')} />
 * </FormField>
 *
 * <FormField label="Email" hint="We'll never share your email">
 *   <Input type="email" {...register('email')} />
 * </FormField>
 * ```
 */
export interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Error message to display (takes priority over hint) */
  error?: string;
  /** Hint text displayed below the field when there's no error */
  hint?: string;
  /** Whether to show a required asterisk next to the label */
  required?: boolean;
  /** The form control (Input, Select, Textarea, etc.) */
  children: React.ReactNode;
  /** Additional className for the wrapper div */
  className?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label with optional required asterisk */}
      <Label className="text-[var(--admin-text)]">
        {label}
        {required && (
          <span className="ml-0.5 text-[var(--admin-danger)]" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      {/* Children slot — the actual input/control */}
      {children}

      {/* Error message (priority over hint) */}
      {error ? (
        <p className="text-xs text-[var(--admin-danger)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        /* Hint text (only shown when no error) */
        <p className="text-xs text-[var(--admin-text-subtle)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
