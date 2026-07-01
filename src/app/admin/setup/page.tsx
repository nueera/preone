'use client';

// ============================================================
// PreOne — Admin Setup Landing (/admin/setup)
//
// 6 illustrated module cards in a 3×2 grid.
// Clicking a card navigates to its sub-page.
//
// Sections:
//   1. Page header with PreO character + speech bubble
//   2. Card grid (3×2) with illustrations, status badges, arrows
//
// Color rules:
//   ALL colors use var(--admin-*) CSS variables — no hardcoded
//   hex or Tailwind color classes in JSX.
//
// Accessibility:
//   - aria-labels on all interactive elements
//   - focus-visible ring on card links
//   - prefers-reduced-motion: disables transforms, keeps opacity
// ============================================================

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import {
  Building2,
  Calendar,
  GraduationCap,
  IndianRupee,
  Users,
  UserCog,
  ArrowRight,
  Settings,
} from 'lucide-react';

// ── prefers-reduced-motion hook ───────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// ── Mock data (replace with API calls later) ──────────────────

interface SetupModule {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  statusIcon: React.ElementType;
  statusText: string;
  imageSrc: string;
}

const SETUP_MODULES: SetupModule[] = [
  {
    key: 'school',
    title: 'School',
    description: 'Manage school details, branches, contacts and settings.',
    href: '/admin/setup/school',
    icon: Building2,
    statusIcon: Building2,
    statusText: '2 Campuses',
    imageSrc: '/icons/admin/setup/school.webp',
  },
  {
    key: 'academic-year',
    title: 'Academic Year',
    description: 'Create and manage academic years and important dates.',
    href: '/admin/setup/academic-year',
    icon: Calendar,
    statusIcon: Calendar,
    statusText: '2025-26 (Current)',
    imageSrc: '/icons/admin/setup/academic-year.webp',
  },
  {
    key: 'group',
    title: 'Group',
    description: 'Manage groups for different age categories in your school.',
    href: '/admin/setup/classes?tab=groups',
    icon: Users,
    statusIcon: Users,
    statusText: '5 Groups',
    imageSrc: '/icons/admin/setup/group.webp',
  },
  {
    key: 'classes',
    title: 'Classes & Program',
    description: 'Manage classes, programs and curriculum structure efficiently.',
    href: '/admin/setup/classes',
    icon: GraduationCap,
    statusIcon: GraduationCap,
    statusText: '12 Classes',
    imageSrc: '/icons/admin/setup/classes.webp',
  },
  {
    key: 'fee-structure',
    title: 'Fee Structure',
    description: 'Create and manage fee structures, heads and discounts.',
    href: '/admin/setup/fee-structure',
    icon: IndianRupee,
    statusIcon: IndianRupee,
    statusText: '8 Fee Structures',
    imageSrc: '/icons/admin/setup/fee-structure.webp',
  },
  {
    key: 'staff',
    title: 'Staff',
    description: 'Manage all staff members, roles, departments and permissions.',
    href: '/admin/setup/staff',
    icon: UserCog,
    statusIcon: UserCog,
    statusText: '36 Staff Members',
    imageSrc: '/icons/admin/setup/staff.webp',
  },
];

// ── Setup module card ─────────────────────────────────────────

