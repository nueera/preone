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
// ============================================================

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PageTransition } from '@/components/ui/page-transition';
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

// ── Mock data (replace with API calls later) ──────────────────

interface SetupModule {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  statusIcon: React.ElementType;
  statusText: string;
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
  },
  {
    key: 'academic-year',
    title: 'Academic Year',
    description: 'Create and manage academic years and important dates.',
    href: '/admin/setup/academic-year',
    icon: Calendar,
    statusIcon: Calendar,
    statusText: '2025-26 (Current)',
  },
  {
    key: 'group',
    title: 'Group',
    description: 'Manage groups for different age categories in your school.',
    href: '/admin/setup/classes?tab=groups',
    icon: Users,
    statusIcon: Users,
    statusText: '5 Groups',
  },
  {
    key: 'classes',
    title: 'Classes & Program',
    description: 'Manage classes, programs and curriculum structure efficiently.',
    href: '/admin/setup/classes',
    icon: GraduationCap,
    statusIcon: GraduationCap,
    statusText: '12 Classes',
  },
  {
    key: 'fee-structure',
    title: 'Fee Structure',
    description: 'Create and manage fee structures, heads and discounts.',
    href: '/admin/setup/fee-structure',
    icon: IndianRupee,
    statusIcon: IndianRupee,
    statusText: '8 Fee Structures',
  },
  {
    key: 'staff',
    title: 'Staff',
    description: 'Manage all staff members, roles, departments and permissions.',
    href: '/admin/setup/staff',
    icon: UserCog,
    statusIcon: UserCog,
    statusText: '36 Staff Members',
  },
];

// ── Setup module card ─────────────────────────────────────────

function SetupModuleCard({ module }: { module: SetupModule }) {
  const [hasIllustration, setHasIllustration] = useState(true);
  const Icon = module.icon;
  const StatusIcon = module.statusIcon;

  return (
    <Link
      href={module.href}
      aria-label={`${module.title} — ${module.statusText}`}
      className="group block"
    >
      <PreOneCard
        variant="default"
        hover
        className="h-full"
      >
        <div className="flex min-h-[200px] flex-col justify-between p-6">
          {/* ── Top row: illustration + icon ── */}
          <div className="mb-4 flex items-start justify-between">
            {/* Left: illustration slot or icon fallback */}
            <div className="relative h-[72px] w-[96px]">
              {hasIllustration ? (
                <Image
                  src={`/icons/admin/setup-${module.key}.svg`}
                  alt=""
                  width={96}
                  height={72}
                  className="h-[72px] w-[96px] object-contain"
                  onError={() => setHasIllustration(false)}
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-xl"
                  style={{ background: 'var(--admin-primary-soft)' }}
                >
                  <Icon className="h-12 w-12" style={{ color: 'var(--admin-primary)' }} />
                </div>
              )}
            </div>

            {/* Right: circular icon badge */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--admin-primary)' }}
            >
              <Icon className="h-4 w-4" style={{ color: 'var(--admin-primary-foreground, #FFFFFF)' }} />
            </div>
          </div>

          {/* ── Title ── */}
          <h3
            className="mb-1 text-[18px] font-bold transition-colors duration-200"
            style={{ color: 'var(--admin-text)' }}
          >
            <span className="group-hover:text-[var(--admin-primary)]">
              {module.title}
            </span>
          </h3>

          {/* ── Description ── */}
          <p
            className="mb-4 line-clamp-2 text-[13px] font-normal"
            style={{ color: 'var(--admin-text-muted)' }}
          >
            {module.description}
          </p>

          {/* ── Footer: status badge + arrow ── */}
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: '1px solid var(--admin-border)' }}
          >
            {/* Status badge */}
            <div
              className="flex items-center gap-1.5"
              aria-label={`Status: ${module.statusText}`}
            >
              <StatusIcon
                className="h-3.5 w-3.5"
                style={{ color: 'var(--admin-primary)' }}
              />
              <span
                className="text-[12px] font-medium"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {module.statusText}
              </span>
            </div>

            {/* Arrow button */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200"
              style={{
                background: 'var(--admin-surface-2)',
              }}
            >
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
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
          Let&apos;s set everything up the right way! 🚀
        </p>
      </div>
      {/* Tail */}
      <div
        className="absolute -bottom-2 right-6 h-0 w-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid var(--admin-border)',
        }}
      />
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
            {/* Icon slot */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'var(--admin-primary-soft)' }}
            >
              <Settings
                className="h-7 w-7"
                style={{ color: 'var(--admin-primary)' }}
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

        {/* ── Module card grid ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SETUP_MODULES.map((mod) => (
            <SetupModuleCard key={mod.key} module={mod} />
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
