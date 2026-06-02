'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { ParentSidebar } from '@/components/parent-sidebar';
import { ParentHeader } from '@/components/parent-header';
import { ParentMobileNav } from '@/components/parent-mobile-nav';
import { QueryProvider } from '@/components/providers';
import { ParentAuthProvider } from '@/lib/parent-auth';

/**
 * Parent Layout — Wraps the PreOne parent portal.
 * Provides: React Query, Parent Auth Context, Sidebar + Header + Main Content.
 * Auth guard is handled by middleware (token check in cookies).
 * Client-side auth context provides parent data + child selection to all pages.
 */
export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <ParentAuthProvider>
        <SidebarProvider>
          <ParentSidebar />
          <div className="flex flex-1 flex-col min-h-screen">
            <ParentHeader />
            <main className="flex-1 bg-gray-50 p-6 overflow-auto dark:bg-gray-950 pb-24 md:pb-6">
              {children}
            </main>
          </div>
          <ParentMobileNav />
        </SidebarProvider>
      </ParentAuthProvider>
    </QueryProvider>
  );
}
