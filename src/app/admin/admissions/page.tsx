'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  PhoneCall,
  LayoutGrid,
  CalendarCheck,
  CheckSquare,
  Plus,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  IndianRupee,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { AddLeadDialog } from '@/components/add-lead-dialog';

// ── Types ──
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

// ── CRM Module Definition ──
interface CrmModule {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  /** CSS variable for the accent color, e.g. '--admin-primary' */
  accentVar: string;
  /** CSS variable for the soft/background color, e.g. '--admin-primary-soft' */
  accentSoftVar: string;
  /** Fallback hex for accent */
  accentHex: string;
  /** Fallback hex for soft bg */
  accentSoftHex: string;
  statLabel: string;
  getStatValue: (stats: StatsData | null) => number;
  imageSrc: string;
}

const CRM_MODULES: CrmModule[] = [
  {
    key: 'leads',
    title: 'Leads',
    description: 'Manage all admission leads and enquiries',
    href: '/admin/admissions/leads',
    icon: Users,
    accentVar: '--admin-primary',
    accentSoftVar: '--admin-primary-soft',
    accentHex: '#7C3AED',
    accentSoftHex: '#f5f3ff',
    statLabel: 'Total Leads',
    getStatValue: (s) => s?.totalLeads ?? 0,
    imageSrc: '/icons/admin/crm/leads.webp',
  },
  {
    key: 'pipeline',
    title: 'Pipeline',
    description: 'Visualize your admission pipeline stages',
    href: '/admin/admissions/pipeline',
    icon: LayoutGrid,
    accentVar: '--admin-info',
    accentSoftVar: '--admin-info-soft',
    accentHex: '#3b82f6',
    accentSoftHex: '#eff6ff',
    statLabel: 'In Pipeline',
    getStatValue: (s) =>
      (s?.leadsByStage ?? [])
        .filter((ls) => !['ENROLLED', 'LOST'].includes(ls.stage))
        .reduce((sum, ls) => sum + ls.count, 0),
    imageSrc: '/icons/admin/crm/pipeline.webp',
  },
  {
    key: 'followups',
    title: 'Follow Ups',
    description: 'Track follow-ups and scheduled calls',
    href: '/admin/admissions/followups',
    icon: PhoneCall,
    accentVar: '--admin-success',
    accentSoftVar: '--admin-success-soft',
    accentHex: '#10b981',
    accentSoftHex: '#ecfdf5',
    statLabel: 'Due Today',
    getStatValue: (s) => s?.followUpsToday ?? 0,
    imageSrc: '/icons/admin/crm/followups.webp',
  },
  {
    key: 'visits',
    title: 'Visits',
    description: 'Schedule and manage campus visits',
    href: '/admin/admissions/visits',
    icon: CalendarCheck,
    accentVar: '--admin-warning',
    accentSoftVar: '--admin-warning-soft',
    accentHex: '#f59e0b',
    accentSoftHex: '#fffbeb',
    statLabel: 'Visits',
    getStatValue: (s) =>
      (s?.leadsByStage ?? []).find((ls) => ls.stage === 'VISITED')?.count ?? 0,
    imageSrc: '/icons/admin/crm/visits.webp',
  },
  {
    key: 'tasks',
    title: 'CRM Tasks',
    description: 'Manage your tasks and to-dos',
    href: '/admin/admissions/tasks',
    icon: CheckSquare,
    accentVar: '--admin-accent',
    accentSoftVar: '--admin-warning-soft',
    accentHex: '#f97316',
    accentSoftHex: '#fff7ed',
    statLabel: 'Open Tasks',
    getStatValue: (s) => (s?.tasks?.todo ?? 0) + (s?.tasks?.inProgress ?? 0),
    imageSrc: '/icons/admin/crm/tasks.webp',
  },
];

// ── KPI Card Config ──
interface KpiCard {
  key: string;
  label: string;
  icon: React.ElementType;
  accentVar: string;
  accentSoftVar: string;
  getValue: (s: StatsData | null) => string | number;
  sublabel?: (s: StatsData | null) => string;
}

