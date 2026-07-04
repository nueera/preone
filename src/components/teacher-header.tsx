'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Settings,
  LogOut,
  Zap,
  Heart,
  ChevronDown,
} from 'lucide-react';
import { NotificationBell } from '@/components/ui/notification-bell';
import { GlobalThemeToggle } from '@/components/ui/global-theme-toggle';
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
import { PORTAL_THEMES } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.teacher;

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
  teacher: 'Home',
  dashboard: 'Dashboard',
  'my-class': 'My Class',
  attendance: 'Attendance',
  'daily-updates': 'Daily Updates',
  observations: 'Observations',
  activities: 'Activities',
  growth: 'Growth',
  schedule: 'Schedule',
  communication: 'Communication',
  chat: 'Chat',
  announcements: 'Announcements',
  reports: 'Reports',
  notifications: 'Notifications',
  settings: 'Settings',
  assistant: 'PreOne Assistant',
};

/**
 * TeacherHeader — Top header bar for the PreOne teacher portal.
 * No sidebar trigger (sidebar removed — module cards grid is the primary navigation).
 * Shows: PreOne branding, breadcrumb, quick actions, notifications, and user menu.
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

  // Check if we're on the landing page (/teacher with no further segments)
  const isLandingPage = segments.length === 1 && segments[0] === 'teacher';

  const handleLogout = () => {
    localStorage.removeItem('preone_token');
    localStorage.removeItem('preone_user');
    router.push('/login');
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'T';
  const displayName = user?.name || 'Teacher';

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4"
      style={{
        background: 'var(--teacher-surface)',
        borderColor: 'var(--teacher-border)',
      }}
    >
      {/* ── Left: PreOne Branding (replaces sidebar trigger) ── */}
      <Link href="/teacher" className="flex items-center gap-2 shrink-0">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--teacher-primary-soft)' }}
        >
          <Heart
            className="h-4 w-4"
            style={{ color: 'var(--teacher-primary)' }}
          />
        </div>
        <span
          className="text-sm font-bold hidden sm:inline"
          style={{ color: 'var(--teacher-primary)' }}
        >
          PreOne
        </span>
      </Link>

      {/* ── Breadcrumb ── */}
      {!isLandingPage && (
        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((seg, idx) => {
              const isLast = idx === segments.length - 1;
              const label = PATH_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
              return (
                <React.Fragment key={`${seg}-${idx}`}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage
                        className="font-medium"
                        style={{ color: 'var(--teacher-text)' }}
                      >
                        {label}
                      </BreadcrumbPage>
                    ) : (
                      <Link
                        href={`/${segments.slice(0, idx + 1).join('/')}`}
                        className="text-sm"
                        style={{ color: 'var(--teacher-text-muted)' }}
                      >
                        {label}
                      </Link>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* ── Right: Quick Action, Theme Toggle, Notifications, User Menu ── */}
      <div className="ml-auto flex items-center gap-2">
        {/* Quick Mark Attendance Button */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-1.5 text-xs rounded-xl"
          style={{
            borderColor: 'var(--teacher-primary)',
            color: 'var(--teacher-primary)',
          }}
          onClick={() => router.push('/teacher/attendance')}
        >
          <Zap className="h-3.5 w-3.5" />
          Mark Attendance
        </Button>

        {/* ── Global Theme Toggle ── */}
        <GlobalThemeToggle variant="pill" />

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback
                  className="text-xs font-semibold"
                  style={{
                    background: 'var(--teacher-primary-soft)',
                    color: 'var(--teacher-primary)',
                  }}
                >
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <span
                className="hidden sm:inline text-sm font-medium"
                style={{ color: 'var(--teacher-text)' }}
              >
                {displayName}
              </span>
              <ChevronDown
                className="h-3 w-3 hidden sm:block"
                style={{ color: 'var(--teacher-text-subtle)' }}
              />
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
