'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

/* ============================================================
   AdminPageShell — Unified page layout for all admin module pages
   
   Provides the standard structure every admin page needs:
   - Page header with title, description, breadcrumb, and action buttons
   - Stats row for KPI cards
   - Content sections with consistent spacing
   - Page transition animations
   
   Usage:
   <AdminPageShell
     title="Academic Year"
     description="Configure terms and academic years"
     icon={<Calendar />}
     actions={<Button>Add Term</Button>}
   >
     <AdminPageShell.Stats>...</AdminPageShell.Stats>
     <AdminPageShell.Section title="Current Year">...</AdminPageShell.Section>
   </AdminPageShell>
   ============================================================ */

interface AdminPageShellProps {
  /** Page title */
  title: string;
  /** Page description / subtitle */
  description?: string;
  /** Icon for the page header */
  icon?: React.ReactNode;
  /** Right-side action buttons */
  actions?: React.ReactNode;
  /** Breadcrumb items (optional, auto-generated if not provided) */
  breadcrumbs?: Array<{ label: string; href?: string }>;
  /** Whether to animate the page entrance */
  animate?: boolean;
  /** Additional class name for the container */
  className?: string;
  children: React.ReactNode;
}

function AdminPageShellComponent({
  title,
  description,
  icon,
  actions,
  animate = true,
  className,
  children,
}: AdminPageShellProps) {
  const content = (
    <div className={cn('space-y-6', className)}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: 'var(--admin-primary-soft)', color: 'var(--admin-primary)' }}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl font-bold truncate"
              style={{ color: 'var(--admin-text)' }}
            >
              {title}
            </h1>
            {description && (
              <p
                className="text-sm mt-0.5 truncate"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>

      {/* ── Content ── */}
      {children}
    </div>
  );

  if (animate) {
    return (
      <PageTransition>
        <StaggerContainer>
          <StaggerItem>{content}</StaggerItem>
        </StaggerContainer>
      </PageTransition>
    );
  }

  return content;
}

/* ── Stats Row ── */
interface StatsRowProps {
  children: React.ReactNode;
  className?: string;
}

function StatsRow({ children, className }: StatsRowProps) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {children}
    </div>
  );
}

/* ── Content Section ── */
interface SectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Section({ title, description, actions, children, className }: SectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2">
          <div>
            {title && (
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--admin-text)' }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className="text-sm mt-0.5"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {description}
              </p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Compose with sub-components ── */
export const AdminPageShell = Object.assign(AdminPageShellComponent, {
  Stats: StatsRow,
  Section,
});
