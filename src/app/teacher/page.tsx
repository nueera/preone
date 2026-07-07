'use client';

// ============================================================
// PreOne — Teacher Portal Landing Page
// Full-width single column layout with module cards grid
// Header is provided by TeacherHeader in teacher-layout-client.tsx
// ============================================================

import Link from 'next/link';
import Image from 'next/image';
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
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

// ============================================================
// Custom icon map — module title → icon file path
// Modules without an entry use their Lucide icon as fallback.
// ============================================================
const CUSTOM_ICONS: Record<string, string> = {
  Dashboard: '/icons/teacher/dashbaord.webp',
  'My Class': '/icons/teacher/myclass.webp',
  Attendance: '/icons/teacher/Attendance.webp',
  'Daily Updates': '/icons/teacher/daily_update.webp',
  Observations: '/icons/teacher/observation.webp',
  Growth: '/icons/teacher/growth_assessment.webp',
  Schedule: '/icons/teacher/schedule.webp',
  Chat: '/icons/teacher/chat.webp',
  Announcements: '/icons/teacher/announcement.webp',
  Reports: '/icons/teacher/reports.webp',
  Settings: '/icons/teacher/setting.webp',
};

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
// Landing Page Component
// ============================================================

export default function TeacherLandingPage() {
  return (
    <div>
      {/* ── Page Header (simple, like admin portal) ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-[20px] font-semibold"
            style={{ color: 'var(--teacher-text)' }}
          >
            Modules
          </h1>
          <p
            className="mt-1 text-[14px]"
            style={{ color: 'var(--teacher-text-muted)' }}
          >
            Quick access to all your modules
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--teacher-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teacher-primary)]"
          style={{ color: 'var(--teacher-text-muted)' }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Module Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;

          return (
            <Link key={mod.title} href={mod.route} className="block group h-full">
              <div
                className="relative flex flex-col items-center rounded-2xl overflow-hidden h-full min-h-[260px] sm:min-h-[300px] transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1 border border-black/5"
                style={{ backgroundColor: mod.iconBg }}
              >
                {/* Coming Soon Badge */}
                {mod.comingSoon && (
                  <span
                    className="absolute right-3 top-3 rounded-full px-2 py-0.5 font-semibold z-10"
                    style={{
                      fontSize: '10px',
                      background: 'var(--teacher-warning-soft)',
                      color: 'var(--teacher-warning)',
                    }}
                  >
                    Coming Soon
                  </span>
                )}

                {/* Top accent circle with icon */}
                <div className="pt-5 sm:pt-6 pb-1 flex flex-col items-center">
                  <div
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center shadow-sm"
                    style={{
                      backgroundColor: 'white',
                      color: mod.iconColor,
                    }}
                  >
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                </div>

                {/* Illustration area */}
                <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden py-2">
                  {CUSTOM_ICONS[mod.title] ? (
                    <Image
                      src={CUSTOM_ICONS[mod.title]}
                      alt={mod.title}
                      width={140}
                      height={140}
                      className="object-contain"
                    />
                  ) : (
                    <Icon
                      className="h-16 w-16"
                      style={{ color: mod.iconColor, opacity: 0.7 }}
                    />
                  )}
                </div>

                {/* Bottom: title + description + arrow */}
                <div className="w-full px-3 sm:px-4 pt-2 pb-3 sm:pb-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className="font-semibold text-[13px] sm:text-sm"
                      style={{ color: mod.titleColor }}
                    >
                      {mod.title}
                    </h3>
                    <p
                      className="text-[10px] sm:text-[11px] mt-0.5 leading-snug truncate"
                      style={{ color: 'var(--teacher-text-muted)' }}
                    >
                      {mod.description}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
                    style={{ color: mod.iconColor }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