const KPI_CARDS: KpiCard[] = [
  {
    key: 'conversion',
    label: 'Conversion Rate',
    icon: TrendingUp,
    accentVar: '--admin-success',
    accentSoftVar: '--admin-success-soft',
    getValue: (s) => (s?.conversionRate != null ? `${s.conversionRate.toFixed(1)}%` : '0.0%'),
    sublabel: (s) => `${s?.totalLeads ?? 0} total leads`,
  },
  {
    key: 'newWeek',
    label: 'New This Week',
    icon: Users,
    accentVar: '--admin-primary',
    accentSoftVar: '--admin-primary-soft',
    getValue: (s) => s?.newThisWeek ?? 0,
    sublabel: () => 'Fresh enquiries',
  },
  {
    key: 'followToday',
    label: 'Follow-ups Today',
    icon: Clock,
    accentVar: '--admin-info',
    accentSoftVar: '--admin-info-soft',
    getValue: (s) => s?.followUpsToday ?? 0,
    sublabel: (s) => `${s?.overdueFollowUps ?? 0} overdue`,
  },
  {
    key: 'revenue',
    label: 'Est. Revenue',
    icon: IndianRupee,
    accentVar: '--admin-warning',
    accentSoftVar: '--admin-warning-soft',
    getValue: (s) =>
      s?.estimatedRevenue != null
        ? `${s.estimatedRevenue.toLocaleString('en-IN')}`
        : '0',
    sublabel: () => 'From active pipeline',
  },
];

// ── Stage Config ──
const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  VISITED: 'Visited',
  APPLIED: 'Applied',
  ENROLLED: 'Enrolled',
  LOST: 'Lost',
};

const STAGE_COLORS: Record<string, { color: string; bg: string }> = {
  NEW: { color: 'var(--admin-text-muted)', bg: 'var(--admin-surface-2)' },
  CONTACTED: { color: 'var(--admin-info)', bg: 'var(--admin-info-soft)' },
  VISITED: { color: 'var(--admin-primary)', bg: 'var(--admin-primary-soft)' },
  APPLIED: { color: 'var(--admin-warning)', bg: 'var(--admin-warning-soft)' },
  ENROLLED: { color: 'var(--admin-success)', bg: 'var(--admin-success-soft)' },
  LOST: { color: 'var(--admin-error)', bg: 'rgba(239,68,68,0.1)' },
};

// ── Helper: Get auth token ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Module Card Component ──
function CrmModuleCard({ module, stats }: { module: CrmModule; stats: StatsData | null }) {
  const Icon = module.icon;
  const statValue = module.getStatValue(stats);

  return (
    <Link href={module.href} className="block group h-full">
      <div
        className="relative flex flex-col items-center rounded-2xl overflow-hidden h-full min-h-[340px] sm:min-h-[400px] transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1 border border-black/5"
        style={{ backgroundColor: `var(${module.accentSoftVar}, ${module.accentSoftHex})` }}
      >
        {/* Top accent circle with icon */}
        <div className="pt-4 sm:pt-6 pb-2 flex flex-col items-center">
          <div
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: 'white',
              color: `var(${module.accentVar}, ${module.accentHex})`,
            }}
          >
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        </div>

        {/* Stat number */}
        <div className="flex flex-col items-center px-3 sm:px-4 pb-2">
          <span
            className="text-2xl sm:text-3xl font-bold leading-tight tabular-nums"
            style={{ color: `var(${module.accentVar}, ${module.accentHex})` }}
          >
            {statValue}
          </span>
          <span className="text-[11px] sm:text-xs font-medium text-[var(--admin-text-muted)] mt-0.5">
            {module.statLabel}
          </span>
        </div>

        {/* Illustration area — always visible, compact on mobile */}
        <div className="flex-1 w-full relative flex items-end justify-center overflow-hidden">
          <div className="relative w-[85%] sm:w-[90%] h-full max-h-[200px] sm:max-h-[260px]">
            <Image
              src={module.imageSrc}
              alt={module.title}
              fill
              className="object-contain object-bottom"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Bottom: title + description + arrow */}
        <div className="w-full px-3 sm:px-4 pt-2 sm:pt-3 pb-3 sm:pb-4 flex items-center justify-between">
          <div className="min-w-0">
            <h3
              className="font-semibold text-[13px] sm:text-sm"
              style={{ color: `var(${module.accentVar}, ${module.accentHex})` }}
            >
              {module.title}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-[var(--admin-text-muted)] mt-0.5 leading-snug truncate">
              {module.description}
            </p>
          </div>
          <ChevronRight
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-[var(--admin-text-subtle)] group-hover:translate-x-0.5 transition-transform"
            style={{ color: `var(${module.accentVar}, ${module.accentHex})` }}
          />
        </div>
      </div>
    </Link>
  );
}

