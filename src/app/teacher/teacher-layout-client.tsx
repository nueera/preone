'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { TeacherSidebar } from '@/components/teacher-sidebar';
import { TeacherHeader } from '@/components/teacher-header';
import { QueryProvider } from '@/components/providers';
import { AuroraBackground } from '@/components/cosmic/AuroraBackground';
import { useChatInit } from '@/hooks/use-chat';

/**
 * Teacher Layout Client — Wraps the PreOne teacher portal.
 * Provides: React Query, Aurora Background, Sidebar + Header + Main Content.
 * Auth guard is handled by the server layout with getServerSession.
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
        <SidebarProvider>
          <TeacherSidebar />
          <div className="flex flex-1 flex-col min-h-screen">
            <TeacherHeader />
            <main className="flex-1 bg-background/80 p-6 overflow-auto" data-portal="teacher">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </AuroraBackground>
    </QueryProvider>
  );
}