function SetupModuleCard({ module }: { module: SetupModule }) {
  const [hasIllustration, setHasIllustration] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const Icon = module.icon;
  const StatusIcon = module.statusIcon;

  return (
    <Link
      href={module.href}
      aria-label={`${module.title} — ${module.statusText}`}
      className={`
        group block
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[var(--admin-primary)] focus-visible:ring-offset-2
        rounded-3xl
      `}
    >
      <PreOneCard
        variant="default"
        hover
        className="h-full"
      >
        <div className="flex min-h-[180px] flex-col justify-between p-5 sm:min-h-[200px] sm:p-6">
          {/* ── Top row: illustration + icon badge ── */}
          <div className="mb-3 flex items-start justify-between sm:mb-4">
            {/* Left: custom illustration (responsive sizing, always visible) */}
            <div className="relative h-14 w-20 sm:h-[72px] sm:w-[96px]">
              {hasIllustration ? (
                <Image
                  src={module.imageSrc}
                  alt=""
                  fill
                  className={`
                    object-contain
                    ${reducedMotion ? '' : 'transition-transform duration-200 group-hover:scale-105'}
                  `}
                  onError={() => setHasIllustration(false)}
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl sm:h-16 sm:w-16"
                  style={{ background: 'var(--admin-primary-soft)' }}
                >
                  <Icon className="h-8 w-8 sm:h-12 sm:w-12" style={{ color: 'var(--admin-primary)' }} />
                </div>
              )}
            </div>

            {/* Right: circular icon badge */}
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8"
              style={{ background: 'var(--admin-primary)' }}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--admin-primary-foreground, #FFFFFF)' }} />
            </div>
          </div>

          {/* ── Title ── */}
          <h3
            className="mb-1 text-[16px] font-bold transition-colors duration-200 sm:text-[18px]"
            style={{ color: 'var(--admin-text)' }}
          >
            <span className="group-hover:text-[var(--admin-primary)]">
              {module.title}
            </span>
          </h3>

          {/* ── Description ── */}
          <p
            className="mb-3 line-clamp-2 text-[12px] font-normal sm:mb-4 sm:text-[13px]"
            style={{ color: 'var(--admin-text-muted)' }}
          >
            {module.description}
          </p>

          {/* ── Footer: status badge + arrow ── */}
          <div
            className="flex items-center justify-between pt-2.5 sm:pt-3"
            style={{ borderTop: '1px solid var(--admin-border)' }}
          >
            {/* Status badge */}
            <div
              className="flex items-center gap-1.5"
              aria-label={`Status: ${module.statusText}`}
            >
              <StatusIcon
                className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                style={{ color: 'var(--admin-primary)' }}
              />
              <span
                className="text-[11px] font-medium sm:text-[12px]"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {module.statusText}
              </span>
            </div>

            {/* Arrow button */}
            <div
              className={`
                flex h-7 w-7 items-center justify-center rounded-full
                transition-all duration-200
                sm:h-8 sm:w-8
                group-hover:bg-[var(--admin-primary-soft)]
              `}
              style={{ background: 'var(--admin-surface-2)' }}
            >
              <ArrowRight
                className={`
                  h-3.5 w-3.5 transition-transform duration-200
                  sm:h-4 sm:w-4
                  ${reducedMotion ? '' : 'group-hover:translate-x-0.5'}
                `}
                style={{ color: 'var(--admin-primary)' }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </PreOneCard>
    </Link>
  );
}

// ── Speech bubble for PreO character ──────────────────────────

function SpeechBubble() {
  return (
    <div className="relative hidden md:block">
      {/* Bubble */}
      <div
        className="rounded-xl px-4 py-2 shadow-sm"
        style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          maxWidth: 220,
        }}
        aria-label="PreOne says: Let's set everything up the right way!"
      >
        <p
          className="text-[13px] font-medium"
          style={{ color: 'var(--admin-text)' }}
        >
          Let&apos;s set everything up the right way!
        </p>
      </div>
      {/* Tail (outer border) */}
      <div
        className="absolute -bottom-2 right-6 h-0 w-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid var(--admin-border)',
        }}
      />
      {/* Tail (inner fill) */}
      <div
        className="absolute -bottom-[7px] right-[25px] h-0 w-0"
        style={{
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '7px solid var(--admin-surface)',
        }}
      />
    </div>
  );
}

// ── PreO character illustration ────────────────────────────────

function PreOCharacter() {
  const [hasAsset, setHasAsset] = useState(true);

  if (!hasAsset) return null;

  return (
    <div className="hidden flex-col items-end gap-2 md:flex">
      <SpeechBubble />
      <Image
        src="/characters/preo-setup.svg"
        alt="PreOne character"
        width={120}
        height={120}
        className="h-[120px] w-auto object-contain"
        onError={() => setHasAsset(false)}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function SetupLandingPage() {
  return (
    <PageTransition>
      <div>
        {/* ── Page header ── */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-start gap-4">
            {/* Gear icon */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'var(--admin-primary-soft)' }}
            >
              <Settings
                className="h-7 w-7"
                style={{ color: 'var(--admin-primary)' }}
                aria-hidden="true"
              />
            </div>

            {/* Title + subtitle */}
            <div>
              <h1
                className="text-[28px] font-bold leading-tight"
                style={{ color: 'var(--admin-text)' }}
              >
                Setup
              </h1>
              <p
                className="mt-1 text-[14px]"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Manage your school configuration and master data.
              </p>
            </div>
          </div>

          {/* PreO character + speech bubble (hidden on mobile) */}
          <PreOCharacter />
        </div>

        {/* ── Module card grid with stagger entrance ── */}
        <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SETUP_MODULES.map((mod) => (
            <StaggerItem key={mod.key}>
              <SetupModuleCard module={mod} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
