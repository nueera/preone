'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin-header';
import { QueryProvider } from '@/components/providers';
import { AuroraBackground } from '@/components/cosmic/AuroraBackground';
import { CommandPalette } from '@/components/ui/command-palette';
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts';
import { useChatInit } from '@/hooks/use-chat';

// TASK_MASTER can only access these admin routes (with sub-paths)
const TASK_MASTER_ALLOWED = [
  '/admin/dashboard',
  '/admin/admissions',
  '/admin/admission',
  '/admin/communication/chat',
  '/admin/communication/announcements',
];

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userRole: string;
  onboardingComplete: boolean;
  schoolId: string;
}

/**
 * Admin Layout Client — Client component wrapping the PreOne admin portal.
 *
 * Provides:
 * - QueryProvider (React Query) for data fetching
 * - Header + Main content structure with Aurora Background
 * - Command Palette (Ctrl+K) for quick navigation
 * - Keyboard Shortcuts panel (press ?)
 * - Role-based route guards
 *
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
        router.replace('/admin/admission');
      }
    }
  }, [userRole, pathname, router]);

  // SUPER_ADMIN / ADMIN system route guard
  useEffect(() => {
    if (userRole === 'ADMIN' && pathname.startsWith('/admin/system')) {
      router.replace('/admin');
    }
  }, [userRole, pathname, router]);

  // Onboarding redirect
  useEffect(() => {
    if (
      (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') &&
      !onboardingComplete &&
      !pathname.startsWith('/admin/onboarding') &&
      !pathname.startsWith('/admin/setup')
    ) {
      router.replace('/admin/setup');
    }
  }, [userRole, onboardingComplete, pathname, router]);

  // Onboarding routes are standalone full-page — no topbar
  const isOnboarding = pathname.startsWith('/admin/onboarding');

  if (isOnboarding) {
    return (
      <QueryProvider>
        <div data-portal="admin" data-role={userRole.toLowerCase()}>
          {children}
        </div>
      </QueryProvider>
    );
  }

  return (
    <QueryProvider>
      <AuroraBackground intensity="subtle">
        <div className="flex flex-col min-h-screen">
          <AdminHeader />
          <main
            className="flex-1 bg-background/80 p-6 overflow-auto"
            data-portal="admin"
            data-role={userRole.toLowerCase()}
          >
            {children}
          </main>
        </div>

        {/* Global overlays */}
        <CommandPalette />
        <KeyboardShortcuts />
      </AuroraBackground>
    </QueryProvider>
  );
}