// ── KPI Stat Card ──
function KpiStatCard({ card, stats }: { card: KpiCard; stats: StatsData | null }) {
  const Icon = card.icon;
  return (
    <PreOneCard className="!rounded-xl">
      <div className="p-4 flex items-center gap-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: `var(${card.accentSoftVar})` }}
        >
          <Icon className="h-5 w-5" style={{ color: `var(${card.accentVar})` }} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-xs font-medium"
            style={{ color: 'var(--admin-text-muted)' }}
          >
            {card.label}
          </div>
          <div
            className="text-xl font-bold tabular-nums"
            style={{ color: 'var(--admin-text)' }}
          >
            {card.getValue(stats)}
          </div>
          {card.sublabel && (
            <div
              className="text-[11px] mt-0.5"
              style={{ color: 'var(--admin-text-subtle)' }}
            >
              {card.sublabel(stats)}
            </div>
          )}
        </div>
      </div>
    </PreOneCard>
  );
}

// ── Recent Lead Row ──
function RecentLeadRow({ lead }: { lead: StatsData['recentLeads'][number] }) {
  const stageCfg = STAGE_COLORS[lead.stage] || STAGE_COLORS.NEW;
  const initials = lead.parentName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Link
      href={`/admin/admissions/leads/${lead.id}`}
      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--admin-surface-2)]"
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
        style={{
          background: stageCfg.bg,
          color: stageCfg.color,
        }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-sm font-medium"
          style={{ color: 'var(--admin-text)' }}
        >
          {lead.parentName}
        </div>
        <div
          className="truncate text-xs"
          style={{ color: 'var(--admin-text-subtle)' }}
        >
          {lead.childName}
        </div>
      </div>
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0"
        style={{ background: stageCfg.bg, color: stageCfg.color }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: stageCfg.color }}
        />
        {STAGE_LABELS[lead.stage] || lead.stage}
      </span>
    </Link>
  );
}

