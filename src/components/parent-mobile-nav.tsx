'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Baby, Sun, IndianRupee, MessageSquare, TrendingUp,
} from 'lucide-react';
import { useParentAuth } from '@/lib/parent-auth';

// ── Mobile bottom navigation items (5 most important) ──
const MOBILE_NAV_ITEMS = [
  { label: 'Home', icon: LayoutDashboard, href: '/parent/dashboard' },
  { label: 'Kids', icon: Baby, href: '/parent/children' },
  { label: 'Updates', icon: Sun, href: '/parent/daily-updates' },
  { label: 'Growth', icon: TrendingUp, href: '/parent/growth' },
  { label: 'Chat', icon: MessageSquare, href: '/parent/communication' },
];

/**
 * ParentMobileNav — Fixed bottom navigation for mobile devices.
 * Shows 5 most important items. Safe area padding for iOS.
 * Minimum 44px touch targets for accessibility.
 */
export function ParentMobileNav() {
  const pathname = usePathname();
  const { selectedChild } = useParentAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe md:hidden">
      <div className="flex items-center justify-around h-16">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/parent/dashboard' &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[44px] min-h-[44px] transition-colors ${
                isActive
                  ? 'text-sky-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
