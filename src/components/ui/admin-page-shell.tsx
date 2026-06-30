'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PageTransition, StaggerContainer } from '@/components/ui/page-transition';

/**
 * AdminPageShell — Reusable page layout wrapper for admin pages.
 *
 * Provides a consistent structure with:
 * - PageTransition + StaggerContainer animation wrappers
 * - Header row with icon + title + description (left) and action buttons (right)
 * - Content area with spacing below
 *
 * All colors use CSS custom properties for light/dark mode support.
 *
 * @example
 * ```tsx
 * <AdminPageShell
 *   title="Students"
 *   description="Manage student records"
 *   icon={<Users className="size-5" />}
 *   actions={<Button>Add Student</Button>}
 * >
 *   {content}
 * </AdminPageShell>
 * ```
 */
export interface AdminPageShellProps {
  /** Page title displayed as h1 */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Optional icon rendered in a colored circle beside the title */
  icon?: React.ReactNode;
  /** Optional action buttons rendered on the right side of the header */
  actions?: React.ReactNode;
  /** Page content rendered below the header */
  children: React.ReactNode;
  /** Additional className for the root wrapper */
  className?: string;
}

export function AdminPageShell({
  title,
  description,
  icon,
  actions,
  children,
  className,
}: AdminPageShellProps) {
  return (
    <PageTransition>
      <StaggerContainer className={cn('space-y-6', className)}>
        {/* ── Header Row ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Icon + Title + Description */}
          <div className="flex items-center gap-3">
            {/* Optional icon in a themed circle */}
            {icon && (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-primary)] text-white">
                {icon}
              </div>
            )}
            <div className="space-y-0.5">
              <h1 className="font-heading text-2xl font-semibold text-[var(--admin-text)]">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-[var(--admin-text-muted)]">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Action buttons */}
          {actions && (
            <div className="flex shrink-0 items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* ── Content Area ── */}
        <div className="space-y-6">
          {children}
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
