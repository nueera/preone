'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileEdit,
  Eye,
  CalendarDays,
  BarChart3,
  MessageCircle,
  Megaphone,
  FileBarChart,
  Settings,
  Bot,
  LucideIcon,
} from 'lucide-react';
import { PreOneCard } from '@/components/ui/preone-card';

// ============================================================
// TYPES
// ============================================================
interface ModuleCard {
  title: string;
  route: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  description: string;
  slug: string;
  isAssistant?: boolean;
}

// ============================================================
// MODULE DATA — 13 cards per specification
// ============================================================
const modules: ModuleCard[] = [
  {
    title: 'Dashboard',
    route: '/teacher/dashboard',
    icon: LayoutDashboard,
    iconBg: 'var(--teacher-primary-soft)',
    iconColor: 'var(--teacher-primary)',
    description: 'Overview & analytics',
    slug: 'dashboard',
  },
  {
    title: 'My Class',
    route: '/teacher/my-class',
    icon: Users,
    iconBg: 'var(--teacher-info-soft)',
    iconColor: 'var(--teacher-info)',
    description: 'Students & class info',
    slug: 'my-class',
  },
  {
    title: 'Attendance',
    route: '/teacher/attendance',
    icon: ClipboardCheck,
    iconBg: 'var(--teacher-success-soft)',
    iconColor: 'var(--teacher-success)',
    description: 'Mark & track attendance',
    slug: 'attendance',
  },
  {
    title: 'Daily Update',
    route: '/teacher/daily-updates',
    icon: FileEdit,
    iconBg: 'var(--teacher-warning-soft)',
    iconColor: 'var(--teacher-warning)',
    description: 'Share daily activities',
    slug: 'daily-updates',
  },
  {
    title: 'Observation',
    route: '/teacher/observations',
    icon: Eye,
    iconBg: 'var(--teacher-error-soft)',
    iconColor: 'var(--teacher-error)',
    description: 'Student observations',
    slug: 'observations',
  },
  {
    title: 'Activities',
    route: '/teacher/activities',
    icon: CalendarDays,
    iconBg: 'var(--teacher-info-soft)',
    iconColor: 'var(--teacher-info)',
    description: 'Plan & manage activities',
    slug: 'activities',
  },
  {
    title: 'Schedule',
    route: '/teacher/schedule',
    icon: CalendarDays,
    iconBg: 'var(--teacher-info-soft)',
    iconColor: 'var(--teacher-info)',
    description: 'Weekly & daily schedule',
    slug: 'schedule',
  },
  {
    title: 'Growth Assessment',
    route: '/teacher/growth',
    icon: BarChart3,
    iconBg: 'var(--teacher-primary-soft)',
    iconColor: 'var(--teacher-primary)',
    description: 'Track student growth',
    slug: 'growth',
  },
  {
    title: 'Chat',
    route: '/teacher/chat',
    icon: MessageCircle,
    iconBg: 'var(--teacher-info-soft)',
    iconColor: 'var(--teacher-info)',
    description: 'Parent & staff messaging',
    slug: 'chat',
  },
  {
    title: 'Announcement',
    route: '/teacher/announcements',
    icon: Megaphone,
    iconBg: 'var(--teacher-error-soft)',
    iconColor: 'var(--teacher-error)',
    description: 'School announcements',
    slug: 'announcements',
  },
  {
    title: 'Reports',
    route: '/teacher/reports',
    icon: FileBarChart,
    iconBg: 'var(--teacher-info-soft)',
    iconColor: 'var(--teacher-info)',
    description: 'Generate & view reports',
    slug: 'reports',
  },
  {
    title: 'Settings',
    route: '/teacher/settings',
    icon: Settings,
    iconBg: 'var(--teacher-surface-2)',
    iconColor: 'var(--teacher-text-muted)',
    description: 'Profile & preferences',
    slug: 'settings',
  },
  {
    title: 'PreOne Assistant',
    route: '/teacher/assistant',
    icon: Bot,
    iconBg: 'var(--teacher-primary-soft)',
    iconColor: 'var(--teacher-primary)',
    description: 'AI-powered help',
    slug: 'assistant',
    isAssistant: true,
  },
];

