'use client';

// ============================================================
// PreOne — Admin Dashboard (/admin)
//
// Pure module grid — 16 cards in a responsive 2/3/4-column grid.
// No KPIs, no charts, no "recent activity". Just the module grid.
//
// Page header: H1 "Dashboard" + subtitle + Refresh ghost button.
// ============================================================

import { RefreshCw } from 'lucide-react';
import { MODULES } from '@/components/admin/modules';
import { ModuleCard } from '@/components/admin/module-card';

export default function AdminDashboardPage() {
  return (
    <div>
      {/* ── Page header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--admin-text)]">
            Dashboard
          </h1>
          <p className="mt-1 text-[14px] text-[var(--admin-text-muted)]">
            Quick access to all your modules
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="
            inline-flex items-center gap-1.5 rounded-md px-3 py-1.5
            text-[13px] font-medium text-[var(--admin-text-muted)]
            transition-colors hover:bg-[var(--admin-surface-2)]
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--admin-primary)]
          "
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Module grid ── */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {MODULES.map((mod) => (
          <ModuleCard key={mod.key} module={mod} />
        ))}
      </div>
    </div>
  );
}
