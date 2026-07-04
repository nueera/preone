'use client';

import { TeacherHeader } from '@/components/teacher-header';
import { QueryProvider } from '@/components/providers';
import { AuroraBackground } from '@/components/cosmic/AuroraBackground';
import { useChatInit } from '@/hooks/use-chat';

/**
 * Teacher Layout Client — Wraps the PreOne teacher portal.
 * Provides: React Query, Aurora Background, Header + Main Content.
 * No sidebar — navigation is handled by the landing page module cards grid.
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
        <div className="flex flex-1 flex-col min-h-screen">
          <TeacherHeader />
          <main
            className="flex-1 p-6 overflow-auto"
            data-portal="teacher"
            style={{ background: 'var(--teacher-bg)' }}
          >
            {children}
          </main>
        </div>
      </AuroraBackground>
    </QueryProvider>
  );
}
