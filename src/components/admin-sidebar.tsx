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
  Megaphone,
  Palette,
  TrendingUp,
  MessageSquare,
  Bus,
  Settings,
  ChevronsLeft,
  ChevronsRight,
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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

// ── Navigation items definition ──
const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Students', icon: GraduationCap, href: '/admin/students' },
  { label: 'Teachers', icon: Users, href: '/admin/teachers' },
  { label: 'Attendance', icon: CheckSquare, href: '/admin/attendance' },
  { label: 'Fees', icon: IndianRupee, href: '/admin/fees' },
  { label: 'Admission CRM', icon: Megaphone, href: '/admin/crm' },
  { label: 'Activities', icon: Palette, href: '/admin/activities' },
  { label: 'Growth', icon: TrendingUp, href: '/admin/growth' },
  { label: 'Communication', icon: MessageSquare, href: '/admin/communication' },
  { label: 'Transport', icon: Bus, href: '/admin/transport' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

/**
 * AdminSidebar — Left sidebar navigation for the PreOne admin portal.
 * Uses shadcn/ui Sidebar with collapsible="icon" support.
 * Shows tooltips when collapsed, full labels when expanded.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();

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
              <span className="text-[10px] text-purple-200 leading-tight">
                Preschool ERP
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-white/10 mx-3" />

      {/* ── Navigation Menu ── */}
      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-200/70 text-[10px] uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin/dashboard' &&
                    pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={`
                        group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                        transition-all duration-200
                        ${
                          isActive
                            ? 'bg-purple-600 text-white font-medium shadow-sm border-l-4 border-purple-800'
                            : 'text-purple-100 hover:bg-purple-50/10 hover:text-white dark:hover:bg-purple-900/30'
                        }
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
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-purple-200 hover:bg-white/10 hover:text-white transition-colors"
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
