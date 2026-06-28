'use client';

// ============================================================
// PreOne — Admin Admission CRM Landing (/admin/admissions)
//
// 5 illustrated module cards in a responsive grid.
// Clicking a card navigates to its sub-page.
//
// Sections:
//   1. Page header with PreO character + speech bubble
//   2. Card grid (5-col on xl) with illustrations, stats, arrows
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

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { AddLeadDialog } from '@/components/add-lead-dialog';
import {
  Users,
  Megaphone,
  LayoutGrid,
  PhoneCall,
  CalendarCheck,
  CheckSquare,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

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

// ── Types ─────────────────────────────────────────────────────

interface StatsData {
  totalLeads: number;
  leadsByStage: { stage: string; count: number }[];
  newThisWeek: number;
  followUpsToday: number;
  overdueFollowUps: number;
  conversionRate: number;
  estimatedRevenue: number;
  leadsBySource: { source: string; count: number }[];
  leadsByPriority: { priority: string; count: number }[];
  recentLeads: {
    id: string;
    parentName: string;
    childName: string;
    stage: string;
    source: string;
    priority: string;
    nextFollowUp: string | null;
    estimatedValue: number | null;
    createdAt: string;
  }[];
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
}

// ── CRM Module definitions ────────────────────────────────────

interface CrmModule {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  accentVar: string;
  accentSoftVar: string;
  statLabel: string;
  getStatValue: (stats: StatsData | null) => number;
  imageSrc: string;
}

const CRM_MODULES: CrmModule[] = [
  {
    key: 'leads',
    title: 'Leads',
    description: 'Track and manage all admission leads and enquiries.',
    href: '/admin/admissions/leads',
    icon: Users,
    accentVar: '--admin-primary',
    accentSoftVar: '--admin-primary-soft',
    statLabel: 'Total Leads',
    getStatValue: (s) => s?.totalLeads ?? 0,
    imageSrc: '/icons/admin/crm/leads.webp',
  },
  {
    key: 'pipeline',
    title: 'Pipeline',
    description: 'Visual Kanban board for admission stages.',
    href: '/admin/admissions/pipeline',
    icon: LayoutGrid,
    accentVar: '--admin-info',
    accentSoftVar: '--admin-info-soft',
    statLabel: 'Admission Stages',
    getStatValue: () => 7,
    imageSrc: '/icons/admin/crm/pipeline.webp',
  },
  {
    key: 'followups',
    title: 'Follow Ups',
    description: 'Schedule and track follow-ups with prospective parents.',
    href: '/admin/admissions/followups',
    icon: PhoneCall,
    accentVar: '--admin-success',
    accentSoftVar: '--admin-success-soft',
    statLabel: 'Pending Follow Ups',
    getStatValue: (s) => s?.overdueFollowUps ?? 0,
    imageSrc: '/icons/admin/crm/followups.webp',
  },
  {
    key: 'visits',
    title: 'Visits',
    description: 'Manage campus visits and school tour schedules.',
    href: '/admin/admissions/visits',
    icon: CalendarCheck,
    accentVar: '--admin-warning',
    accentSoftVar: '--admin-warning-soft',
    statLabel: 'Scheduled Visits',
    getStatValue: (s) => s?.followUpsToday ?? 0,
    imageSrc: '/icons/admin/crm/visits.webp',
  },
  {
    key: 'tasks',
    title: 'CRM Tasks',
    description: 'Organize tasks, to-dos and team assignments.',
    href: '/admin/admissions/tasks',
    icon: CheckSquare,
    accentVar: '--admin-accent',
    accentSoftVar: '--admin-warning-soft',
    statLabel: 'Open Tasks',
    getStatValue: (s) => s?.tasks?.todo ?? 0,
    imageSrc: '/icons/admin/crm/tasks.webp',
  },
];

// ── Helper: Get auth token ────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── CRM Module Card ───────────────────────────────────────────

function CrmModuleCard({
  module,
  stats,
}: {
  module: CrmModule;
  stats: StatsData | null;
}) {
  const [hasIllustration, setHasIllustration] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const Icon = module.icon;
  const statValue = module.getStatValue(stats);

  return (
    <Link
      href={module.href}
      aria-label={`${module.title} — ${statValue} ${module.statLabel}`}
      className={`
        group block
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[var(--admin-primary)] focus-visible:ring-offset-2
        rounded-3xl
      `}
    >
      <PreOneCard variant="default" hover className="h-full">
        <div className="flex min-h-[240px] flex-col justify-between p-5 sm:min-h-[280px] sm:p-6">
          {/* ── Top row: illustration + icon badge ── */}
          <div className="mb-4 flex items-start justify-between sm:mb-5">
            {/* Left: Illustration slot with accent-tinted background */}
            <div
              className="relative flex h-[100px] w-[130px] items-center justify-center overflow-hidden rounded-2xl sm:h-[110px] sm:w-[140px]"
              style={{ background: `var(${module.accentSoftVar})` }}
            >
              {hasIllustration ? (
                <Image
                  src={module.imageSrc}
                  alt=""
                  fill
                  className={`
                    object-contain p-2
                    ${reducedMotion ? '' : 'transition-transform duration-200 group-hover:scale-105'}
                  `}
                  onError={() => setHasIllustration(false)}
                />
              ) : (
                <Icon
                  className="h-14 w-14"
                  style={{ color: `var(${module.accentVar})` }}
                />
              )}
            </div>

            {/* Right: circular icon badge */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9"
              style={{ background: `var(${module.accentVar})` }}
            >
              <Icon
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                style={{ color: 'var(--admin-primary-foreground, #FFFFFF)' }}
              />
            </div>
          </div>

          {/* ── Title ── */}
          <h3
            className="mb-1.5 text-[16px] font-bold transition-colors duration-200 sm:text-lg"
            style={{ color: 'var(--admin-text)' }}
          >
            <span className="group-hover:text-[var(--admin-primary)]">
              {module.title}
            </span>
          </h3>

          {/* ── Description ── */}
          <p
            className="mb-4 line-clamp-2 text-[12px] leading-relaxed sm:text-[13px]"
            style={{ color: 'var(--admin-text-muted)' }}
          >
            {module.description}
          </p>

          {/* ── Footer: stat + arrow ── */}
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: '1px solid var(--admin-border)' }}
          >
            {/* Stat display */}
            <div
              className="flex items-center gap-2"
              aria-label={`Status: ${statValue} ${module.statLabel}`}
            >
              <span
                className="text-xl font-bold sm:text-2xl"
                style={{ color: `var(${module.accentVar})` }}
              >
                {statValue}
              </span>
              <span
                className="text-[11px] font-medium sm:text-xs"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {module.statLabel}
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
                style={{ color: `var(${module.accentVar})` }}
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
        className="rounded-xl px-4 py-2.5 shadow-sm"
        style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          maxWidth: 240,
        }}
        aria-label="PreOne says: Let's grow your admissions!"
      >
        <p
          className="text-[13px] font-medium"
          style={{ color: 'var(--admin-text)' }}
        >
          Let&apos;s grow your admissions!
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
        src="/characters/preo-crm.webp"
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

