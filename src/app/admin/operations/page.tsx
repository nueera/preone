'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckSquare,
  Palette,
  Calendar,
  Bus,
  Users,
  UserCheck,
  ClipboardList,
  BarChart3,
  Sparkles,
  Star,
  BookOpen,
  Camera,
  CalendarDays,
  PartyPopper,
  FileCheck,
  MapPin,
  UserCircle,
  UserRound,
  Wrench,
  ChevronRight,
} from 'lucide-react';
import { PreOneCard } from '@/components/ui/preone-card';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

// ── Types ──
interface SubItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

interface OpsModule {
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accentVar: string;
  accentSoftVar: string;
  accentHex: string;
  accentSoftHex: string;
  imageSrc: string;
  subItems: SubItem[];
}

// ── Module Definitions ──
const OPS_MODULES: OpsModule[] = [
  {
    key: 'attendance',
    title: 'Attendance',
    description: 'Track and manage daily attendance records',
    icon: CheckSquare,
    accentVar: '--admin-success',
    accentSoftVar: '--admin-success-soft',
    accentHex: '#10B981',
    accentSoftHex: '#D1FAE5',
    imageSrc: '/icons/admin/operations/attendance.webp',
    subItems: [
      { label: 'Student Attendance', icon: Users, href: '/admin/operations/attendance?tab=student' },
      { label: 'Teacher Attendance', icon: UserCheck, href: '/admin/operations/attendance?tab=teacher' },
      { label: 'Daily Summary', icon: ClipboardList, href: '/admin/operations/attendance?tab=summary' },
      { label: 'Attendance Reports', icon: BarChart3, href: '/admin/operations/attendance?tab=reports' },
    ],
  },
  {
    key: 'activities',
    title: 'Activities',
    description: 'Manage daily activities and creative events',
    icon: Palette,
    accentVar: '--admin-accent',
    accentSoftVar: '--admin-warning-soft',
    accentHex: '#F97316',
    accentSoftHex: '#FFF7ED',
    imageSrc: '/icons/admin/operations/activities.webp',
    subItems: [
      { label: 'Daily Activities', icon: Sparkles, href: '/admin/operations/activities?tab=daily' },
      { label: 'Events', icon: Star, href: '/admin/operations/activities?tab=events' },
      { label: 'Classroom Activities', icon: BookOpen, href: '/admin/operations/activities?tab=classroom' },
      { label: 'Photo Gallery', icon: Camera, href: '/admin/operations/activities?tab=gallery' },
    ],
  },
  {
    key: 'calendar',
    title: 'Calendar',
    description: 'Academic calendar, holidays, and events',
    icon: Calendar,
    accentVar: '--admin-info',
    accentSoftVar: '--admin-info-soft',
    accentHex: '#3B82F6',
    accentSoftHex: '#DBEAFE',
    imageSrc: '/icons/admin/operations/calendar.webp',
    subItems: [
      { label: 'Academic Calendar', icon: CalendarDays, href: '/admin/operations/calendar?tab=academic' },
      { label: 'Holidays', icon: PartyPopper, href: '/admin/operations/calendar?tab=holidays' },
      { label: 'Events Calendar', icon: Sparkles, href: '/admin/operations/calendar?tab=events' },
      { label: 'Exam / Assessment Dates', icon: FileCheck, href: '/admin/operations/calendar?tab=exams' },
    ],
  },
  {
    key: 'transport',
    title: 'Transport',
    description: 'Vehicles, routes, and student pickup/drop',
    icon: Bus,
    accentVar: '--admin-primary',
    accentSoftVar: '--admin-primary-soft',
    accentHex: '#7C3AED',
    accentSoftHex: '#F5F3FF',
    imageSrc: '/icons/admin/operations/transport.webp',
    subItems: [
      { label: 'Vehicles', icon: Bus, href: '/admin/operations/transport?tab=vehicles' },
      { label: 'Routes', icon: MapPin, href: '/admin/operations/transport?tab=routes' },
      { label: 'Driver Management', icon: UserCircle, href: '/admin/operations/transport?tab=drivers' },
      { label: 'Student Pickup & Drop', icon: UserRound, href: '/admin/operations/transport?tab=pickup' },
    ],
  },
];

// ── Operation Module Card ──
function OpsModuleCard({ module }: { module: OpsModule }) {
  const Icon = module.icon;

  return (
    <PreOneCard variant="default" hover className="overflow-hidden">
      <div className="flex flex-row min-h-[280px] sm:min-h-[300px]">
        {/* Left: Text content — 60% */}
        <div className="flex-1 p-5 flex flex-col">
          {/* Circular icon badge */}
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `var(${module.accentSoftVar}, ${module.accentSoftHex})`,
              color: `var(${module.accentVar}, ${module.accentHex})`,
            }}
          >
            <Icon className="h-6 w-6" />
          </div>

          {/* Title */}
          <h3
            className="mt-3 text-[20px] font-semibold leading-tight"
            style={{ color: `var(${module.accentVar}, ${module.accentHex})` }}
          >
            {module.title}
          </h3>

          {/* Description */}
          <p
            className="mt-1 text-[14px] leading-snug"
            style={{ color: 'var(--admin-text-muted, #6B7280)' }}
          >
            {module.description}
          </p>

          {/* Sub-items */}
          <div className="mt-auto pt-4 space-y-0.5">
            {module.subItems.map((sub) => {
              const SubIcon = sub.icon;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group/sub"
                  style={{
                    color: `var(${module.accentVar}, ${module.accentHex})`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--admin-surface-2, #F3F4F6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <SubIcon className="h-4 w-4 flex-shrink-0" />
                  <span
                    className="text-[14px] font-medium flex-1"
                    style={{ color: 'var(--admin-text, #111827)' }}
                  >
                    {sub.label}
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-50 group-hover/sub:translate-x-0.5 transition-transform" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Illustration — 40% */}
        <div
          className="hidden sm:flex w-[40%] relative items-center justify-center overflow-hidden"
          style={{ backgroundColor: `var(${module.accentSoftVar}, ${module.accentSoftHex})` }}
        >
          <Image
            src={module.imageSrc}
            alt={module.title}
            fill
            className="object-contain object-center p-3 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 1024px) 40vw, 20vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          {/* Fallback icon when image fails to load */}
          <Icon
            className="absolute inset-0 m-auto h-20 w-20 opacity-30 pointer-events-none"
            style={{ color: `var(${module.accentVar}, ${module.accentHex})` }}
          />
        </div>
      </div>
    </PreOneCard>
  );
}

// ── Main Page ──
export default function OperationsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--admin-primary-soft, #F5F3FF)',
                color: 'var(--admin-primary, #7C3AED)',
              }}
            >
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1
                className="text-[28px] font-bold leading-tight"
                style={{ color: 'var(--admin-text, #111827)' }}
              >
                Operations
              </h1>
            </div>
          </div>
          <p
            className="text-[14px] mt-1"
            style={{ color: 'var(--admin-text-muted, #6B7280)' }}
          >
            Manage daily operations and activities seamlessly
          </p>
        </div>

        {/* ── Module Cards Grid ── */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {OPS_MODULES.map((mod) => (
            <StaggerItem key={mod.key}>
              <OpsModuleCard module={mod} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
