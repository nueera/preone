'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/* ============================================================
   ConfirmDialog — Reusable confirmation dialog for destructive
   or important actions throughout the product.
   
   Usage:
   <ConfirmDialog
     open={showDelete}
     onOpenChange={setShowDelete}
     title="Delete Academic Year"
     description="This action cannot be undone. All terms and associated data will be permanently removed."
     confirmLabel="Delete"
     variant="danger"
     onConfirm={handleDelete}
     loading={isDeleting}
   />
   ============================================================ */

interface ConfirmDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Open state change handler */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Confirm button label (default: "Confirm") */
  confirmLabel?: string;
  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string;
  /** Visual variant of the confirm button */
  variant?: 'danger' | 'warning' | 'primary';
  /** Confirm action handler */
  onConfirm: () => void;
  /** Whether the confirm action is in progress */
  loading?: boolean;
  /** Optional icon to display in the dialog */
  icon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  primary: 'bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-white',
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  loading = false,
  icon,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            className={variantStyles[variant]}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {confirmLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
