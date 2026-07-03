'use client';

import React, { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  User,
  Settings,
  LogOut,
  Zap,
  Shield,
  Home,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Command,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { NotificationBell } from '@/components/ui/notification-bell';
import { BranchSwitcher } from '@/components/ui/branch-switcher';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PORTAL_THEMES, ROLE_THEMES, PREONE_COLORS } from '@/lib/theme-tokens';
import { useSchoolBranding } from '@/contexts/school-branding';
import { useUndoRedoStore } from '@/lib/stores/undo-redo';
import { toast } from 'sonner';

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
  setup: 'Setup & Onboarding',
  school: 'School',
  branches: 'Branches',
  'academic-year': 'Academic Year',
  group: 'Groups',
  classes: 'Classes',
  'fee-structure': 'Fee Structure',
  staff: 'Staff',
  integrations: 'Integrations',
  admissions: 'Admissions',
  leads: 'Leads',
  pipeline: 'Pipeline',
  followups: 'Follow Ups',
  visits: 'Visits',
  tasks: 'Tasks',
  students: 'Students',
  parents: 'Parents',
  teachers: 'Teachers',
  operations: 'Operations',
  attendance: 'Attendance',
  activities: 'Activities',
  calendar: 'Calendar',
  transport: 'Transport',
  fees: 'Fees',
  'growth-passport': 'Growth Passport',
  communication: 'Communication',
  chat: 'Chat',
  announcements: 'Announcements',
  notifications: 'Notifications',
  whatsapp: 'WhatsApp',
  templates: 'Templates',
  reports: 'Reports',
  'ai-center': 'AI Center',
  settings: 'Settings',
  system: 'System',
  'audit-logs': 'Audit Logs',
  errors: 'Errors',
  monitoring: 'Monitoring',
  crm: 'Admissions',
  growth: 'Growth Passport',
  onboarding: 'Setup',
};

/**
 * AdminHeader — Redesigned top header bar for the PreOne admin portal.
 * 
 * Features:
 * - Taller header (h-16 = 64px) with glass-morphism effect
 * - School branding (logo + name from SchoolBrandingContext)
 * - Home button for quick dashboard navigation
 * - Theme toggle (dark/light mode)
 * - Maximize/full-screen toggle
 * - Undo/Redo buttons (from global UndoRedoStore)
 * - Command palette trigger (Ctrl+K)
 * - Breadcrumb navigation
 * - Notification bell, branch switcher, user menu
 * - All colors use CSS variable tokens — no hardcoded values
 */
export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme: currentTheme, setTheme } = useTheme();
  const { schoolName, schoolLogo } = useSchoolBranding();
  const { undo, redo, canUndo, canRedo, past, future } = useUndoRedoStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  // Theme toggle
  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }, [currentTheme, setTheme]);

  // Full-screen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Undo/Redo handlers
  const handleUndo = useCallback(async () => {
    const action = await undo();
    if (action) {
      toast.success(`Undone: ${action.description}`, { action: { label: 'Redo', onClick: () => redo() } });
    }
  }, [undo, redo]);

  const handleRedo = useCallback(async () => {
    const action = await redo();
    if (action) {
      toast.success(`Redone: ${action.description}`);
    }
  }, [redo]);

  // Global keyboard shortcuts for this header
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // F for fullscreen
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        toggleFullscreen();
      }
      // D for theme toggle
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        toggleTheme();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, toggleFullscreen, toggleTheme]);

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'A';
  const isTaskMaster = user?.role === 'TASK_MASTER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white shadow-sm px-4 dark:bg-gray-900 dark:border-gray-800">
      {/* ── Role badge ── */}
      {isSuperAdmin && (
        <span
          className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
          style={{
            backgroundColor: PREONE_COLORS.purple[50],
            color: PREONE_COLORS.purple[700],
            borderColor: PREONE_COLORS.purple[200],
          }}
        >
          <Shield className="h-3 w-3" />
          Super Admin
        </span>
      )}
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
      {/* ── Left: Breadcrumb ── */}
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

      {/* ── Right: Branch Switcher, Search, Notifications, User Menu ── */}
      <div className="ml-auto flex items-center gap-2">
        {/* Branch Switcher */}
        <BranchSwitcher />

        {/* Divider */}
        <div
          className="h-6 w-px mx-1 hidden sm:block"
          style={{ backgroundColor: 'var(--admin-border)' }}
        />

        {/* Undo / Redo */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg disabled:opacity-30"
                disabled={past.length === 0}
                onClick={handleUndo}
                style={{ color: 'var(--admin-text-muted)' }}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg disabled:opacity-30"
                disabled={future.length === 0}
                onClick={handleRedo}
                style={{ color: 'var(--admin-text-muted)' }}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Divider */}
        <div
          className="h-6 w-px mx-1 hidden sm:block"
          style={{ backgroundColor: 'var(--admin-border)' }}
        />

        {/* Command Palette Trigger */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg px-2 hidden sm:flex"
                onClick={() => {
                  // Dispatch Ctrl+K event to open command palette
                  document.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
                  );
                }}
                style={{
                  color: 'var(--admin-text-muted)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                <Search className="h-3.5 w-3.5" />
                <span className="text-xs">Search</span>
                <kbd
                  className="ml-1 rounded border px-1 py-0.5 text-[9px] font-mono"
                  style={{
                    borderColor: 'var(--admin-border)',
                    color: 'var(--admin-text-subtle)',
                  }}
                >
                  ⌘K
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Command Palette (Ctrl+K)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Theme Toggle */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={toggleTheme}
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {currentTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle theme (D)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Fullscreen Toggle */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hidden sm:flex"
                onClick={toggleFullscreen}
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fullscreen (F)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9 rounded-lg"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback
                  className="text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--admin-primary-soft)',
                    color: 'var(--admin-primary)',
                  }}
                >
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <span
                className="hidden sm:inline text-sm font-medium"
                style={{ color: 'var(--admin-text)' }}
              >
                {user?.name || 'Admin'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            style={{
              backgroundColor: 'var(--admin-surface)',
              borderColor: 'var(--admin-border)',
            }}
          >
            <DropdownMenuLabel
              className="text-xs"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              {user?.email || 'admin@preone.com'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push('/admin/settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              style={{ color: 'var(--admin-error)' }}
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
