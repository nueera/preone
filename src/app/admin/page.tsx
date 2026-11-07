'use client';

// ============================================================
// PreOne — Admin Module Grid (/admin)
//
// Landing page after login — 16 module cards in a responsive
// 2/3/4-column grid. Clicking "Dashboard" card navigates to
// /admin/dashboard (the KPI + charts page).
//
// This is NOT the dashboard — it's the module launcher.
// The real dashboard lives at /admin/dashboard/page.tsx.
// ============================================================

import { RefreshCw } from 'lucide-react';
import { MODULES } from '@/components/admin/modules';
import { ModuleCard } from '@/components/admin/module-card';

export default function AdminModuleGridPage() {
  return (
    <div>
      {/* ── Page header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--admin-text)]">
            Modules
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
