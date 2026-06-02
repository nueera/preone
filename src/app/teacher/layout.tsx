'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { TeacherSidebar } from '@/components/teacher-sidebar';
import { TeacherHeader } from '@/components/teacher-header';
import { QueryProvider } from '@/components/providers';
import { TeacherAuthProvider } from '@/lib/teacher-auth';

/**
 * Teacher Layout — Wraps the PreOne teacher portal.
 * Provides: React Query, Teacher Auth Context, Sidebar + Header + Main Content.
 * Auth guard is handled by middleware (token check in cookies).
 * Client-side auth context provides teacher data to all child pages.
 */
export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <TeacherAuthProvider>
        <SidebarProvider>
          <TeacherSidebar />
          <div className="flex flex-1 flex-col min-h-screen">
            <TeacherHeader />
            <main className="flex-1 bg-background p-6 overflow-auto" data-portal="teacher">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </TeacherAuthProvider>
    </QueryProvider>
  );
}
