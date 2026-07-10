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
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { AddLeadDialog } from '@/components/add-lead-dialog';
import {
  WarmPremium,
  WarmCard,
  WarmCardHeader,
  WarmCardTitle,
  WarmCardDescription,
  WarmCardContent,
  WarmStatCard,
  WarmEmptyState,
  WarmSectionHeading,
  WarmPill,
  WarmStagePill,
  WarmButton,
  WarmSeedling,
  WarmSparkle,
  WarmChildren,
  WarmScribble,
} from '@/components/warm-premium';

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

// ── CRM Module Definition (warm-tinted) ──
type WarmAccent = 'primary' | 'sage' | 'honey' | 'sky' | 'lavender' | 'rose';

interface CrmModule {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  accent: WarmAccent;
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
    accent: 'primary',
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
    accent: 'sky',
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
    accent: 'sage',
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
    accent: 'honey',
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
    accent: 'lavender',
    statLabel: 'Open Tasks',
    getStatValue: (s) => (s?.tasks?.todo ?? 0) + (s?.tasks?.inProgress ?? 0),
    imageSrc: '/icons/admin/crm/tasks.webp',
  },
];

// ── Stage Config (warm-tinted) ──
const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  VISITED: 'Visited',
  APPLIED: 'Applied',
  ENROLLED: 'Enrolled',
  LOST: 'Lost',
};

const STAGE_WARM: Record<string, { bar: string; track: string; pill: 'sky' | 'lavender' | 'honey' | 'primary' | 'sage' | 'rose' }> = {
  NEW: { bar: 'bg-[var(--warm-sky)]', track: 'bg-[var(--warm-sky-soft)]', pill: 'sky' },
  CONTACTED: { bar: 'bg-[var(--warm-lavender)]', track: 'bg-[var(--warm-lavender-soft)]', pill: 'lavender' },
  VISITED: { bar: 'bg-[var(--warm-primary)]', track: 'bg-[var(--warm-primary-soft)]', pill: 'primary' },
  APPLIED: { bar: 'bg-[var(--warm-honey)]', track: 'bg-[var(--warm-honey-soft)]', pill: 'honey' },
  ENROLLED: { bar: 'bg-[var(--warm-sage)]', track: 'bg-[var(--warm-sage-soft)]', pill: 'sage' },
  LOST: { bar: 'bg-[var(--warm-rose)]', track: 'bg-[var(--warm-rose-soft)]', pill: 'rose' },
};

