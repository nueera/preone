'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Baby, ClipboardCheck, IndianRupee, Sun,
  Eye, TrendingUp, MessageSquare, Settings,
  ChevronsLeft, ChevronsRight, ChevronDown,
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
import { Button } from '@/components/ui/button';
import { useParentAuth } from '@/lib/parent-auth';

// ── Navigation items for Parent portal ──
const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/parent/dashboard' },
  { label: 'My Children', icon: Baby, href: '/parent/children' },
  { label: 'Attendance', icon: ClipboardCheck, href: '/parent/attendance' },
  { label: 'Fees', icon: IndianRupee, href: '/parent/fees' },
  { label: 'Daily Updates', icon: Sun, href: '/parent/daily-updates' },
  { label: 'Observations', icon: Eye, href: '/parent/observations' },
  { label: 'Growth', icon: TrendingUp, href: '/parent/growth' },
  { label: 'Communication', icon: MessageSquare, href: '/parent/communication' },
  { label: 'Settings', icon: Settings, href: '/parent/settings' },
];

/**
 * ParentSidebar — Left sidebar navigation for the PreOne parent portal.
 * Sky-blue/blue gradient theme, collapsible with icon-only mode.
 * Includes child switcher for multi-child parents.
 */
export function ParentSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const { children, selectedChild, selectChild } = useParentAuth();

  const hasMultipleChildren = children.length > 1;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0"
      style={{
        background: 'linear-gradient(180deg, #0ea5e9 0%, #3b82f6 100%)',
      }}
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
              <span className="text-[10px] text-sky-200 leading-tight">
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
                    <AvatarFallback className="bg-sky-200 text-sky-700 text-[10px] font-semibold">
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
                    <p className="text-[10px] text-sky-200 truncate">
                      {selectedChild?.className || 'No class'}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-sky-200" />
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
                        ? 'bg-sky-50 text-sky-700'
                        : ''
                    }`}
                    onClick={() => selectChild(child.id)}
                  >
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarImage src={child.photo || undefined} />
                      <AvatarFallback className="text-[8px] bg-sky-100 text-sky-700">
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
                      <Badge className="bg-sky-100 text-sky-700 text-[9px] ml-1">
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
          <SidebarGroupLabel className="text-sky-200/70 text-[10px] uppercase tracking-wider">
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
                        ${
                          isActive
                            ? 'bg-sky-600 text-white font-medium shadow-sm border-l-4 border-blue-800'
                            : 'text-sky-100 hover:bg-sky-50/10 hover:text-white dark:hover:bg-sky-900/30'
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
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sky-200 hover:bg-white/10 hover:text-white transition-colors"
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
