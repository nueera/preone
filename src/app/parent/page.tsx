'use client';

// ============================================================
// PreOne — Parent Portal Landing Page
// Full-width single column layout with module cards grid
// Header is provided by ParentHeader in parent-layout-client.tsx
// ============================================================

import Link from 'next/link';
import Image from 'next/image';
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
  RefreshCw,
} from 'lucide-react';
import { PreOneCard } from '@/components/ui/preone-card';

// ============================================================
// Custom icon map — module title → icon file path
// Modules without an entry use their Lucide icon as fallback.
// ============================================================
const CUSTOM_ICONS: Record<string, string> = {
  'My Children': '/icons/parent/my-children.webp',
  Attendance: '/icons/parent/attendance.webp',
  Fees: '/icons/parent/fees.webp',
  Observation: '/icons/parent/observation.webp',
  Growth: '/icons/parent/growth.webp',
  Chat: '/icons/parent/chat.webp',
  Announcements: '/icons/parent/announcement.webp',
  'PreO Learning': '/icons/parent/preo_learning.webp',
  Settings: '/icons/parent/setting.webp',
  'PreO Gaming': '/icons/parent/preo_gaming.webp',
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
// Landing Page Component
// ============================================================

export default function ParentLandingPage() {
  return (
    <div>
      {/* ── Page Header (simple, like admin portal) ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-[20px] font-semibold"
            style={{ color: 'var(--parent-text)' }}
          >
            Modules
          </h1>
          <p
            className="mt-1 text-[14px]"
            style={{ color: 'var(--parent-text-muted)' }}
          >
            Quick access to all your modules
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--parent-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--parent-primary)]"
          style={{ color: 'var(--parent-text-muted)' }}
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

                {/* Icon */}
                <div className="h-36 w-36 flex items-center justify-center mb-4">
                  {CUSTOM_ICONS[mod.title] ? (
                    <Image
                      src={CUSTOM_ICONS[mod.title]}
                      alt={mod.title}
                      width={200}
                      height={200}
                      className="object-contain"
                    />
                  ) : (
                    <Icon className="h-24 w-24" style={{ color: mod.iconColor }} />
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
    </div>
  );
}