// ── Helper: Get auth token ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Module Card (warm restyle) ──
function CrmModuleCard({ module, stats, loading }: { module: CrmModule; stats: StatsData | null; loading: boolean }) {
  const Icon = module.icon;
  const statValue = module.getStatValue(stats);

  const accentBgMap: Record<WarmAccent, string> = {
    primary: 'bg-[var(--warm-primary-soft)]',
    sage: 'bg-[var(--warm-sage-soft)]',
    honey: 'bg-[var(--warm-honey-soft)]',
    sky: 'bg-[var(--warm-sky-soft)]',
    lavender: 'bg-[var(--warm-lavender-soft)]',
    rose: 'bg-[var(--warm-rose-soft)]',
  };
  const accentTextMap: Record<WarmAccent, string> = {
    primary: 'text-[var(--warm-primary)]',
    sage: 'text-[var(--warm-sage)]',
    honey: 'text-[var(--warm-honey-ink)]',
    sky: 'text-[var(--warm-sky-ink)]',
    lavender: 'text-[var(--warm-lavender-ink)]',
    rose: 'text-[var(--warm-rose-ink)]',
  };

  return (
    <Link href={module.href} className="block group h-full">
      <div
        className={`relative flex flex-col items-center rounded-[var(--warm-radius-xl)] overflow-hidden h-full min-h-[320px] sm:min-h-[380px] transition-all duration-300 ease-out border border-[var(--warm-border)] group-hover:-translate-y-1 group-hover:shadow-[var(--warm-shadow-lg)] ${accentBgMap[module.accent]}`}
      >
        {/* Decorative blob */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/40 blur-2xl opacity-60" />

        {/* Icon badge */}
        <div className="relative pt-5 sm:pt-6 pb-2 flex flex-col items-center">
          <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center bg-white shadow-[var(--warm-shadow-sm)] ${accentTextMap[module.accent]}`}>
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
          </div>
        </div>

        {/* Stat number */}
        <div className="relative flex flex-col items-center px-3 sm:px-4 pb-2">
          <span className={`warm-numeric warm-heading text-3xl sm:text-4xl font-semibold leading-none ${accentTextMap[module.accent]}`}>
            {loading ? '—' : statValue}
          </span>
          <span className="text-[11px] sm:text-xs font-medium text-[var(--warm-ink-muted)] mt-1.5 tracking-wide uppercase">
            {module.statLabel}
          </span>
        </div>

        {/* Illustration */}
        <div className="relative flex-1 w-full flex items-end justify-center overflow-hidden">
          <div className="relative w-[85%] sm:w-[90%] h-full max-h-[180px] sm:max-h-[240px]">
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

        {/* Footer */}
        <div className="relative w-full px-4 pt-3 pb-4 flex items-center justify-between bg-white/60 backdrop-blur-sm">
          <div className="min-w-0">
            <h3 className={`warm-heading font-semibold text-sm ${accentTextMap[module.accent]}`}>
              {module.title}
            </h3>
            <p className="text-[11px] text-[var(--warm-ink-muted)] mt-0.5 leading-snug truncate">
              {module.description}
            </p>
          </div>
          <ChevronRight
            className={`h-4 w-4 flex-shrink-0 ${accentTextMap[module.accent]} group-hover:translate-x-0.5 transition-transform`}
            strokeWidth={2.5}
          />
        </div>
      </div>
    </Link>
  );
}

// ── Recent Lead Row (warm restyle) ──
function RecentLeadRow({ lead }: { lead: StatsData['recentLeads'][number] }) {
  const stageCfg = STAGE_WARM[lead.stage] || STAGE_WARM.NEW;
  const initials = lead.parentName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Link
      href={`/admin/admissions/leads/${lead.id}`}
      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--warm-bg-soft)]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0 bg-[var(--warm-bg-soft)] text-[var(--warm-ink-soft)] border border-[var(--warm-border)]">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--warm-ink)]">
          {lead.parentName}
        </div>
        <div className="truncate text-xs text-[var(--warm-ink-muted)] mt-0.5">
          {lead.childName}
        </div>
      </div>
      <WarmStagePill stage={lead.stage} />
    </Link>
  );
}

// ── Main Page Component ──
export default function CrmDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

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

  // Sparkline data — derive from pipeline stages as a friendly visual
  const pipelineSparkline = pipelineStages.map((s) => s.count);

  return (
    <PageTransition>
      <WarmPremium className="min-h-screen">
        <div className="flex flex-col gap-8 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* ── SECTION 1: HERO HEADER ── */}
          <div className="warm-fade-in">
            <WarmSectionHeading
              kicker="Admission CRM"
              title="Grow your preschool, one family at a time"
              description="Track every enquiry from first hello to first day of school. Warm relationships, organized pipeline, happier enrollments."
              accent="primary"
              scribble
              actions={
                <>
                  <WarmButton
                    variant="outline"
                    size="md"
                    leftIcon={RefreshCw}
                    onClick={() => {
                      fetchStats();
                      toast.success('Dashboard refreshed');
                    }}
                  >
                    <span className="hidden sm:inline">Refresh</span>
                  </WarmButton>
                  <WarmButton
                    variant="primary"
                    size="md"
                    leftIcon={Plus}
                    onClick={() => setAddLeadOpen(true)}
                  >
                    Add Lead
                  </WarmButton>
                </>
              }
            />
          </div>

          {/* ── SECTION 2: HERO STAT BENTO GRID ── */}
          {/* Bento layout: first card spans 2 cols on lg, others single */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 warm-fade-in" style={{ animationDelay: '60ms' }}>
            <div className="sm:col-span-2 lg:col-span-2">
              <WarmStatCard
                label="Total Leads"
                value={stats?.totalLeads ?? 0}
                delta={stats?.newThisWeek ? Math.round((stats.newThisWeek / Math.max(stats.totalLeads - stats.newThisWeek, 1)) * 100) : undefined}
                caption={`${stats?.newThisWeek ?? 0} new this week`}
                accent="primary"
                icon={Users}
                sparkline={pipelineSparkline.length >= 2 ? pipelineSparkline : undefined}
                disableAnimation={loading}
              />
            </div>
            <WarmStatCard
              label="Conversion Rate"
              value={stats?.conversionRate ?? 0}
              suffix="%"
              accent="sage"
              icon={TrendingUp}
              caption="Leads → Enrollments"
              disableAnimation={loading}
            />
            <WarmStatCard
              label="Follow-ups Due"
              value={stats?.followUpsToday ?? 0}
              accent="honey"
              icon={PhoneCall}
              caption={`${stats?.overdueFollowUps ?? 0} overdue`}
              disableAnimation={loading}
            />
            <WarmStatCard
              label="New This Week"
              value={stats?.newThisWeek ?? 0}
              accent="sky"
              icon={Sparkles}
              caption="Fresh enquiries"
              disableAnimation={loading}
            />
            <WarmStatCard
              label="Est. Revenue"
              value={stats?.estimatedRevenue ?? 0}
              prefix="₹"
              accent="lavender"
              icon={IndianRupee}
              caption="From active pipeline"
              disableAnimation={loading}
            />
            <div className="sm:col-span-2 lg:col-span-2">
              <WarmStatCard
                label="Open Tasks"
                value={(stats?.tasks?.todo ?? 0) + (stats?.tasks?.inProgress ?? 0)}
                accent="rose"
                icon={CheckSquare}
                caption={`${stats?.tasks?.overdue ?? 0} overdue · ${stats?.tasks?.done ?? 0} done`}
                disableAnimation={loading}
              />
            </div>
          </div>

          {/* ── SECTION 3: CRM MODULE CARDS GRID ── */}
          <div className="warm-fade-in" style={{ animationDelay: '120ms' }}>
            <WarmSectionHeading
              kicker="Modules"
              title="Your admission toolkit"
              description="Five focused workspaces, each designed to move families forward with warmth."
              accent="honey"
              className="mb-5"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {CRM_MODULES.map((mod) => (
                <CrmModuleCard key={mod.key} module={mod} stats={loading ? null : stats} loading={loading} />
              ))}
            </div>
          </div>



          {/* ── SECTION 5: OVERDUE/ALERTS (conditional, warm restyle) ── */}
          {!loading && stats && (stats.overdueFollowUps > 0 || stats.tasks.overdue > 0) && (
            <WarmCard accent="rose" fade className="overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--warm-radius-md)] bg-[var(--warm-rose-soft)] flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-[var(--warm-rose-ink)]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="warm-heading text-base font-semibold text-[var(--warm-ink)]">
                    Attention needed
                  </h3>
                  <p className="text-sm text-[var(--warm-ink-muted)] mt-0.5">
                    {stats.overdueFollowUps > 0 &&
                      `${stats.overdueFollowUps} follow-up${stats.overdueFollowUps !== 1 ? 's' : ''} overdue`}
                    {stats.overdueFollowUps > 0 && stats.tasks.overdue > 0 && ' · '}
                    {stats.tasks.overdue > 0 &&
                      `${stats.tasks.overdue} task${stats.tasks.overdue !== 1 ? 's' : ''} overdue`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {stats.overdueFollowUps > 0 && (
                    <Link href="/admin/admissions/followups">
                      <WarmButton variant="soft" size="sm" leftIcon={PhoneCall}>
                        Review Follow-ups
                      </WarmButton>
                    </Link>
                  )}
                  {stats.tasks.overdue > 0 && (
                    <Link href="/admin/admissions/tasks">
                      <WarmButton variant="soft" size="sm" leftIcon={CheckSquare}>
                        Review Tasks
                      </WarmButton>
                    </Link>
                  )}
                </div>
              </div>
            </WarmCard>
          )}

          {/* ── SECTION 6: ENCOURAGEMENT (when no overdue) ── */}
          {!loading && stats && stats.overdueFollowUps === 0 && stats.tasks.overdue === 0 && (stats.totalLeads ?? 0) > 0 && (
            <WarmCard accent="sage" fade className="overflow-hidden">
              <div className="p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--warm-radius-md)] bg-[var(--warm-sage-soft)] flex-shrink-0">
                  <WarmSparkle className="h-6 w-6 text-[var(--warm-sage)]" strokeWidth={1.6} />
                </div>
                <div className="flex-1">
                  <h3 className="warm-heading text-base font-semibold text-[var(--warm-ink)]">
                    You're all caught up
                  </h3>
                  <p className="text-sm text-[var(--warm-ink-muted)] mt-0.5">
                    No overdue follow-ups or tasks. Take a breath — every family is being nurtured. 🌱
                  </p>
                </div>
              </div>
            </WarmCard>
          )}
        </div>
      </WarmPremium>

      <AddLeadDialog
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        onLeadCreated={handleLeadCreated}
      />
    </PageTransition>
  );
}
