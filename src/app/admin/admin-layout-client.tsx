'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';
import { AuroraBackground } from '@/components/cosmic/AuroraBackground';
import { useChatInit } from '@/hooks/use-chat';

// TASK_MASTER can only access these admin routes
const TASK_MASTER_ALLOWED = ['/admin/dashboard', '/admin/crm'];

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userRole: string;
  onboardingComplete: boolean;
  schoolId: string;
}

/**
 * Admin Layout Client — Client component wrapping the PreOne admin portal.
 * Provides the sidebar + header + main content structure with Aurora Background.
 * Supports both ADMIN and TASK_MASTER roles.
 * TASK_MASTER sees same layout but sidebar only shows CRM + Dashboard.
 * data-portal="admin" for CSS theme scoping.
 * data-role attribute for role-specific styling.
 */
export function AdminLayoutClient({
  children,
  userRole,
  onboardingComplete,
  schoolId,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Initialize chat socket connection
  useChatInit();

  // Client-side route guard for TASK_MASTER
  useEffect(() => {
    if (userRole === 'TASK_MASTER') {
      const isAllowed = TASK_MASTER_ALLOWED.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
      );
      if (!isAllowed) {
        router.replace('/admin/crm');
      }
    }
  }, [userRole, pathname, router]);

  // Onboarding redirect: if admin's school hasn't completed onboarding,
  // redirect to the onboarding wizard (unless already there)
  useEffect(() => {
    if (userRole === 'ADMIN' && !onboardingComplete && !pathname.startsWith('/admin/onboarding')) {
      router.replace('/admin/onboarding');
    }
  }, [userRole, onboardingComplete, pathname, router]);

  // Onboarding routes are standalone full-page — no sidebar/header
  const isOnboarding = pathname.startsWith('/admin/onboarding');

  if (isOnboarding) {
    return (
      <div data-portal="admin" data-role={userRole.toLowerCase()}>
        {children}
      </div>
    );
  }

  return (
    <AuroraBackground intensity="subtle">
      <SidebarProvider>
        <AdminSidebar />
        <div className="flex flex-1 flex-col min-h-screen">
          <AdminHeader />
          <main
            className="flex-1 bg-background/80 p-6 overflow-auto"
            data-portal="admin"
            data-role={userRole.toLowerCase()}
          >
            {children}
          </main>
        </div>
      </SidebarProvider>
    </AuroraBackground>
  );
}
