'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  CheckSquare,
  IndianRupee,
  Zap,
  Palette,
  TrendingUp,
  MessageSquare,
  Bus,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Megaphone,
  Phone,
  List,
  ChevronDown,
  GitBranch,
  Bell,
  FileBarChart,
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

const theme = PORTAL_THEMES.admin;

// ── Navigation items definition with role-based visibility ──
interface NavChild {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: string[];  // Which roles can see this item
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: string[];  // Which roles can see this item
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard', roles: ['ADMIN', 'TASK_MASTER'] },
  { label: 'Students', icon: GraduationCap, href: '/admin/students', roles: ['ADMIN'] },
  { label: 'Teachers', icon: Users, href: '/admin/teachers', roles: ['ADMIN'] },
  { label: 'Attendance', icon: CheckSquare, href: '/admin/attendance', roles: ['ADMIN'] },
  { label: 'Fees', icon: IndianRupee, href: '/admin/fees', roles: ['ADMIN'] },
  // ===== CRM SECTION — visible to both ADMIN + TASK_MASTER =====
  {
    label: 'CRM',
    icon: Zap,
    href: '/admin/crm',
    roles: ['ADMIN', 'TASK_MASTER'],
    children: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/crm', roles: ['ADMIN', 'TASK_MASTER'] },
      { label: 'Pipeline', icon: GitBranch, href: '/admin/crm/pipeline', roles: ['ADMIN', 'TASK_MASTER'] },
      { label: 'Leads', icon: Users, href: '/admin/crm/leads', roles: ['ADMIN', 'TASK_MASTER'] },
      { label: 'Follow-ups', icon: Phone, href: '/admin/crm/followups', roles: ['ADMIN', 'TASK_MASTER'] },
      { label: 'Tasks', icon: CheckSquare, href: '/admin/crm/tasks', roles: ['ADMIN', 'TASK_MASTER'] },
    ],
  },
  { label: 'Activities', icon: Palette, href: '/admin/activities', roles: ['ADMIN'] },
  { label: 'Growth', icon: TrendingUp, href: '/admin/growth', roles: ['ADMIN'] },
  { label: 'Communication', icon: MessageSquare, href: '/admin/communication', roles: ['ADMIN'] },
  { label: 'Reports', icon: FileBarChart, href: '/admin/reports', roles: ['ADMIN'] },
  { label: 'Notifications', icon: Bell, href: '/admin/notifications', roles: ['ADMIN', 'TASK_MASTER'] },
  { label: 'Transport', icon: Bus, href: '/admin/transport', roles: ['ADMIN'] },
  { label: 'Settings', icon: Settings, href: '/admin/settings', roles: ['ADMIN'] },
];

/**
 * AdminSidebar — Left sidebar navigation for the PreOne admin portal.
 * Uses shadcn/ui Sidebar with collapsible="icon" support.
 * Shows tooltips when collapsed, full labels when expanded.
 * Role-based menu filtering: ADMIN sees everything, TASK_MASTER sees only CRM + Dashboard.
 * Uses global theme tokens from /src/lib/theme-tokens.ts
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();

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

  // Get role theme for taskmaster badge
  const roleTheme = ROLE_THEMES[userRole.toLowerCase() as keyof typeof ROLE_THEMES] || ROLE_THEMES.admin;
  const isTaskMaster = userRole === 'TASK_MASTER';

  // Check if a nav item is active
  const isActive = (href: string, hasChildren?: boolean) => {
    if (hasChildren) {
      return pathname.startsWith('/admin/crm');
    }
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    return pathname === href || pathname.startsWith(href + '/');
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
                {isTaskMaster ? 'Task Master' : 'Preschool ERP'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-white/10 mx-3" />

      {/* ── Navigation Menu ── */}
      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className={`${theme.navLabelClass} text-[10px] uppercase tracking-wider`}>
            {isTaskMaster ? 'CRM Menu' : 'Menu'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const active = isActive(item.href, !!item.children);

                // Item with children (CRM section)
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
                                const childActive = pathname === child.href || (child.href === '/admin/crm' && pathname === '/admin/crm' && !pathname.startsWith('/admin/crm/'));
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
                                      <Link href={child.href}>
                                        <child.icon className="h-3.5 w-3.5 shrink-0" />
                                        <span>{child.label}</span>
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
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
