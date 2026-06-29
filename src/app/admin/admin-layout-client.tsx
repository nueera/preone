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
import { motion, AnimatePresence } from 'framer-motion';
import { AdminTopbar } from '@/components/layout/admin-topbar';
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

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 0 },
};

const pageTransition = {
  initial: { duration: 0.28, ease: 'easeOut' },
  enter: { duration: 0.28, ease: 'easeOut' },
  exit: { duration: 0.18, ease: 'easeIn' },
};

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
        style={{
          '--admin-bg': '#F8F9FA',
          '--admin-surface': '#FFFFFF',
          '--admin-surface-2': '#F9FAFB',
          '--admin-border': '#E5E7EB',
          '--admin-border-strong': '#D1D5DB',
          '--admin-text': '#1F2937',
          '--admin-text-muted': '#6B7280',
          '--admin-text-subtle': '#9CA3AF',
          '--admin-primary': '#6366F1',
          '--admin-primary-hover': '#4F46E5',
          '--admin-primary-foreground': '#FFFFFF',
          '--admin-primary-soft': '#EEF2FF',
          '--admin-accent': '#F59E0B',
          '--admin-success': '#10B981',
          '--admin-warning': '#F59E0B',
          '--admin-error': '#EF4444',
          '--admin-info': '#3B82F6',
          '--admin-error-soft': '#FEE2E2',
          '--admin-success-soft': '#D1FAE5',
          '--admin-warning-soft': '#FEF3C7',
          '--admin-info-soft': '#DBEAFE',
          '--admin-shadow-card': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          '--admin-shadow-card-hover': '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
        } as React.CSSProperties}
      >
        <style>{`
          .dark {
            --admin-bg: #0B0F1A;
            --admin-surface: #131826;
            --admin-surface-2: #1A2030;
            --admin-border: #232B3D;
            --admin-border-strong: #2E3A50;
            --admin-text: #F5F7FA;
            --admin-text-muted: #9CA3B4;
            --admin-text-subtle: #6B7280;
            --admin-primary: #818CF8;
            --admin-primary-hover: #6366F1;
            --admin-primary-foreground: #FFFFFF;
            --admin-primary-soft: rgba(129, 140, 248, 0.15);
            --admin-accent: #FBBF24;
            --admin-success: #34D399;
            --admin-warning: #FBBF24;
            --admin-error: #F87171;
            --admin-info: #60A5FA;
            --admin-error-soft: rgba(248, 113, 113, 0.15);
            --admin-success-soft: rgba(52, 211, 153, 0.15);
            --admin-warning-soft: rgba(251, 191, 36, 0.15);
            --admin-info-soft: rgba(96, 165, 250, 0.15);
            --admin-shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
            --admin-shadow-card-hover: 0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.3);
          }
        `}</style>
        {children}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      data-portal="admin"
      data-role={userRole.toLowerCase()}
      style={{
        // ── Admin design tokens (light mode defaults) ──
        '--admin-bg': '#F8F9FA',
        '--admin-surface': '#FFFFFF',
        '--admin-surface-2': '#F9FAFB',
        '--admin-border': '#E5E7EB',
        '--admin-border-strong': '#D1D5DB',
        '--admin-text': '#1F2937',
        '--admin-text-muted': '#6B7280',
        '--admin-text-subtle': '#9CA3AF',
        '--admin-primary': '#6366F1',
        '--admin-primary-hover': '#4F46E5',
        '--admin-primary-foreground': '#FFFFFF',
        '--admin-primary-soft': '#EEF2FF',
        '--admin-accent': '#F59E0B',
        '--admin-success': '#10B981',
        '--admin-warning': '#F59E0B',
        '--admin-error': '#EF4444',
        '--admin-info': '#3B82F6',
        '--admin-error-soft': '#FEE2E2',
        '--admin-success-soft': '#D1FAE5',
        '--admin-warning-soft': '#FEF3C7',
        '--admin-info-soft': '#DBEAFE',
        '--admin-shadow-card': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        '--admin-shadow-card-hover': '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
      } as React.CSSProperties}
    >
      {/* ── Dark mode token overrides ── */}
      <style>{`
        .dark {
          --admin-bg: #0B0F1A;
          --admin-surface: #131826;
          --admin-surface-2: #1A2030;
          --admin-border: #232B3D;
          --admin-border-strong: #2E3A50;
          --admin-text: #F5F7FA;
          --admin-text-muted: #9CA3B4;
          --admin-text-subtle: #6B7280;
          --admin-primary: #818CF8;
          --admin-primary-hover: #6366F1;
          --admin-primary-foreground: #FFFFFF;
          --admin-primary-soft: rgba(129, 140, 248, 0.15);
          --admin-accent: #FBBF24;
          --admin-success: #34D399;
          --admin-warning: #FBBF24;
          --admin-error: #F87171;
          --admin-info: #60A5FA;
          --admin-error-soft: rgba(248, 113, 113, 0.15);
          --admin-success-soft: rgba(52, 211, 153, 0.15);
          --admin-warning-soft: rgba(251, 191, 36, 0.15);
          --admin-info-soft: rgba(96, 165, 250, 0.15);
          --admin-shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
          --admin-shadow-card-hover: 0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.3);
        }
      `}</style>

      {/* ── Persistent topbar ── */}
      <AdminTopbar />

      {/* ── Scrollable content area ── */}
      <main
        className="flex-1 overflow-y-auto bg-[var(--admin-bg)] p-6 md:p-8"
      >
        <div className="mx-auto max-w-[1440px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              transition={pageTransition}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
