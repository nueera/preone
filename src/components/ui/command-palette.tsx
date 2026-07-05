'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  IndianRupee,
  Zap,
  Settings,
  MessageCircle,
  FileBarChart,
  Sparkles,
  School,
  GitBranch,
  Phone,
  CheckSquare,
  Calendar,
  Bus,
  Palette,
  Megaphone,
  Bell,
  MessageSquare,
  List,
  Shield,
  AlertTriangle,
  Activity,
  UserCheck,
  TrendingUp,
  Plug,
  Eye,
  Wrench,
  UsersRound,
  Baby,
  ClipboardList,
  Home,
  Sun,
  Maximize2,
} from 'lucide-react';
import { useTheme } from 'next-themes';

// ── Navigation items for command palette (shared with sidebar) ──
interface CommandNavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  keywords?: string[];
}

const NAV_ITEMS: CommandNavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard', keywords: ['home', 'overview'] },
  { label: 'Setup & Onboarding', icon: School, href: '/admin/setup', keywords: ['school', 'wizard', 'init'] },
  { label: 'Setup — School', icon: School, href: '/admin/setup/school' },
  { label: 'Setup — Branches', icon: GitBranch, href: '/admin/setup/branches' },
  { label: 'Setup — Academic Year', icon: Calendar, href: '/admin/setup/academic-year' },
  { label: 'Setup — Classes', icon: Users, href: '/admin/setup/classes' },
  { label: 'Setup — Fee Structure', icon: IndianRupee, href: '/admin/setup/fee-structure' },
  { label: 'Setup — Staff', icon: UserCheck, href: '/admin/setup/staff' },
  { label: 'Setup — Integrations', icon: Plug, href: '/admin/setup/integrations' },
  { label: 'Admissions', icon: Zap, href: '/admin/admissions', keywords: ['crm', 'leads', 'enquiry'] },
  { label: 'Admissions — Leads', icon: Users, href: '/admin/admissions/leads' },
  { label: 'Admissions — Pipeline', icon: GitBranch, href: '/admin/admissions/pipeline' },
  { label: 'Admissions — Follow Ups', icon: Phone, href: '/admin/admissions/followups' },
  { label: 'Admissions — Visits', icon: Eye, href: '/admin/admissions/visits' },
  { label: 'Admissions — Tasks', icon: CheckSquare, href: '/admin/admissions/tasks' },
  { label: 'Students', icon: GraduationCap, href: '/admin/students' },
  { label: 'Parents', icon: Baby, href: '/admin/parents' },
  { label: 'Teachers', icon: UsersRound, href: '/admin/teachers' },
  { label: 'Classes', icon: ClipboardList, href: '/admin/classes' },
  { label: 'Operations — Attendance', icon: CheckSquare, href: '/admin/operations/attendance' },
  { label: 'Operations — Activities', icon: Palette, href: '/admin/operations/activities' },
  { label: 'Operations — Calendar', icon: Calendar, href: '/admin/operations/calendar' },
  { label: 'Operations — Transport', icon: Bus, href: '/admin/operations/transport' },
  { label: 'Fees', icon: IndianRupee, href: '/admin/fees', keywords: ['payment', 'invoice'] },
  { label: 'Growth Passport', icon: TrendingUp, href: '/admin/growth-passport', keywords: ['milestone', 'observation'] },
  { label: 'Communication — Chat', icon: MessageSquare, href: '/admin/communication/chat', keywords: ['message'] },
  { label: 'Communication — Announcements', icon: Megaphone, href: '/admin/communication/announcements' },
  { label: 'Communication — Notifications', icon: Bell, href: '/admin/communication/notifications' },
  { label: 'Communication — WhatsApp', icon: MessageCircle, href: '/admin/communication/whatsapp' },
  { label: 'Communication — Templates', icon: List, href: '/admin/communication/templates' },
  { label: 'Reports', icon: FileBarChart, href: '/admin/reports', keywords: ['analytics', 'data'] },
  { label: 'AI Center', icon: Sparkles, href: '/admin/ai-center', keywords: ['artificial', 'intelligence'] },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
  { label: 'System — Audit Logs', icon: Shield, href: '/admin/system/audit-logs' },
  { label: 'System — Errors', icon: AlertTriangle, href: '/admin/system/errors' },
  { label: 'System — Monitoring', icon: Activity, href: '/admin/system/monitoring' },
];

// ── Action items (non-navigation) ──
const ACTION_ITEMS: CommandNavItem[] = [
  { label: 'Toggle Dark Mode', icon: Sun, href: '__toggle-theme__', keywords: ['dark', 'light', 'theme'] },
  { label: 'Toggle Fullscreen', icon: Maximize2, href: '__toggle-fullscreen__', keywords: ['full', 'screen'] },
  { label: 'Go to Login', icon: Home, href: '/login', keywords: ['sign out', 'logout'] },
];

/**
 * CommandPalette — Global Ctrl+K command palette for the admin portal.
 *
 * Uses the cmdk library via the shadcn Command component.
 * Provides search-based navigation to all admin pages + quick actions.
 * Reads user role from localStorage to filter available commands.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  // Register Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get user role for filtering
  const [userRole, setUserRole] = React.useState<string>('ADMIN');
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('preone_user');
      if (saved) {
        const user = JSON.parse(saved);
        setUserRole(user.role || 'ADMIN');
      }
    } catch {
      // Default
    }
  }, []);

  // Filter items by role
  const visibleNavItems = React.useMemo(() => {
    const isTaskMaster = userRole === 'TASK_MASTER';
    const isAdmin = userRole === 'ADMIN';

    if (isTaskMaster) {
      return NAV_ITEMS.filter((item) =>
        ['/admin/dashboard', '/admin/admissions', '/admin/communication/chat', '/admin/communication/announcements']
          .some((route) => item.href === route || item.href.startsWith(route + '/'))
      );
    }

    if (isAdmin) {
      return NAV_ITEMS.filter((item) => !item.href.startsWith('/admin/system'));
    }

    return NAV_ITEMS;
  }, [userRole]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);

      if (href === '__toggle-theme__') {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        return;
      }

      if (href === '__toggle-fullscreen__') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }

      router.push(href);
    },
    [router, setTheme, theme]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {visibleNavItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              keywords={item.keywords}
              onSelect={() => handleSelect(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {ACTION_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              keywords={item.keywords}
              onSelect={() => handleSelect(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
