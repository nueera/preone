'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';

/**
 * ConfirmDialog — Themed confirmation dialog replacing window.confirm().
 *
 * Provides a consistent confirmation experience with:
 * - Variant-based styling (danger, warning, default)
 * - Variant-specific icons
 * - Loading state with spinner on the confirm button
 * - Themed using admin CSS custom properties
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showDelete}
 *   onOpenChange={setShowDelete}
 *   title="Delete Student"
 *   description="Are you sure you want to delete this student? This action cannot be undone."
 *   variant="danger"
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   loading={isDeleting}
 * />
 * ```
 */
export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description / body text */
  description: string;
  /** Label for the confirm button (defaults to "Confirm") */
  confirmLabel?: string;
  /** Label for the cancel button (defaults to "Cancel") */
  cancelLabel?: string;
  /** Visual variant affecting icon and button styling */
  variant?: 'danger' | 'warning' | 'default';
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Show loading spinner on the confirm button */
  loading?: boolean;
}

/** Icon mapping by variant */
const VARIANT_ICON: Record<NonNullable<ConfirmDialogProps['variant']>, React.ElementType> = {
  danger: AlertTriangle,
  warning: AlertCircle,
  default: Info,
};

/** Icon color mapping by variant */
const VARIANT_ICON_CLASS: Record<NonNullable<ConfirmDialogProps['variant']>, string> = {
  danger: 'text-[var(--admin-danger)]',
  warning: 'text-amber-500',
  default: 'text-[var(--admin-primary)]',
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const IconComponent = VARIANT_ICON[variant];
  const iconClass = VARIANT_ICON_CLASS[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {/* Variant icon */}
            <div className={cn('mt-0.5 shrink-0', iconClass)}>
              <IconComponent className="size-5" />
            </div>
            <div className="space-y-1.5">
              <AlertDialogTitle className="text-[var(--admin-text)]">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[var(--admin-text-muted)]">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            className="border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]"
          >
            {cancelLabel}
          </AlertDialogCancel>

          {/* Confirm button: destructive variant for danger, themed for others */}
          {variant === 'danger' ? (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={loading}
              className="bg-[var(--admin-danger)] text-white hover:opacity-90"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {confirmLabel}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={loading}
              className="bg-[var(--admin-primary)] text-white hover:opacity-90"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {confirmLabel}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
