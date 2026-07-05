'use client';

// ============================================================
// PreOne — Parent Portal Landing Page
// Full-width single column layout with:
//   Section 1: Top Header Bar (branding + greeting + time + notification + profile)
//   Section 2: Module Cards Grid (13 cards, 4-col responsive)
// ============================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  IndianRupee,
  FileEdit,
  Eye,
  BarChart3,
  MessageCircle,
  Megaphone,
  FileBarChart,
  BookOpen,
  Settings,
  Gamepad2,
  Star,
  Bell,
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
    route: '/parent/dashboard',
    icon: LayoutDashboard,
    iconBg: 'var(--parent-primary-soft)',
    iconColor: 'var(--parent-primary)',
    titleColor: 'var(--parent-primary)',
    description: 'Overview & updates',
    comingSoon: false,
  },
  {
    title: 'My Children',
    route: '/parent/children',
    icon: Users,
    iconBg: 'var(--parent-primary-soft)',
    iconColor: 'var(--parent-primary)',
    titleColor: 'var(--parent-primary)',
    description: 'View child profiles',
    comingSoon: false,
  },
  {
    title: 'Attendance',
    route: '/parent/attendance',
    icon: ClipboardCheck,
    iconBg: 'var(--parent-success-soft)',
    iconColor: 'var(--parent-success)',
    titleColor: 'var(--parent-success)',
    description: 'Track attendance',
    comingSoon: false,
  },
  {
    title: 'Fees',
    route: '/parent/fees',
    icon: IndianRupee,
    iconBg: 'var(--parent-orange-soft)',
    iconColor: 'var(--parent-orange)',
    titleColor: 'var(--parent-orange)',
    description: 'Fee payments & history',
    comingSoon: false,
  },
  {
    title: 'Daily Update',
    route: '/parent/daily-updates',
    icon: FileEdit,
    iconBg: 'var(--parent-warning-soft)',
    iconColor: 'var(--parent-warning)',
    titleColor: 'var(--parent-warning)',
    description: 'Daily activities & meals',
    comingSoon: false,
  },
  {
    title: 'Observation',
    route: '/parent/observations',
    icon: Eye,
    iconBg: 'var(--parent-pink-soft)',
    iconColor: 'var(--parent-pink)',
    titleColor: 'var(--parent-pink)',
    description: 'Teacher observations',
    comingSoon: false,
  },
  {
    title: 'Growth',
    route: '/parent/growth',
    icon: BarChart3,
    iconBg: 'var(--parent-info-soft)',
    iconColor: 'var(--parent-info)',
    titleColor: 'var(--parent-info)',
    description: 'Growth & milestones',
    comingSoon: false,
  },
  {
    title: 'Chat',
    route: '/parent/chat',
    icon: MessageCircle,
    iconBg: 'var(--parent-info-soft)',
    iconColor: 'var(--parent-info)',
    titleColor: 'var(--parent-info)',
    description: 'Message teachers & staff',
    comingSoon: false,
  },
  {
    title: 'Announcements',
    route: '/parent/announcements',
    icon: Megaphone,
    iconBg: 'var(--parent-orange-soft)',
    iconColor: 'var(--parent-orange)',
    titleColor: 'var(--parent-orange)',
    description: 'School announcements',
    comingSoon: false,
  },
  {
    title: 'Reports',
    route: '/parent/reports',
    icon: FileBarChart,
    iconBg: 'var(--parent-info-soft)',
    iconColor: 'var(--parent-info)',
    titleColor: 'var(--parent-info)',
    description: 'Progress & reports',
    comingSoon: false,
  },
  {
    title: 'PreO Learning',
    route: '/parent/preo-learning',
    icon: BookOpen,
    iconBg: 'var(--parent-primary-soft)',
    iconColor: 'var(--parent-primary)',
    titleColor: 'var(--parent-primary)',
    description: 'Interactive learning',
    comingSoon: true,
  },
  {
    title: 'Settings',
    route: '/parent/settings',
    icon: Settings,
    iconBg: 'var(--parent-surface-2)',
    iconColor: 'var(--parent-text-muted)',
    titleColor: 'var(--parent-text-muted)',
    description: 'Profile & preferences',
    comingSoon: false,
  },
  {
    title: 'PreO Gaming',
    route: '/parent/preo-gaming',
    icon: Gamepad2,
    iconBg: 'var(--parent-pink-soft)',
    iconColor: 'var(--parent-pink)',
    titleColor: 'var(--parent-pink)',
    description: 'Fun learning games',
    comingSoon: true,
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

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
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

export default function ParentLandingPage() {
  const [hasIllustration, setHasIllustration] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
              style={{ background: 'var(--parent-primary-soft)' }}
            >
              <Star className="h-5 w-5" style={{ color: 'var(--parent-primary)' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--parent-primary)' }}>
                PreOne
              </h1>
              <p className="text-xs" style={{ color: 'var(--parent-text-muted)' }}>
                Parent Portal
              </p>
            </div>
          </div>

          {/* Center Zone — Greeting (hidden on mobile) */}
          <div className="hidden md:block">
            <p className="text-lg font-semibold" style={{ color: 'var(--parent-text)' }}>
              {getGreeting()}, Rahul! 👋
            </p>
          </div>

          {/* Right Zone — Info + Actions */}
          <div className="flex items-center gap-3">
            {/* Time Display (hidden on mobile) */}
            <div
              className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5"
              style={{ background: 'var(--parent-surface-2)' }}
            >
              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--parent-text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--parent-text)' }}>
                {currentTime}
              </span>
            </div>

            {/* Notification Bell */}
            <button
              className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ background: 'var(--parent-surface-2)' }}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" style={{ color: 'var(--parent-text-muted)' }} />
              <span
                className="absolute h-2 w-2 rounded-full"
                style={{ background: 'var(--parent-error)', top: '6px', right: '6px' }}
              />
            </button>

            {/* Profile Section */}
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'var(--parent-primary-soft)',
                  color: 'var(--parent-primary)',
                }}
              >
                RS
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium" style={{ color: 'var(--parent-text)' }}>
                  Rahul Sharma
                </p>
                <p className="text-[11px]" style={{ color: 'var(--parent-text-muted)' }}>
                  Parent
                </p>
              </div>
              <ChevronDown className="h-4 w-4" style={{ color: 'var(--parent-text-subtle)' }} />
            </div>
          </div>
        </div>
      </PreOneCard>

      {/* ── Section 2: Module Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const slug = getSlug(mod.title);

          return (
            <Link key={mod.title} href={mod.route} className="group">
              <PreOneCard
                hover
                className="relative flex flex-col items-center justify-center p-6 text-center"
              >
                {/* Coming Soon Badge */}
                {mod.comingSoon && (
                  <span
                    className="absolute right-3 top-3 rounded-full px-2 py-0.5 font-semibold"
                    style={{
                      fontSize: '10px',
                      background: 'var(--parent-warning-soft)',
                      color: 'var(--parent-warning)',
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
                      src={`/illustrations/parent-${slug}.svg`}
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
                  style={{ color: mod.titleColor }}
                >
                  {mod.title}
                </h3>

                {/* Card Description */}
                <p
                  className="text-[11px] mt-1"
                  style={{ color: 'var(--parent-text-muted)' }}
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
