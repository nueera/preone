'use client';

import { TeacherHeader } from '@/components/teacher-header';
import { QueryProvider } from '@/components/providers';
import { AuroraBackground } from '@/components/cosmic/AuroraBackground';
import { useChatInit } from '@/hooks/use-chat';

/**
 * Teacher Layout Client — Wraps the PreOne teacher portal.
 * Full-width single column layout (no sidebar).
 * Provides: TeacherHeader, React Query, Aurora Background.
 * Auth guard is handled by the server layout (preone_token cookie).
 */
export function TeacherLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize chat socket connection
  useChatInit();

  return (
    <QueryProvider>
      <AuroraBackground intensity="subtle">
        <div className="flex flex-col min-h-screen">
          <TeacherHeader />
          <main
            className="flex-1 p-6 overflow-auto"
            data-portal="teacher"
            style={{ background: 'var(--teacher-bg, var(--background))' }}
          >
            <div className="mx-auto max-w-[1440px] flex flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
      </AuroraBackground>
    </QueryProvider>
  );
}
