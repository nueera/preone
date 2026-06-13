'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  IndianRupee,
  Zap,
  Rocket,
  Settings2,
  MessageCircle,
  FileBarChart,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
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
  Sparkles,
  Plug,
  Eye,
  Wrench,
  UsersRound,
  Baby,
  ClipboardList,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PORTAL_THEMES, ROLE_THEMES } from '@/lib/theme-tokens';
import { useChatStore } from '@/lib/stores/chat-store';

const theme = PORTAL_THEMES.admin;

// ── Navigation items definition with role-based visibility ──
interface NavChild {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
  badge?: string; // Optional badge identifier (e.g. 'chat' for unread count)
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
  children?: NavChild[];
  badge?: string;
}

// ── Main navigation items ──
const NAV_ITEMS: NavItem[] = [
  // Dashboard
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard', roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'] },

  // Setup & Onboarding (collapsible)
  {
    label: 'Setup & Onboarding',
    icon: Rocket,
    href: '/admin/setup',
    roles: ['ADMIN', 'SUPER_ADMIN'],
    children: [
      { label: 'School', icon: School, href: '/admin/setup/school', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Branches', icon: GitBranch, href: '/admin/setup/branches', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Academic Year', icon: Calendar, href: '/admin/setup/academic-year', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Classes', icon: Users, href: '/admin/setup/classes', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Fee Structure', icon: IndianRupee, href: '/admin/setup/fee-structure', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Staff', icon: UserCheck, href: '/admin/setup/staff', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Integrations', icon: Plug, href: '/admin/setup/integrations', roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },

  // Admissions (collapsible)
  {
    label: 'Admissions',
    icon: Zap,
    href: '/admin/admissions',
    roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'],
    children: [
      { label: 'Leads', icon: Users, href: '/admin/admissions/leads', roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'] },
      { label: 'Pipeline', icon: GitBranch, href: '/admin/admissions/pipeline', roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'] },
      { label: 'Follow Ups', icon: Phone, href: '/admin/admissions/followups', roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'] },
      { label: 'Visits', icon: Eye, href: '/admin/admissions/visits', roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'] },
      { label: 'Tasks', icon: CheckSquare, href: '/admin/admissions/tasks', roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'] },
    ],
  },

  // Students
  { label: 'Students', icon: GraduationCap, href: '/admin/students', roles: ['ADMIN', 'SUPER_ADMIN'] },

  // Parents
  { label: 'Parents', icon: Baby, href: '/admin/parents', roles: ['ADMIN', 'SUPER_ADMIN'] },

  // Teachers
  { label: 'Teachers', icon: UsersRound, href: '/admin/teachers', roles: ['ADMIN', 'SUPER_ADMIN'] },

  // Classes
  { label: 'Classes', icon: ClipboardList, href: '/admin/classes', roles: ['ADMIN', 'SUPER_ADMIN'] },

  // Operations (collapsible)
  {
    label: 'Operations',
    icon: Wrench,
    href: '/admin/operations',
    roles: ['ADMIN', 'SUPER_ADMIN'],
    children: [
      { label: 'Attendance', icon: CheckSquare, href: '/admin/operations/attendance', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Activities', icon: Palette, href: '/admin/operations/activities', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Calendar', icon: Calendar, href: '/admin/operations/calendar', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Transport', icon: Bus, href: '/admin/operations/transport', roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },

  // Fees
  { label: 'Fees', icon: IndianRupee, href: '/admin/fees', roles: ['ADMIN', 'SUPER_ADMIN'] },

  // Growth Passport
  { label: 'Growth Passport', icon: TrendingUp, href: '/admin/growth-passport', roles: ['ADMIN', 'SUPER_ADMIN'] },

  // Communication (collapsible)
  {
    label: 'Communication',
    icon: MessageCircle,
    href: '/admin/communication',
    roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'],
    children: [
      { label: 'Chat', icon: MessageSquare, href: '/admin/communication/chat', roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'], badge: 'chat' },
      { label: 'Announcements', icon: Megaphone, href: '/admin/communication/announcements', roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'] },
      { label: 'Notifications', icon: Bell, href: '/admin/communication/notifications', roles: ['ADMIN', 'SUPER_ADMIN', 'TASK_MASTER'] },
      { label: 'WhatsApp', icon: MessageCircle, href: '/admin/communication/whatsapp', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Templates', icon: List, href: '/admin/communication/templates', roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },

  // Reports
  { label: 'Reports', icon: FileBarChart, href: '/admin/reports', roles: ['ADMIN', 'SUPER_ADMIN'] },

  // AI Center
  { label: 'AI Center', icon: Sparkles, href: '/admin/ai-center', roles: ['ADMIN', 'SUPER_ADMIN'] },

  // Settings
  { label: 'Settings', icon: Settings, href: '/admin/settings', roles: ['ADMIN', 'SUPER_ADMIN'] },
];

// ── System section (SUPER_ADMIN only) ──
const SYSTEM_NAV: NavItem = {
  label: 'System',
  icon: Shield,
  href: '/admin/system',
  roles: ['SUPER_ADMIN'],
  children: [
    { label: 'Audit Logs', icon: FileBarChart, href: '/admin/system/audit-logs', roles: ['SUPER_ADMIN'] },
    { label: 'Errors', icon: AlertTriangle, href: '/admin/system/errors', roles: ['SUPER_ADMIN'] },
    { label: 'Monitoring', icon: Activity, href: '/admin/system/monitoring', roles: ['SUPER_ADMIN'] },
  ],
};

/**
 * AdminSidebar — Left sidebar navigation for the PreOne admin portal.
 * Uses shadcn/ui Sidebar with collapsible="icon" support.
 * Shows tooltips when collapsed, full labels when expanded.
 * Role-based menu filtering:
 *   - SUPER_ADMIN: sees everything including System
 *   - ADMIN: sees everything except System
 *   - TASK_MASTER: sees only Dashboard + Admissions + Communication (Chat, Announcements, Notifications)
 * Uses global theme tokens from /src/lib/theme-tokens.ts
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const totalUnread = useChatStore((s) => s.totalUnread);

  // Get current user role from localStorage
  const [userRole, setUserRole] = React.useState<string>('ADMIN');

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('preone_user');
      if (saved) {
        const user = JSON.parse(saved);
        setUserRole(user.role || 'ADMIN');
      }
    } catch {
      // Default to ADMIN
    }
  }, []);

  // Filter nav items by role
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  // Determine if System section should be visible
  const showSystem = userRole === 'SUPER_ADMIN';

  // Get role theme for taskmaster badge
  const roleTheme = ROLE_THEMES[userRole.toLowerCase() as keyof typeof ROLE_THEMES] || ROLE_THEMES.admin;
  const isTaskMaster = userRole === 'TASK_MASTER';

  // Check if a nav item is active
  const isActive = (href: string, hasChildren?: boolean) => {
    if (hasChildren) {
      // For collapsible parent items, check if pathname starts with the parent href
      return pathname.startsWith(href);
    }
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Render a single nav item (with or without children)
  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href, !!item.children);

    // Item with children & sidebar expanded → Collapsible
    if (item.children && state === 'expanded') {
      return (
        <Collapsible key={item.label} defaultOpen={active} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                isActive={active}
                tooltip={item.label}
                className={`
                  group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                  transition-all duration-200 w-full
                  ${active ? theme.navActiveClass : theme.navInactiveClass}
                `}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children
                  .filter(child => child.roles.includes(userRole))
                  .map((child) => {
                    const childActive = pathname === child.href ||
                      (child.href === item.href && pathname === item.href && !pathname.includes('/', child.href.length + 1));
                    return (
                      <SidebarMenuSubItem key={child.href}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={childActive}
                          className={`
                            flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm
                            transition-all duration-200
                            ${childActive
                              ? 'bg-white/20 text-white font-medium'
                              : 'text-purple-200 hover:bg-white/10 hover:text-white'
                            }
                          `}
                        >
                          <Link href={child.href} className="flex items-center gap-2">
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
                            <span>{child.label}</span>
                            {child.badge === 'chat' && totalUnread > 0 && (
                              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                {totalUnread > 99 ? '99+' : totalUnread}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    // Item with children but sidebar collapsed — just show icon
    if (item.children && state === 'collapsed') {
      return (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            asChild
            isActive={active}
            tooltip={item.label}
            className={`
              group relative flex items-center gap-3 rounded-xl px-3 py-2.5
              transition-all duration-200
              ${active ? theme.navActiveClass : theme.navInactiveClass}
            `}
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    // Regular item (no children)
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.label}
          className={`
            group relative flex items-center gap-3 rounded-xl px-3 py-2.5
            transition-all duration-200
            ${active ? theme.navActiveClass : theme.navInactiveClass}
          `}
        >
          <Link href={item.href} className="flex items-center gap-3 flex-1">
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
            {item.badge === 'chat' && totalUnread > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-sidebar-gradient"
    >
      {/* ── Logo Area ── */}
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-md backdrop-blur-sm">
            {state === 'collapsed' ? (
              <span className="text-base font-bold text-white">P</span>
            ) : (
              <Image
                src="/preonelogo.png"
                alt="PreOne"
                width={36}
                height={36}
                className="rounded-lg"
              />
            )}
          </div>
          {state === 'expanded' && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-lg font-bold text-white leading-tight">
                PreOne
              </span>
              <span className={`text-[10px] leading-tight ${theme.navSubtextClass}`}>
                {isTaskMaster ? 'Task Master' : userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Preschool ERP'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-white/10 mx-3" />

      {/* ── Navigation Menu ── */}
      <SidebarContent className="px-2 py-2 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className={`${theme.navLabelClass} text-[10px] uppercase tracking-wider`}>
            {isTaskMaster ? 'Admissions & Comms' : 'Menu'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── System Section (SUPER_ADMIN only) ── */}
        {showSystem && (
          <SidebarGroup>
            <Separator className="bg-white/20 my-2" />
            <SidebarGroupLabel className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-300/80">
              <Shield className="h-3 w-3" />
              SUPER ADMIN
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderNavItem(SYSTEM_NAV)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer: Collapse Toggle ── */}
      <SidebarFooter className="p-3">
        <Separator className="bg-white/10 mb-3" />
        <button
          onClick={toggleSidebar}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 ${theme.navFooterClass} transition-colors`}
        >
          {state === 'collapsed' ? (
            <ChevronsRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 shrink-0" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
