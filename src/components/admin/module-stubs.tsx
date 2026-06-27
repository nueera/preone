// ============================================================
// PreOne — Module Stub Page Generator
//
// Generates a stub page for each of the 16 modules at
// /admin/<key>/page.tsx. Each stub uses <PageHeader /> with
// the module's icon, label, subtitle, and primary action.
// Body shows a friendly "coming next" empty state.
// ============================================================

import {
  MODULES,
  type ModuleDef,
} from '@/components/admin/modules';
import { PageHeader } from '@/components/admin/page-header';
import { ModuleIcon } from '@/components/admin/module-icons';

// ── Reusable empty-state component for stub pages ──
function EmptyState({ mod }: { mod: ModuleDef }) {
  return (
    <div
      className="
        flex flex-col items-center justify-center rounded-xl
        border border-[var(--admin-border)] bg-[var(--admin-surface)]
        px-6 py-16 text-center
      "
    >
      <div className="mb-4">
        <ModuleIcon iconKey={mod.key} size={64} />
      </div>
      <h3 className="text-[16px] font-semibold text-[var(--admin-text)]">
        {mod.label} — Coming Next
      </h3>
      <p className="mt-2 max-w-[360px] text-[14px] text-[var(--admin-text-muted)]">
        We&apos;re building this module. {mod.primaryAction ? `You'll be able to ${mod.primaryAction.replace('+ ', '').toLowerCase()} here soon.` : 'Check back soon for updates.'}
      </p>
      {mod.primaryAction && (
        <button
          type="button"
          disabled
          className="
            mt-6 inline-flex h-9 items-center rounded-md px-4
            bg-[var(--admin-primary)]/50 text-[13px] font-semibold text-white
            cursor-not-allowed
          "
        >
          {mod.primaryAction}
        </button>
      )}
    </div>
  );
}

// ── Individual stub pages ──
// Each is a named export used by the corresponding route file.

export function SetupPage() {
  const mod = MODULES.find((m) => m.key === 'setup')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function AdmissionPage() {
  const mod = MODULES.find((m) => m.key === 'admission')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function StudentsPage() {
  const mod = MODULES.find((m) => m.key === 'students')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function ParentsPage() {
  const mod = MODULES.find((m) => m.key === 'parents')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function TeachersPage() {
  const mod = MODULES.find((m) => m.key === 'teachers')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function ClassesPage() {
  const mod = MODULES.find((m) => m.key === 'classes')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function OperationsPage() {
  const mod = MODULES.find((m) => m.key === 'operations')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function FeesPage() {
  const mod = MODULES.find((m) => m.key === 'fees')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function CommunicationPage() {
  const mod = MODULES.find((m) => m.key === 'communication')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function ReportsPage() {
  const mod = MODULES.find((m) => m.key === 'reports')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function AiCenterPage() {
  const mod = MODULES.find((m) => m.key === 'ai-center')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function SettingsPage() {
  const mod = MODULES.find((m) => m.key === 'settings')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function GrowthPassportPage() {
  const mod = MODULES.find((m) => m.key === 'growth-passport')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function AttendancePage() {
  const mod = MODULES.find((m) => m.key === 'attendance')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}

export function DailyMilestonesPage() {
  const mod = MODULES.find((m) => m.key === 'daily-milestones')!;
  return (
    <div>
      <PageHeader iconKey={mod.key} title={mod.label} subtitle={mod.subtitle} primaryAction={mod.primaryAction} />
      <EmptyState mod={mod} />
    </div>
  );
}
