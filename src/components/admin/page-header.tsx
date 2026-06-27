'use client';

// ============================================================
// PreOne — Page Header (shared for all module pages)
//
// Provides the consistent back-link + icon + title + subtitle
// + optional primary action button pattern that every module
// page uses.
//
// Layout:
//   ┌──────────────────────────────────────────────┐
//   │ ← Back to Dashboard                           │
//   │                                                │
//   │ [icon 40px]  Module Title     [+ Action Btn]  │
//   │              Subtitle text                     │
//   └──────────────────────────────────────────────┘
//
// Back link: always goes to /admin.
// Primary action: indigo button, hidden on < sm (moves to ⋯ menu
// on mobile — the menu is the consuming page's responsibility).
// ============================================================

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ModuleIcon } from '@/components/admin/module-icons';

interface PageHeaderProps {
  /** Module key — used to look up the icon. */
  iconKey: string;
  /** Page title (e.g. "Students"). */
  title: string;
  /** Subtitle (e.g. "Manage student records and admissions"). */
  subtitle: string;
  /** Label for the primary action button (e.g. "+ Add Student"). Empty = hidden. */
  primaryAction?: string;
  /** Click handler for the primary action. */
  onPrimaryAction?: () => void;
}

export function PageHeader({
  iconKey,
  title,
  subtitle,
  primaryAction = '',
  onPrimaryAction,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* ── Back link ── */}
      <Link
        href="/admin"
        aria-label="Back to dashboard"
        className="
          mb-4 inline-flex items-center gap-1.5
          text-[13px] font-medium text-[var(--admin-text-muted)]
          transition-colors hover:text-[var(--admin-primary)]
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-[var(--admin-primary)] focus-visible:rounded
        "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* ── Title row ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ModuleIcon iconKey={iconKey} size={40} />
          <div>
            <h1 className="text-[24px] font-bold leading-tight text-[var(--admin-text)]">
              {title}
            </h1>
            <p className="mt-0.5 text-[14px] text-[var(--admin-text-muted)]">
              {subtitle}
            </p>
          </div>
        </div>

        {/* ── Primary action (hidden < sm) ── */}
        {primaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="
              hidden h-9 items-center rounded-md px-4
              bg-[var(--admin-primary)] text-[13px] font-semibold text-white
              transition-colors hover:bg-[var(--admin-primary-hover)]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[var(--admin-primary)] focus-visible:ring-offset-2
              sm:inline-flex
            "
          >
            {primaryAction}
          </button>
        )}
      </div>
    </div>
  );
}
