'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { TeacherSidebar } from '@/components/teacher-sidebar';
import { TeacherHeader } from '@/components/teacher-header';

/**
 * Teacher Layout — Wraps the PreOne teacher portal.
 * Provides the sidebar + header + main content structure.
 * Auth guard is handled by middleware.
 */
export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <TeacherSidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <TeacherHeader />
        <main className="flex-1 bg-gray-50 p-6 overflow-auto dark:bg-gray-950">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
