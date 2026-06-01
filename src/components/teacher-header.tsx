'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  User,
  Settings,
  LogOut,
  Zap,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

// ── Auth user shape (from localStorage) ──
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  branchId?: string | null;
  schoolId?: string | null;
}

// ── Map path segments to readable labels ──
const PATH_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  dashboard: 'Dashboard',
  'my-class': 'My Class',
  attendance: 'Attendance',
  'daily-updates': 'Daily Updates',
  observations: 'Observations',
  activities: 'Activities',
  growth: 'Growth',
  schedule: 'Schedule',
  communication: 'Communication',
  settings: 'Settings',
};

/**
 * TeacherHeader — Top header bar for the PreOne teacher portal.
 * Shows sidebar trigger, breadcrumb, quick actions, notifications, and user menu.
 */
export function TeacherHeader() {
  const pathname = usePathname();
  const router = useRouter();
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
    router.push('/login');
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'T';

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

      {/* ── Right: Quick Action, Notifications, User Menu ── */}
      <div className="ml-auto flex items-center gap-2">
        {/* Quick Mark Attendance Button */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-1.5 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl"
          onClick={() => router.push('/teacher/attendance')}
        >
          <Zap className="h-3.5 w-3.5" />
          Mark Attendance
        </Button>

        {/* Notification Bell with badge */}
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
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">
                {user?.name || 'Teacher'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {user?.email || 'teacher@preone.com'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/teacher/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/teacher/settings')}>
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
