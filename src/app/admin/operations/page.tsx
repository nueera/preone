'use client';

import { PageHeader } from '@/components/admin/page-header';

export default function OperationsPage() {
  return (
    <div>
      <PageHeader
        iconKey="operations"
        title="Operations"
        subtitle="Day-to-day school operations"
        primaryAction="+ New Task"
      />
      {/* Operations module content will be migrated here */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
        <h3 className="text-[16px] font-semibold text-[var(--admin-text)]">
          Operations
        </h3>
        <p className="mt-2 text-[14px] text-[var(--admin-text-muted)]">
          Day-to-day school operations management. Use the sub-navigation to access activities, attendance, calendar, and transport.
        </p>
      </div>
    </div>
  );
}
