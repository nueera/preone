'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Baby, ClipboardCheck, IndianRupee, Sun,
  Eye, TrendingUp, MessageSquare, MessageCircle, Megaphone, Settings,
  ChevronsLeft, ChevronsRight, ChevronDown, Bell, FileBarChart,
  BookOpen, Utensils,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useParentAuth } from '@/lib/parent-auth';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { useChatStore } from '@/lib/stores/chat-store';

const theme = PORTAL_THEMES.parent;

// ── Navigation items for Parent portal ──
const NAV_ITEMS: { label: string; icon: React.ElementType; href: string; badge?: string }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/parent/dashboard' },
  { label: 'My Children', icon: Baby, href: '/parent/children' },
  { label: 'Childhood Passport', icon: BookOpen, href: '/parent/children' },
  { label: 'Attendance', icon: ClipboardCheck, href: '/parent/attendance' },
  { label: 'Fees', icon: IndianRupee, href: '/parent/fees' },
  { label: 'Daily Updates', icon: Sun, href: '/parent/daily-updates' },
  { label: 'Meals', icon: Utensils, href: '/parent/meals' },
  { label: 'Observations', icon: Eye, href: '/parent/observations' },
  { label: 'Growth', icon: TrendingUp, href: '/parent/growth' },
  { label: 'Communication', icon: MessageSquare, href: '/parent/communication' },
  { label: 'Reports', icon: FileBarChart, href: '/parent/reports' },
  { label: 'Notifications', icon: Bell, href: '/parent/notifications' },
  { label: 'Chat', icon: MessageCircle, href: '/parent/chat', badge: 'chat' },
  { label: 'Announcements', icon: Megaphone, href: '/parent/announcements' },
  { label: 'Settings', icon: Settings, href: '/parent/settings' },
];

/**
 * ParentSidebar — Left sidebar navigation for the PreOne parent portal.
 * Uses global theme tokens from /src/lib/theme-tokens.ts
 * Includes child switcher for multi-child parents.
 */
export function ParentSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const { children, selectedChild, selectChild } = useParentAuth();
  const totalUnread = useChatStore((s) => s.totalUnread);

  const hasMultipleChildren = children.length > 1;

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
                Parent Portal
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-white/10 mx-3" />

      {/* ── Child Switcher ── */}
      {state === 'expanded' && hasMultipleChildren && (
        <>
          <div className="px-3 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/10 hover:bg-white/20 transition-colors text-white">
                  <Avatar className="h-7 w-7 border border-white/30">
                    <AvatarImage src={selectedChild?.photo || undefined} />
                    <AvatarFallback className={`${theme.avatarFallbackClass} text-[10px] font-semibold`}>
                      {selectedChild
                        ? `${selectedChild.firstName[0]}${selectedChild.lastName[0]}`
                        : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedChild
                        ? `${selectedChild.firstName} ${selectedChild.lastName}`
                        : 'Select Child'}
                    </p>
                    <p className={`text-[10px] truncate ${theme.navSubtextClass}`}>
                      {selectedChild?.className || 'No class'}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 ${theme.navSubtextClass}`} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                  Switch Child
                </div>
                {children.map((child) => (
                  <DropdownMenuItem
                    key={child.id}
                    className={`cursor-pointer ${
                      child.id === selectedChild?.id
                        ? theme.selectedClass
                        : ''
                    }`}
                    onClick={() => selectChild(child.id)}
                  >
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarImage src={child.photo || undefined} />
                      <AvatarFallback className={`text-[8px] ${theme.avatarFallbackClass}`}>
                        {child.firstName[0]}
                        {child.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {child.firstName} {child.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {child.className}
                      </span>
                    </div>
                    {child.id === selectedChild?.id && (
                      <Badge className={`${theme.selectedClass} text-[9px] ml-1`}>
                        Active
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Separator className="bg-white/10 mx-3" />
        </>
      )}

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
                  (item.href !== '/parent/dashboard' &&
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
