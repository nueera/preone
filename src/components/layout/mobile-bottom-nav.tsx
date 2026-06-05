'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  BookOpen,
  MessageCircle,
  TrendingUp,
  Settings,
  Users,
  UserCheck,
  BarChart3,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──

type NavRole = 'parent' | 'teacher' | 'admin';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface MobileBottomNavProps {
  /** Active portal role — determines which navigation items to show */
  role: NavRole;
  /** Additional CSS classes for the nav container */
  className?: string;
}

// ── Navigation items per role ──

const NAV_ITEMS: Record<NavRole, NavItem[]> = {
  parent: [
    { label: 'Home', icon: Home, href: '/parent/dashboard' },
    { label: 'Daily', icon: BookOpen, href: '/parent/daily-updates' },
    { label: 'Chat', icon: MessageCircle, href: '/parent/chat' },
    { label: 'Growth', icon: TrendingUp, href: '/parent/growth' },
    { label: 'Settings', icon: Settings, href: '/parent/settings' },
  ],
  teacher: [
    { label: 'Home', icon: Home, href: '/teacher/dashboard' },
    { label: 'Class', icon: Users, href: '/teacher/my-class' },
    { label: 'Attendance', icon: UserCheck, href: '/teacher/attendance' },
    { label: 'Chat', icon: MessageCircle, href: '/teacher/chat' },
    { label: 'More', icon: Calendar, href: '/teacher/settings' },
  ],
  admin: [
    { label: 'Home', icon: Home, href: '/admin/dashboard' },
    { label: 'Students', icon: Users, href: '/admin/students' },
    { label: 'Chat', icon: MessageCircle, href: '/admin/chat' },
    { label: 'Reports', icon: BarChart3, href: '/admin/reports' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
  ],
};

// ── Spring animation config for the active indicator ──

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
};

/**
 * MobileBottomNav — Fixed bottom tab bar with orbit-style icons.
 *
 * Renders role-specific navigation items with an animated active indicator
 * using Framer Motion's layoutId. Supports light/dark mode via CSS variables.
 *
 * Features:
 * - Frosted glass background (backdrop-blur-xl)
 * - Spring-animated active glow indicator
 * - Safe area padding for notched devices (iOS)
 * - Minimum 44px touch targets for accessibility
 * - Dark mode support via cosmic CSS variables
 */
export function MobileBottomNav({ role, className }: MobileBottomNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'h-16',
        'bg-white/90 dark:bg-[#0a0a1a]/90',
        'backdrop-blur-xl',
        'border-t border-cosmic-border-default',
        'safe-bottom',
        className
      )}
      role="navigation"
      aria-label={`${role} mobile navigation`}
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${role}/dashboard` &&
              pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'flex-1 h-full min-w-[44px] min-h-[44px]',
                'rounded-xl transition-colors duration-200',
                isActive
                  ? 'text-preone-primary'
                  : 'text-cosmic-text-tertiary hover:text-cosmic-text-secondary'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator glow — uses layoutId for smooth transitions */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-glow"
                  className={cn(
                    'absolute inset-1 rounded-xl',
                    'bg-preone-primary-50/10',
                    'dark:bg-preone-primary-50/10'
                  )}
                  transition={SPRING_TRANSITION}
                />
              )}

              {/* Icon */}
              <span className="relative z-10 flex items-center justify-center">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
              </span>

              {/* Label */}
              <span
                className={cn(
                  'relative z-10 text-[10px] mt-0.5 leading-tight',
                  isActive ? 'font-semibold' : 'font-medium'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
