'use client';

// ============================================================
// PreOne — Teacher Assistant Page (Coming Soon)
// AI-powered assistant for teachers
// ============================================================

import { Bot, Sparkles } from 'lucide-react';
import { PreOneCard } from '@/components/ui/preone-card';

export default function TeacherAssistantPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--teacher-primary-soft)' }}
        >
          <Bot className="h-6 w-6" style={{ color: 'var(--teacher-primary)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--teacher-primary)' }}>
            PreOne Assistant
          </h1>
          <p className="text-sm" style={{ color: 'var(--teacher-text-muted)' }}>
            AI-powered help for your teaching workflow
          </p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <PreOneCard
        className="flex items-center gap-4 p-5"
        style={{
          backgroundColor: 'var(--teacher-warning-soft)',
          borderColor: 'var(--teacher-warning)',
        }}
      >
        <Sparkles className="h-6 w-6 shrink-0" style={{ color: 'var(--teacher-warning)' }} />
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--teacher-warning)' }}>
            This feature is coming soon!
          </h2>
          <p className="text-xs" style={{ color: 'var(--teacher-text-muted)' }}>
            We&apos;re working hard to bring you the PreOne Assistant. Stay tuned for updates.
          </p>
        </div>
      </PreOneCard>

      {/* Placeholder Content */}
      <PreOneCard className="flex flex-col items-center justify-center py-16">
        <Bot
          className="h-12 w-12 mb-4"
          style={{ color: 'var(--teacher-text-subtle)' }}
        />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--teacher-text-muted)' }}>
          Coming Soon
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--teacher-text-subtle)' }}>
          The PreOne Assistant is under development and will provide AI-powered insights for your classroom.
        </p>
      </PreOneCard>
    </div>
  );
}
