'use client';

import React, { useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── Types ──

interface ResponsiveLayoutProps {
  /** Sidebar content — rendered in the left panel */
  sidebar: React.ReactNode;
  /** Header content — rendered in the sticky top bar */
  header: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Bottom navigation for mobile (e.g. MobileBottomNav) */
  bottomNav?: React.ReactNode;
  /** Whether the sidebar is currently open */
  isSidebarOpen: boolean;
  /** Callback to toggle sidebar open state */
  onSidebarToggle: (open: boolean) => void;
  /** Additional CSS classes for the main content area */
  className?: string;
}

// ── Breakpoint constants ──

const MOBILE_MAX = 767;
const TABLET_MIN = 768;
const TABLET_MAX = 1023;
const DESKTOP_MIN = 1024;

const SIDEBAR_WIDTH_DESKTOP = 260;
const SIDEBAR_WIDTH_TABLET = 240;

// ── Sidebar animation variants ──

const sidebarVariants = {
  hidden: { x: -280, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    x: -280,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/**
 * ResponsiveLayout — Main layout wrapper that handles all screen sizes.
 *
 * Breakpoints:
 * - Mobile: < 768px — sidebar as slide-in overlay, bottom nav visible
 * - Tablet: 768–1023px — narrower sidebar (240px), collapsible
 * - Desktop: 1024+ — persistent sidebar (260px)
 *
 * Features:
 * - Fixed header at top (h-16, sticky, z-30)
 * - Mobile sidebar: AnimatePresence slide-in with backdrop overlay
 * - Tablet sidebar: narrower (240px), collapsible
 * - Desktop sidebar: 260px, persistent
 * - Main content auto-adjusts padding-left based on sidebar state
 * - Bottom nav: fixed at bottom when isMobile and bottomNav is provided
 * - Respects safe area insets for notched devices
 */
export function ResponsiveLayout({
  sidebar,
  header,
  children,
  bottomNav,
  isSidebarOpen,
  onSidebarToggle,
  className,
}: ResponsiveLayoutProps) {
  // ── Screen size detection using useSyncExternalStore ──
  const getSnapshot = useCallback(() => {
    const width = window.innerWidth;
    return width;
  }, []);

  const getServerSnapshot = useCallback(() => {
    return DESKTOP_MIN; // Default to desktop on server
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  }, []);

  const windowWidth = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isMobile = windowWidth <= MOBILE_MAX;
  const isTablet = windowWidth >= TABLET_MIN && windowWidth <= TABLET_MAX;
  const isDesktop = windowWidth >= DESKTOP_MIN;

  // ── Determine sidebar visibility & width ──
  const showSidebarOverlay = isMobile && isSidebarOpen;
  const showSidebarPersistent = (isTablet || isDesktop) && isSidebarOpen;
  const sidebarWidth = isTablet ? SIDEBAR_WIDTH_TABLET : SIDEBAR_WIDTH_DESKTOP;

  // ── Content left padding ──
  const contentPaddingLeft =
    showSidebarPersistent && isDesktop
      ? SIDEBAR_WIDTH_DESKTOP
      : showSidebarPersistent && isTablet
        ? SIDEBAR_WIDTH_TABLET
        : 0;

  // ── Close sidebar on overlay click (mobile) ──
  const handleOverlayClick = useCallback(() => {
    onSidebarToggle(false);
  }, [onSidebarToggle]);

  return (
    <div className="min-h-screen bg-cosmic-bg-primary">
      {/* ── Fixed Header ── */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-30',
          'h-16',
          'bg-white/90 dark:bg-[#0a0a1a]/90',
          'backdrop-blur-xl',
          'border-b border-cosmic-border-default'
        )}
      >
        {header}
      </header>

      {/* ── Mobile Sidebar (slide-in overlay) ── */}
      <AnimatePresence>
        {showSidebarOverlay && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              key="sidebar-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={handleOverlayClick}
              aria-hidden="true"
            />

            {/* Sidebar panel */}
            <motion.aside
              key="sidebar-mobile"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'fixed top-0 left-0 bottom-0 z-50',
                'w-[280px]',
                'preone-sidebar',
                'safe-top'
              )}
            >
              <div className="h-full overflow-y-auto custom-scrollbar">
                {sidebar}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Tablet/Desktop Sidebar (persistent) ── */}
      {showSidebarPersistent && (
        <aside
          className={cn(
            'fixed top-16 left-0 bottom-0 z-20',
            'preone-sidebar',
            'sidebar-transition',
            'safe-top'
          )}
          style={{ width: sidebarWidth }}
        >
          <div className="h-full overflow-y-auto custom-scrollbar">
            {sidebar}
          </div>
        </aside>
      )}

      {/* ── Main Content Area ── */}
      <main
        className={cn(
          'pt-16', // below header
          'transition-[padding-left] duration-300 ease-in-out',
          'min-h-screen'
        )}
        style={{ paddingLeft: contentPaddingLeft }}
      >
        <div
          className={cn(
            'p-4 md:p-6 lg:p-8',
            'max-w-[1600px] mx-auto',
            // Add bottom padding for mobile bottom nav
            isMobile && bottomNav ? 'pb-20' : '',
            className
          )}
        >
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      {isMobile && bottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {bottomNav}
        </div>
      )}
    </div>
  );
}

export default ResponsiveLayout;