export default function AdmissionCrmPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  // ── Fetch stats data ──
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/crm/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch CRM statistics');
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch CRM stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLeadCreated = () => {
    setAddLeadOpen(false);
    fetchStats();
    toast.success('Lead created successfully');
  };

  return (
    <PageTransition>
      <div>
        {/* ── Page header ── */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Module icon */}
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
              style={{ background: 'var(--admin-primary-soft)' }}
            >
              <Image
                src="/icons/admin/admission-crm.webp"
                alt=""
                width={28}
                height={28}
                className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                onError={(e) => {
                  // Fallback: replace with lucide icon
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const span = document.createElement('span');
                    span.className = 'fallback-icon';
                    parent.innerHTML = '';
                    parent.appendChild(span);
                  }
                }}
              />
            </div>

            {/* Title + subtitle */}
            <div>
              <h1
                className="text-[24px] font-bold leading-tight sm:text-[28px]"
                style={{ color: 'var(--admin-text)' }}
              >
                Admission CRM
              </h1>
              <p
                className="mt-1 text-[13px] sm:text-[14px]"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Manage leads, pipeline, follow ups, visits and tasks.
              </p>
            </div>
          </div>

          {/* Right side: Add Lead btn + PreO character */}
          <div className="flex items-center gap-3">
            {/* Add Lead button — hidden on mobile */}
            <Button
              onClick={() => setAddLeadOpen(true)}
              className="hidden gap-1.5 sm:inline-flex"
              style={{
                background: 'var(--admin-primary)',
                color: 'var(--admin-primary-foreground, #FFFFFF)',
              }}
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>

            {/* Mobile: small icon button */}
            <Button
              onClick={() => setAddLeadOpen(true)}
              size="icon"
              className="sm:hidden"
              style={{
                background: 'var(--admin-primary)',
                color: 'var(--admin-primary-foreground, #FFFFFF)',
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* PreO character + speech bubble */}
            <PreOCharacter />
          </div>
        </div>

        {/* ── Module card grid with stagger entrance ── */}
        <StaggerContainer className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-5">
          {CRM_MODULES.map((mod) => (
            <StaggerItem key={mod.key}>
              <CrmModuleCard module={mod} stats={stats} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* ── Add Lead Dialog ── */}
      <AddLeadDialog
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        onLeadCreated={handleLeadCreated}
      />
    </PageTransition>
  );
}