// ============================================================
// TIME-AWARE GREETING
// ============================================================
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getFormattedDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return now.toLocaleDateString('en-IN', options);
}

// ============================================================
// TEACHER LANDING PAGE
// ============================================================
export default function TeacherLandingPage() {
  const [greeting, setGreeting] = useState('Good Morning');
  const [hasIllustration, setHasIllustration] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const handleImgError = (key: string) => {
    setHasIllustration((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto w-full">
      {/* ── Section 1: Top Header Bar ── */}
      <PreOneCard className="p-5">
        <div className="flex items-center justify-between">
          {/* Left Zone — Branding */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--teacher-primary-soft)' }}
            >
              <Heart
                className="h-5 w-5"
                style={{ color: 'var(--teacher-primary)' }}
              />
            </div>
            <div>
              <div
                className="text-lg font-bold"
                style={{ color: 'var(--teacher-primary)' }}
              >
                PreOne
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--teacher-text-muted)' }}
              >
                Teacher Portal
              </div>
            </div>
          </div>

          {/* Center Zone — Greeting (hidden on mobile) */}
          <div className="hidden md:block">
            <span
              className="text-lg font-semibold"
              style={{ color: 'var(--teacher-text)' }}
            >
              {greeting}, Priya! 👋
            </span>
          </div>

          {/* Right Zone — Info + Actions */}
          <div className="flex items-center gap-4">
            {/* Date & Class Info (hidden on mobile) */}
            <div className="hidden md:flex flex-col items-end">
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--teacher-text)' }}
              >
                {getFormattedDate()}
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--teacher-text-muted)' }}
              >
                Class: Nursery A
              </span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    'var(--teacher-surface-2)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
                aria-label="Notifications"
              >
                <Bell
                  className="h-5 w-5"
                  style={{ color: 'var(--teacher-text-muted)' }}
                />
                <div
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    background: 'var(--teacher-error)',
                    top: '6px',
                    right: '6px',
                  }}
                />
              </button>
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'var(--teacher-primary-soft)',
                  color: 'var(--teacher-primary)',
                }}
              >
                PS
              </div>
              <div className="hidden md:flex flex-col">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--teacher-text)' }}
                >
                  Priya Sharma
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--teacher-text-muted)' }}
                >
                  Teacher
                </span>
              </div>
              <ChevronDown
                className="h-4 w-4 hidden md:block"
                style={{ color: 'var(--teacher-text-subtle)' }}
              />
            </div>
          </div>
        </div>
      </PreOneCard>

      {/* ── Section 2: Module Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const illustrationAvailable = hasIllustration[mod.title] !== false;

          return (
            <Link key={mod.title} href={mod.route} className="group">
              <PreOneCard
                hover
                className="flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
                style={
                  mod.isAssistant
                    ? {
                        border: '1.5px solid var(--teacher-primary)',
                      }
                    : undefined
                }
              >
                {/* PreOne Assistant glow effect */}
                {mod.isAssistant && (
                  <div
                    className="absolute h-24 w-24 -right-6 -top-6 blur-2xl opacity-20"
                    style={{ background: 'var(--teacher-primary)' }}
                  />
                )}

                {/* Illustration / Icon Area */}
                <div
                  className="h-20 w-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 group-hover:-translate-y-1"
                  style={{ background: mod.iconBg }}
                >
                  {illustrationAvailable ? (
                    <img
                      src={`/illustrations/teacher-${mod.slug}.svg`}
                      alt={mod.title}
                      className="h-14 w-14 object-contain"
                      onError={() => handleImgError(mod.title)}
                    />
                  ) : (
                    <Icon
                      className="h-10 w-10"
                      style={{ color: mod.iconColor }}
                    />
                  )}
                </div>

                {/* Card Title */}
                <div
                  className="text-sm font-semibold"
                  style={{
                    color: mod.isAssistant
                      ? 'var(--teacher-primary)'
                      : 'var(--teacher-text)',
                  }}
                >
                  {mod.title}
                </div>

                {/* Card Description */}
                <div
                  className="text-[11px] mt-1"
                  style={{ color: 'var(--teacher-text-muted)' }}
                >
                  {mod.description}
                </div>
              </PreOneCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
