'use client';

import { QueryProvider } from '@/components/providers';
import { ParentAuthProvider } from '@/lib/parent-auth';
import { AuroraBackground } from '@/components/cosmic/AuroraBackground';
import { useChatInit } from '@/hooks/use-chat';

/**
 * Parent Layout Client — Wraps the PreOne parent portal.
 * Full-width single column layout (no sidebar).
 * Provides: React Query, Parent auth context, Aurora Background.
 * Auth guard is handled by the server layout (preone_token cookie).
 */
export function ParentLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize chat socket connection
  useChatInit();

  return (
    <QueryProvider>
      <ParentAuthProvider>
        <AuroraBackground intensity="subtle">
          <main
            className="flex-1 min-h-screen p-6 overflow-auto"
            data-portal="parent"
            style={{ background: 'var(--parent-bg)' }}
          >
            <div className="mx-auto max-w-[1440px] flex flex-col gap-6">
              {children}
            </div>
          </main>
        </AuroraBackground>
      </ParentAuthProvider>
    </QueryProvider>
  );
}
