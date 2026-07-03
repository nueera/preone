'use client';

// ============================================================
// PreOne — Admin Layout Client (No Sidebar)
//
// Provides the 2-region shell:
//   - Sticky topbar (48px, AdminTopbar)
//   - Scrollable content area (bg admin-bg, max-w 1440px)
//
// Preserves the auth guards from the original layout:
//   - TASK_MASTER: limited route access
//   - ADMIN: no /admin/system
//   - Onboarding redirect for incomplete schools
//   - Onboarding routes render standalone (no topbar)
//
// Framer Motion page transition wraps the content area:
//   - Enter: fade-in + 8px upward translate, 280ms ease-out
//   - Exit:  fade-out, 180ms ease-in
//   - Topbar does NOT animate — it stays persistent.
//   - prefers-reduced-motion: disable transforms, keep only opacity.
// ============================================================

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin-header';
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
 * - Sidebar + Header + Main content structure with Aurora Background
 * - Command Palette (Ctrl+K) for quick navigation
 * - Keyboard Shortcuts panel (press ?)
 * - School branding context (logo, name, colors)
 * - Undo/Redo global action system
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
      <div
        className="min-h-screen"
        data-portal="admin"
        data-role={userRole.toLowerCase()}
      >
        {children}
      </div>
    );
  }

  return (
    <AuroraBackground
      className="flex min-h-screen flex-col"
      data-portal="admin"
      data-role={userRole.toLowerCase()}
    >
      <AdminHeader />
      <main className="flex-1 bg-background/95 p-4 sm:p-6 md:p-8">
        {/*
          The AnimatePresence and motion.div for page transitions have been removed
          as they were incomplete (missing imports and definitions for variants/transition).
          This can be re-added once those are fully implemented.
        */}
        {children}
      </main>
      <CommandPalette />
      <KeyboardShortcuts />
    </AuroraBackground>
  );
}