// ── Main Page Component ──
export default function CrmDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  // ── Fetch stats data ──
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
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
      toast.error('Failed to load CRM dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Handle lead created ──
  const handleLeadCreated = () => {
    setAddLeadOpen(false);
    fetchStats();
    toast.success('Lead created successfully');
  };

  const recentLeads = stats?.recentLeads ?? [];
  const pipelineStages = (stats?.leadsByStage ?? []).filter(
    (s) => !['LOST'].includes(s.stage),
  );
  const totalInPipeline = pipelineStages.reduce((sum, s) => sum + s.count, 0);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
        {/* ── SECTION 1: HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Side: Icon Badge + Title */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--admin-primary-soft)' }}
            >
              <Users className="h-5 w-5" style={{ color: 'var(--admin-primary)' }} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--admin-text)' }}
              >
                Admission CRM
              </h1>
              <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                Track leads, manage follow-ups, and grow enrollments
              </p>
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                fetchStats();
                toast.success('Dashboard refreshed');
              }}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
              onClick={() => setAddLeadOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Lead</span>
            </Button>
          </div>
        </div>

        {/* ── SECTION 2: KPI STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map((card) => (
            <KpiStatCard key={card.key} card={card} stats={loading ? null : stats} />
          ))}
        </div>

        {/* ── SECTION 3: CRM MODULE CARDS GRID ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              CRM Modules
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {CRM_MODULES.map((mod) => (
              <CrmModuleCard key={mod.key} module={mod} stats={loading ? null : stats} />
            ))}
          </div>
        </div>

        {/* ── SECTION 4: PIPELINE BREAKDOWN + RECENT ACTIVITY ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pipeline Funnel */}
          <PreOneCard className="lg:col-span-2 !rounded-xl">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity
                    className="h-4 w-4"
                    style={{ color: 'var(--admin-text-muted)' }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: 'var(--admin-text)' }}
                  >
                    Pipeline Breakdown
                  </h3>
                </div>
                <Link
                  href="/admin/admissions/pipeline"
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--admin-primary)' }}
                >
                  View Pipeline →
                </Link>
              </div>

              {loading ? (
                <div
                  className="flex items-center justify-center py-10 text-sm"
                  style={{ color: 'var(--admin-text-subtle)' }}
                >
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading pipeline...
                </div>
              ) : totalInPipeline === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <LayoutGrid
                    className="h-8 w-8 mb-2 opacity-40"
                    style={{ color: 'var(--admin-text-muted)' }}
                  />
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    No leads in pipeline yet
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--admin-text-subtle)' }}
                  >
                    Add your first lead to see the breakdown.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pipelineStages.map((stage) => {
                    const cfg = STAGE_COLORS[stage.stage] || STAGE_COLORS.NEW;
                    const pct =
                      totalInPipeline > 0
                        ? Math.round((stage.count / totalInPipeline) * 100)
                        : 0;
                    return (
                      <div key={stage.stage} className="flex items-center gap-3">
                        <div
                          className="w-20 text-xs font-medium flex-shrink-0"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          {STAGE_LABELS[stage.stage] || stage.stage}
                        </div>
                        <div
                          className="flex-1 h-7 rounded-md overflow-hidden relative"
                          style={{ background: 'var(--admin-surface-2)' }}
                        >
                          <div
                            className="h-full rounded-md transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: cfg.color,
                              minWidth: pct > 0 ? '8px' : '0',
                            }}
                          />
                          <div
                            className="absolute inset-0 flex items-center justify-between px-2 text-[11px] font-medium"
                            style={{ color: 'var(--admin-text)' }}
                          >
                            <span />
                            <span className="tabular-nums">
                              {stage.count} · {pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </PreOneCard>

          {/* Recent Activity */}
          <PreOneCard className="!rounded-xl overflow-hidden">
            <div className="border-b px-5 py-3" style={{ borderColor: 'var(--admin-border)' }}>
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--admin-text)' }}
              >
                Recent Leads
              </h3>
            </div>
            {loading ? (
              <div
                className="flex items-center justify-center py-10 text-sm"
                style={{ color: 'var(--admin-text-subtle)' }}
              >
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : recentLeads.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <Users
                  className="h-8 w-8 mb-2 opacity-40"
                  style={{ color: 'var(--admin-text-muted)' }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  No recent leads
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--admin-text-subtle)' }}
                >
                  New leads will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
                {recentLeads.slice(0, 6).map((lead) => (
                  <RecentLeadRow key={lead.id} lead={lead} />
                ))}
              </div>
            )}
            <div
              className="border-t px-5 py-2.5 text-center"
              style={{ borderColor: 'var(--admin-border)' }}
            >
              <Link
                href="/admin/admissions/leads"
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--admin-primary)' }}
              >
                View All Leads →
              </Link>
            </div>
          </PreOneCard>
        </div>

        {/* ── SECTION 5: OVERDUE/ALERTS (conditional) ── */}
        {!loading && stats && (stats.overdueFollowUps > 0 || stats.tasks.overdue > 0) && (
          <PreOneCard className="!rounded-xl">
            <div
              className="p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.05)' }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)' }}
              >
                <AlertTriangle
                  className="h-5 w-5"
                  style={{ color: 'var(--admin-error)' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold"
                  style={{ color: 'var(--admin-text)' }}
                >
                  Attention needed
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  {stats.overdueFollowUps > 0 &&
                    `${stats.overdueFollowUps} follow-up${stats.overdueFollowUps !== 1 ? 's' : ''} overdue`}
                  {stats.overdueFollowUps > 0 && stats.tasks.overdue > 0 && ' · '}
                  {stats.tasks.overdue > 0 &&
                    `${stats.tasks.overdue} task${stats.tasks.overdue !== 1 ? 's' : ''} overdue`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stats.overdueFollowUps > 0 && (
                  <Link href="/admin/admissions/followups">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      style={{ color: 'var(--admin-error)', borderColor: 'var(--admin-error)' }}
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      Review Follow-ups
                    </Button>
                  </Link>
                )}
                {stats.tasks.overdue > 0 && (
                  <Link href="/admin/admissions/tasks">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      style={{ color: 'var(--admin-error)', borderColor: 'var(--admin-error)' }}
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      Review Tasks
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </PreOneCard>
        )}
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
