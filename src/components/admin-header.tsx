'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
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
import { PORTAL_THEMES, ROLE_THEMES, PREONE_COLORS } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.admin;

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
  admin: 'Admin',
  dashboard: 'Dashboard',
  students: 'Students',
  teachers: 'Teachers',
  attendance: 'Attendance',
  fees: 'Fees',
  crm: 'CRM',
  leads: 'Leads',
  followups: 'Follow-ups',
  tasks: 'Tasks',
  activities: 'Activities',
  growth: 'Growth',
  communication: 'Communication',
  transport: 'Transport',
  settings: 'Settings',
};

/**
 * AdminHeader — Top header bar for the PreOne admin portal.
 * Shows sidebar trigger, breadcrumb, search, notifications, and user menu.
 */
export function AdminHeader() {
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

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'A';
  const isTaskMaster = user?.role === 'TASK_MASTER';
  const roleTheme = isTaskMaster ? ROLE_THEMES.taskmaster : ROLE_THEMES.admin;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white shadow-sm px-4 dark:bg-gray-900 dark:border-gray-800">
      {/* ── TASK_MASTER badge ── */}
      {isTaskMaster && (
        <span
          className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
          style={{
            backgroundColor: PREONE_COLORS.star[50],
            color: PREONE_COLORS.star[700],
            borderColor: PREONE_COLORS.star[200],
          }}
        >
          <Zap className="h-3 w-3" />
          Task Master
        </span>
      )}
      {/* ── Left: Sidebar trigger + Breadcrumb ── */}
      <SidebarTrigger className="shrink-0" />

      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((seg, idx) => {
            const isLast = idx === segments.length - 1;
            const label = PATH_LABELS[seg] || seg;
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

      {/* ── Right: Search, Notifications, User Menu ── */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search Button */}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
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
                <AvatarFallback className={`${theme.avatarFallbackClass} text-xs font-semibold`}>
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">
                {user?.name || 'Admin'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {user?.email || 'admin@preone.com'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
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
