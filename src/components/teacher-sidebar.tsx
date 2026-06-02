'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  GraduationCap,
  CheckSquare,
  Sun,
  Eye,
  Palette,
  TrendingUp,
  Calendar,
  MessageSquare,
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
import { PORTAL_THEMES } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.teacher;

// ── Navigation items for Teacher portal ──
const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/teacher/dashboard' },
  { label: 'My Class', icon: GraduationCap, href: '/teacher/my-class' },
  { label: 'Attendance', icon: CheckSquare, href: '/teacher/attendance' },
  { label: 'Daily Updates', icon: Sun, href: '/teacher/daily-updates' },
  { label: 'Observations', icon: Eye, href: '/teacher/observations' },
  { label: 'Activities', icon: Palette, href: '/teacher/activities' },
  { label: 'Growth', icon: TrendingUp, href: '/teacher/growth' },
  { label: 'Schedule', icon: Calendar, href: '/teacher/schedule' },
  { label: 'Communication', icon: MessageSquare, href: '/teacher/communication' },
  { label: 'Settings', icon: Settings, href: '/teacher/settings' },
];

/**
 * TeacherSidebar — Left sidebar navigation for the PreOne teacher portal.
 * Uses global theme tokens from /src/lib/theme-tokens.ts
 */
export function TeacherSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-portal-sidebar"
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
                Teacher Portal
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
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/teacher/dashboard' &&
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
                        ${isActive ? theme.navActiveClass : theme.navInactiveClass}
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
