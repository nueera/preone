'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell, User, Settings, LogOut, ChevronDown,
} from 'lucide-react';
import {
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParentAuth } from '@/lib/parent-auth';

// ── Auth user shape (from localStorage) ──
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// ── Map path segments to readable labels ──
const PATH_LABELS: Record<string, string> = {
  parent: 'Parent',
  dashboard: 'Dashboard',
  children: 'My Children',
  attendance: 'Attendance',
  fees: 'Fees',
  'daily-updates': 'Daily Updates',
  observations: 'Observations',
  growth: 'Growth',
  communication: 'Communication',
  settings: 'Settings',
};

/**
 * ParentHeader — Top header bar for the PreOne parent portal.
 * Shows sidebar trigger, breadcrumb, child name badge, notifications, and user menu.
 */
export function ParentHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { parent, selectedChild, children, selectChild } = useParentAuth();
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('preone_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Build breadcrumb segments from pathname
  const segments = pathname.split('/').filter(Boolean);

  const handleLogout = () => {
    localStorage.removeItem('preone_token');
    localStorage.removeItem('preone_user');
    localStorage.removeItem('preone_selected_child');
    router.push('/login');
  };

  const userName = parent
    ? `${parent.firstName} ${parent.lastName}`
    : user?.name || 'Parent';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white shadow-sm px-4 dark:bg-gray-900 dark:border-gray-800">
      {/* ── Left: Sidebar trigger + Breadcrumb ── */}
      <SidebarTrigger className="shrink-0" />

      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((seg, idx) => {
            const isLast = idx === segments.length - 1;
            const label = PATH_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
            return (
              <React.Fragment key={`${seg}-${idx}`}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-medium">
                      {label}
                    </BreadcrumbPage>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {label}
                    </span>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Right: Child badge, Notifications, User Menu ── */}
      <div className="ml-auto flex items-center gap-2">
        {/* Selected Child Badge */}
        {selectedChild && (
          <Badge
            variant="outline"
            className="hidden sm:flex items-center gap-1.5 text-xs border-sky-200 text-sky-700 bg-sky-50 rounded-xl px-2.5 py-1 cursor-pointer hover:bg-sky-100"
            onClick={() => {
              if (children.length > 1) {
                // Could open child switcher dialog
              }
            }}
          >
            <span className="font-medium">
              {selectedChild.firstName} {selectedChild.lastName}
            </span>
            <span className="text-sky-500">|</span>
            <span>{selectedChild.className || 'No class'}</span>
          </Badge>
        )}

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-sky-100 text-sky-700 text-xs font-semibold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">
                {userName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {user?.email || 'parent@preone.com'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/parent/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/parent/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
