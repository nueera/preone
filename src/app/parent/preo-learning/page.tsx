'use client';

// ============================================================
// PreOne — PreO Learning Page (Coming Soon)
// Interactive learning modules for children
// ============================================================

import { BookOpen, Sparkles } from 'lucide-react';
import { PreOneCard } from '@/components/ui/preone-card';

export default function PreoLearningPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--parent-primary-soft)' }}
        >
          <BookOpen className="h-6 w-6" style={{ color: 'var(--parent-primary)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--parent-text)' }}>
            PreO Learning
          </h1>
          <p className="text-sm" style={{ color: 'var(--parent-text-muted)' }}>
            Interactive learning modules for your child
          </p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <PreOneCard
        className="flex items-center gap-4 p-5"
        style={{
          backgroundColor: 'var(--parent-warning-soft)',
          borderColor: 'var(--parent-warning)',
        }}
      >
        <Sparkles className="h-6 w-6 shrink-0" style={{ color: 'var(--parent-warning)' }} />
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--parent-warning)' }}>
            This feature is coming soon!
          </h2>
          <p className="text-xs" style={{ color: 'var(--parent-text-muted)' }}>
            We&apos;re working hard to bring you PreO Learning. Stay tuned for updates.
          </p>
        </div>
      </PreOneCard>

      {/* Placeholder Content */}
      <PreOneCard className="flex flex-col items-center justify-center py-16">
        <BookOpen
          className="h-12 w-12 mb-4"
          style={{ color: 'var(--parent-text-subtle)' }}
        />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--parent-text-muted)' }}>
          Coming Soon
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--parent-text-subtle)' }}>
          Interactive learning modules, ABC activities, and story books are under development.
        </p>
      </PreOneCard>
    </div>
  );
}
