'use client';

// ============================================================
// PreOne — Teacher Portal Landing Page
// Full-width single column layout with header bar and module cards
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileEdit,
  Eye,
  Activity,
  CalendarDays,
  MessageCircle,
  Megaphone,
  FileBarChart,
  Bell,
  Settings,
  Bot,
  GraduationCap,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { PreOneCard } from '@/components/ui/preone-card';

// ============================================================
// Module Data
// ============================================================

interface ModuleCard {
  title: string;
  route: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  description: string;
  comingSoon: boolean;
}

const modules: ModuleCard[] = [
  {
    title: 'Dashboard',
    route: '/teacher/dashboard',
    icon: LayoutDashboard,
    iconBg: 'var(--teacher-primary-soft)',
    iconColor: 'var(--teacher-primary)',
    titleColor: 'var(--teacher-primary)',
    description: 'Overview & updates',
    comingSoon: false,
  },
  {
    title: 'My Class',
    route: '/teacher/my-class',
    icon: Users,
    iconBg: 'var(--teacher-primary-soft)',
    iconColor: 'var(--teacher-primary)',
    titleColor: 'var(--teacher-primary)',
    description: 'Manage your class',
    comingSoon: false,
  },
  {
    title: 'Attendance',
    route: '/teacher/attendance',
    icon: ClipboardCheck,
    iconBg: 'var(--teacher-success-soft)',
    iconColor: 'var(--teacher-success)',
    titleColor: 'var(--teacher-success)',
    description: 'Mark & track attendance',
    comingSoon: false,
  },
  {
    title: 'Daily Updates',
    route: '/teacher/daily-updates',
    icon: FileEdit,
    iconBg: 'var(--teacher-warning-soft)',
    iconColor: 'var(--teacher-warning)',
    titleColor: 'var(--teacher-warning)',
    description: 'Log daily activities',
    comingSoon: false,
  },
  {
    title: 'Observations',
    route: '/teacher/observations',
    icon: Eye,
    iconBg: 'var(--teacher-info-soft)',
    iconColor: 'var(--teacher-info)',
    titleColor: 'var(--teacher-info)',
    description: 'Record observations',
    comingSoon: false,
  },
  {
    title: 'Activities',
    route: '/teacher/activities',
    icon: Activity,
    iconBg: 'var(--teacher-info-soft)',
    iconColor: 'var(--teacher-info)',
    titleColor: 'var(--teacher-info)',
    description: 'Plan activities',
    comingSoon: false,
  },
  {
    title: 'Growth',
    route: '/teacher/growth',
    icon: Activity,
    iconBg: 'var(--teacher-primary-soft)',
    iconColor: 'var(--teacher-primary)',
    titleColor: 'var(--teacher-primary)',
    description: 'Track growth & milestones',
    comingSoon: false,
  },
  {
    title: 'Schedule',
    route: '/teacher/schedule',
    icon: CalendarDays,
    iconBg: 'var(--teacher-warning-soft)',
    iconColor: 'var(--teacher-warning)',
    titleColor: 'var(--teacher-warning)',
    description: 'View your schedule',
    comingSoon: false,
  },
  {
    title: 'Chat',
    route: '/teacher/chat',
    icon: MessageCircle,
    iconBg: 'var(--teacher-info-soft)',
    iconColor: 'var(--teacher-info)',
    titleColor: 'var(--teacher-info)',
    description: 'Message parents & staff',
    comingSoon: false,
  },
  {
    title: 'Announcements',
    route: '/teacher/announcements',
    icon: Megaphone,
    iconBg: 'var(--teacher-warning-soft)',
    iconColor: 'var(--teacher-warning)',
    titleColor: 'var(--teacher-warning)',
    description: 'School announcements',
    comingSoon: false,
  },
  {
    title: 'Reports',
    route: '/teacher/reports',
    icon: FileBarChart,
    iconBg: 'var(--teacher-info-soft)',
    iconColor: 'var(--teacher-info)',
    titleColor: 'var(--teacher-info)',
    description: 'Progress & reports',
    comingSoon: false,
  },
  {
    title: 'Notifications',
    route: '/teacher/notifications',
    icon: Bell,
    iconBg: 'var(--teacher-error-soft)',
    iconColor: 'var(--teacher-error)',
    titleColor: 'var(--teacher-error)',
    description: 'View notifications',
    comingSoon: false,
  },
  {
    title: 'PreOne Assistant',
    route: '/teacher/assistant',
    icon: Bot,
    iconBg: 'var(--teacher-primary-soft)',
    iconColor: 'var(--teacher-primary)',
    titleColor: 'var(--teacher-primary)',
    description: 'AI-powered help',
    comingSoon: true,
  },
  {
    title: 'Settings',
    route: '/teacher/settings',
    icon: Settings,
    iconBg: 'var(--teacher-surface-2)',
    iconColor: 'var(--teacher-text-muted)',
    titleColor: 'var(--teacher-text-muted)',
    description: 'Profile & preferences',
    comingSoon: false,
  },
];

