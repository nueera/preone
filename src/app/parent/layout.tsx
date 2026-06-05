'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { ParentSidebar } from '@/components/parent-sidebar';
import { ParentHeader } from '@/components/parent-header';
import { ParentMobileNav } from '@/components/parent-mobile-nav';
import { QueryProvider } from '@/components/providers';
import { ParentAuthProvider } from '@/lib/parent-auth';
import { AuroraBackground } from '@/components/cosmic/AuroraBackground';
import { useChatInit } from '@/hooks/use-chat';

/**
 * Parent Layout — Wraps the PreOne parent portal.
 * Provides: React Query, Parent Auth Context, Aurora Background, Sidebar + Header + Main Content.
 * Auth guard is handled by middleware (token check in cookies).
 * Client-side auth context provides parent data + child selection to all pages.
 */
export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize chat socket connection
  useChatInit();

  return (
    <QueryProvider>
      <ParentAuthProvider>
        <AuroraBackground>
          <SidebarProvider>
            <ParentSidebar />
            <div className="flex flex-1 flex-col min-h-screen">
              <ParentHeader />
              <main className="flex-1 bg-background/80 p-6 overflow-auto pb-24 md:pb-6" data-portal="parent">
                {children}
              </main>
            </div>
            <ParentMobileNav />
          </SidebarProvider>
        </AuroraBackground>
      </ParentAuthProvider>
    </QueryProvider>
  );
}