// ============================================================
// Helpers
// ============================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ============================================================
// Landing Page Component
// ============================================================

export default function TeacherLandingPage() {
  const [hasIllustration, setHasIllustration] = useState<Record<string, boolean>>({});

  const handleImgError = (key: string) => {
    setHasIllustration((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <>
      {/* ── Section 1: Top Header Bar ── */}
      <PreOneCard className="p-5">
        <div className="flex items-center justify-between">
          {/* Left Zone — Branding */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--teacher-primary-soft)' }}
            >
              <GraduationCap className="h-5 w-5" style={{ color: 'var(--teacher-primary)' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--teacher-primary)' }}>
                PreOne
              </h1>
              <p className="text-xs" style={{ color: 'var(--teacher-text-muted)' }}>
                Teacher Portal
              </p>
            </div>
          </div>

          {/* Center Zone — Greeting (hidden on mobile) */}
          <div className="hidden md:block text-center">
            <p className="text-lg font-semibold" style={{ color: 'var(--teacher-text)' }}>
              {getGreeting()}, Priya! 👋
            </p>
            <p className="text-xs" style={{ color: 'var(--teacher-text-muted)' }}>
              {getFormattedDate()}
            </p>
          </div>

          {/* Right Zone — Profile */}
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
            <div className="hidden md:block">
              <p className="text-sm font-medium" style={{ color: 'var(--teacher-text)' }}>
                Priya Sharma
              </p>
              <p className="text-[11px]" style={{ color: 'var(--teacher-text-muted)' }}>
                Teacher
              </p>
            </div>
            <ChevronDown className="h-4 w-4" style={{ color: 'var(--teacher-text-subtle)' }} />
          </div>
        </div>
      </PreOneCard>

      {/* ── Section 2: Module Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const slug = getSlug(mod.title);
          const isAssistant = mod.title === 'PreOne Assistant';

          return (
            <Link key={mod.title} href={mod.route} className="group">
              <PreOneCard
                hover
                className={`relative flex flex-col items-center justify-center p-6 text-center ${
                  isAssistant ? 'border-2' : ''
                }`}
                {...(isAssistant
                  ? {
                      style: {
                        borderColor: 'var(--teacher-primary)',
                        boxShadow: '0 0 20px rgba(16,185,129,0.15)',
                      },
                    }
                  : {})}
              >
                {/* Coming Soon Badge */}
                {mod.comingSoon && (
                  <span
                    className="absolute right-3 top-3 rounded-full px-2 py-0.5 font-semibold"
                    style={{
                      fontSize: '10px',
                      background: 'var(--teacher-warning-soft)',
                      color: 'var(--teacher-warning)',
                    }}
                  >
                    Coming Soon
                  </span>
                )}

                {/* Illustration Area */}
                <div
                  className="h-20 w-20 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: mod.iconBg }}
                >
                  {hasIllustration[mod.title] !== false ? (
                    <img
                      src={`/illustrations/teacher-${slug}.svg`}
                      alt={mod.title}
                      className="h-14 w-14 object-contain"
                      onError={() => handleImgError(mod.title)}
                    />
                  ) : (
                    <Icon className="h-10 w-10" style={{ color: mod.iconColor }} />
                  )}
                </div>

                {/* Card Title */}
                <h3
                  className="text-sm font-semibold"
                  style={{
                    color: isAssistant ? 'var(--teacher-primary)' : mod.titleColor,
                  }}
                >
                  {mod.title}
                </h3>

                {/* Card Description */}
                <p
                  className="text-[11px] mt-1"
                  style={{ color: 'var(--teacher-text-muted)' }}
                >
                  {mod.description}
                </p>
              </PreOneCard>
            </Link>
          );
        })}
      </div>
    </>
  );
}
