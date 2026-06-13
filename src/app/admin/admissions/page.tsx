'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  PhoneCall,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  Plus,
  LayoutGrid,
  CheckSquare,
  ChevronRight,
  RefreshCw,
  Clock,
  Baby,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { AnimatedCard } from '@/components/ui/animated-card';
import { CRM_COLORS, PORTAL_THEMES } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';
import { AddLeadDialog } from '@/components/add-lead-dialog';
import { LeadDetailDrawer } from '@/components/lead-detail-drawer';

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

// ── Stage Config using CRM_COLORS ──
const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: CRM_COLORS.NEW?.hex ?? '#3b82f6' },
  CONTACTED: { label: 'Contacted', color: CRM_COLORS.CONTACTED?.hex ?? '#8b5cf6' },
  VISITED: { label: 'Visited', color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#f59e0b' },
  APPLIED: { label: 'Applied', color: CRM_COLORS.APPLICATION?.hex ?? '#f97316' },
  ENROLLED: { label: 'Enrolled', color: CRM_COLORS.ENROLLED?.hex ?? '#10b981' },
  LOST: { label: 'Lost', color: CRM_COLORS.LOST?.hex ?? '#9ca3af' },
};

// ── Ordered stages for the pipeline bar ──
const PIPELINE_STAGES = ['NEW', 'CONTACTED', 'VISITED', 'APPLIED', 'ENROLLED', 'LOST'] as const;

// ── Source labels ──
const SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  GOOGLE: 'Google',
  WALK_IN: 'Walk-in',
  REFERRAL: 'Referral',
  WEBSITE: 'Website',
  JUSTDIAL: 'JustDial',
  SULEKHA: 'Sulekha',
  NEWSPAPER: 'Newspaper',
  HOARDING: 'Hoarding',
  EVENT: 'Event',
  OTHER: 'Other',
};

// ── Helper: Get auth token ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Skeleton loader component ──
function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
}

function PipelineBarSkeleton() {
  return (
    <Card className="p-4">
      <div className="h-8 w-full bg-gray-100 rounded-full animate-pulse" />
    </Card>
  );
}

function RecentLeadsSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
        ))}
      </div>
    </Card>
  );
}

// ── Main Page Component ──
export default function CrmDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  // Lead detail drawer
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<StatsData['recentLeads'][number] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Fetch stats data ──
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError(err instanceof Error ? err.message : 'Something went wrong');
      toast.error('Failed to load CRM dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Handle lead click ──
  const handleLeadClick = (lead: StatsData['recentLeads'][number]) => {
    setSelectedLead(lead);
    setSelectedLeadId(lead.id);
    setDrawerOpen(true);
  };

  // ── Handle lead created ──
  const handleLeadCreated = () => {
    setAddLeadOpen(false);
    fetchStats();
    toast.success('Lead created successfully');
  };

  // ── Handle lead updated from drawer ──
  const handleLeadUpdated = () => {
    fetchStats();
    setDrawerOpen(false);
    toast.success('Lead updated successfully');
  };

  // ── Pipeline bar data ──
  const pipelineData = React.useMemo(() => {
    if (!stats) return [];
    const stageMap = new Map(stats.leadsByStage.map((s) => [s.stage, s.count]));
    return PIPELINE_STAGES.map((stage) => ({
      stage,
      count: stageMap.get(stage) || 0,
      config: STAGE_CONFIG[stage],
    }));
  }, [stats]);

  const totalPipelineLeads = React.useMemo(
    () => pipelineData.reduce((sum, s) => sum + s.count, 0),
    [pipelineData]
  );

  // ── Format currency ──
  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-portal-600">Admission CRM</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track leads, manage follow-ups, and grow enrollments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchStats(); toast.success('Dashboard refreshed'); }}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              onClick={() => setAddLeadOpen(true)}
              className="gap-1.5 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* ── Overdue Follow-ups Alert ── */}
        {!loading && stats && stats.overdueFollowUps > 0 && (
          <AnimatedCard delay={0} hover={false}>
            <div className="p-4 flex items-center gap-3 rounded-xl border-l-4 border-red-500 bg-red-50">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800">
                  {stats.overdueFollowUps} Overdue Follow-up{stats.overdueFollowUps > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  These leads need immediate attention. Follow up now to keep your pipeline healthy.
                </p>
              </div>
              <Link href="/admin/admissions/followups">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 flex-shrink-0"
                >
                  View All
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </AnimatedCard>
        )}

        {/* ── Stat Cards (2x2 on mobile, 4-col on desktop) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              {/* Total Leads */}
              <AnimatedCard delay={0.05}>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-gray-900 leading-tight">
                        {stats?.totalLeads ?? 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Total Leads</p>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              {/* New This Week */}
              <AnimatedCard delay={0.1}>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-blue-600 leading-tight">
                        {stats?.newThisWeek ?? 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">New This Week</p>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              {/* Follow-ups Today */}
              <AnimatedCard delay={0.15}>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <PhoneCall className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-amber-600 leading-tight">
                        {stats?.followUpsToday ?? 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Follow-ups Today</p>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              {/* Conversion Rate */}
              <AnimatedCard delay={0.2}>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-emerald-600 leading-tight">
                        {stats?.conversionRate ?? 0}%
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Conversion Rate</p>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </>
          )}
        </div>

        {/* ── Pipeline Overview + Revenue (side by side on desktop) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pipeline Overview Bar */}
          <div className="lg:col-span-2">
            {loading ? (
              <PipelineBarSkeleton />
            ) : (
              <AnimatedCard delay={0.25}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Pipeline Overview
                    </CardTitle>
                    <Link href="/admin/admissions/pipeline">
                      <Button variant="ghost" size="sm" className="gap-1 text-portal-600 hover:text-portal-700 text-xs">
                        View Pipeline
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {totalPipelineLeads === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      No leads in the pipeline yet
                    </div>
                  ) : (
                    <>
                      {/* Horizontal stacked bar */}
                      <div className="flex h-10 rounded-full overflow-hidden shadow-inner bg-gray-100">
                        {pipelineData.map((segment) => {
                          if (segment.count === 0) return null;
                          const width = (segment.count / totalPipelineLeads) * 100;
                          return (
                            <div
                              key={segment.stage}
                              className="relative group transition-all duration-300 hover:brightness-110"
                              style={{
                                width: `${width}%`,
                                backgroundColor: segment.config.color,
                                minWidth: width > 0 ? '20px' : '0',
                              }}
                              title={`${segment.config.label}: ${segment.count} (${width.toFixed(1)}%)`}
                            >
                              {/* Tooltip on hover */}
                              {width >= 8 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[11px] font-bold text-white drop-shadow-sm">
                                    {segment.count}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                        {pipelineData.map((segment) => (
                          <div key={segment.stage} className="flex items-center gap-1.5">
                            <div
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: segment.config.color }}
                            />
                            <span className="text-xs text-gray-600">
                              {segment.config.label}
                            </span>
                            <span className="text-xs font-medium text-gray-900">
                              {segment.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </AnimatedCard>
            )}
          </div>

          {/* Revenue Estimate Card */}
          <div>
            {loading ? (
              <AnimatedCard delay={0.3}>
                <Card className="p-4">
                  <div className="h-28 bg-gray-50 rounded-lg animate-pulse" />
                </Card>
              </AnimatedCard>
            ) : (
              <AnimatedCard delay={0.3}>
                <Card className="overflow-hidden">
                  <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <IndianRupee className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-700 font-medium">Estimated Revenue</p>
                        <p className="text-2xl font-bold text-emerald-800 leading-tight">
                          {formatCurrency(stats?.estimatedRevenue ?? 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>From {stats?.leadsByStage.find(s => s.stage === 'ENROLLED')?.count ?? 0} enrolled leads</span>
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-emerald-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Active pipeline value</span>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(
                          (stats?.leadsByStage ?? [])
                            .filter(s => !['ENROLLED', 'LOST'].includes(s.stage))
                            .reduce((sum, s) => sum + s.count, 0) > 0
                            ? stats?.estimatedRevenue ?? 0
                            : 0
                        )}
                      </span>
                    </div>
                  </div>
                </Card>
              </AnimatedCard>
            )}
          </div>
        </div>

        {/* ── Recent Leads + Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Leads List */}
          <div className="lg:col-span-2">
            {loading ? (
              <RecentLeadsSkeleton />
            ) : (
              <AnimatedCard delay={0.35}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Recent Leads
                    </CardTitle>
                    <Link href="/admin/admissions/leads">
                      <Button variant="ghost" size="sm" className="gap-1 text-portal-600 hover:text-portal-700 text-xs">
                        View All
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {!stats?.recentLeads || stats.recentLeads.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      No leads yet. Click &quot;Add Lead&quot; to create your first lead.
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                      {stats.recentLeads.map((lead) => {
                        const stageCfg = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.NEW;
                        return (
                          <Link
                            key={lead.id}
                            href={`/admin/admissions/leads/${lead.id}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            {/* Avatar */}
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: stageCfg.color + '18',
                                color: stageCfg.color,
                              }}
                            >
                              {lead.parentName?.charAt(0)?.toUpperCase() || '?'}
                            </div>

                            {/* Lead info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {lead.parentName}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                                  <Baby className="h-3 w-3" />
                                  {lead.childName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500">
                                  {SOURCE_LABELS[lead.source] || lead.source}
                                </span>
                                {lead.nextFollowUp && (
                                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    {new Date(lead.nextFollowUp).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Stage badge */}
                            <Badge
                              variant="outline"
                              className="text-[11px] font-medium flex-shrink-0 border-0"
                              style={{
                                backgroundColor: stageCfg.color + '15',
                                color: stageCfg.color,
                              }}
                            >
                              {stageCfg.label}
                            </Badge>

                            {/* Arrow */}
                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </AnimatedCard>
            )}
          </div>

          {/* Quick Actions + Task Summary */}
          <div className="space-y-4">
            {/* Quick Action Buttons */}
            <AnimatedCard delay={0.4}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Button
                    onClick={() => setAddLeadOpen(true)}
                    className="w-full justify-start gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                  >
                    <Plus className="h-4 w-4" />
                    Add Lead
                  </Button>
                  <Link href="/admin/admissions/pipeline" className="block">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 hover:border-portal-300 hover:text-portal-700"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Go to Pipeline
                    </Button>
                  </Link>
                  <Link href="/admin/admissions/tasks" className="block">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 hover:border-portal-300 hover:text-portal-700"
                    >
                      <CheckSquare className="h-4 w-4" />
                      View Tasks
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Task Summary */}
            {!loading && stats?.tasks && (
              <AnimatedCard delay={0.45}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Tasks
                    </CardTitle>
                    <Link href="/admin/admissions/tasks">
                      <Button variant="ghost" size="sm" className="gap-1 text-portal-600 hover:text-portal-700 text-xs">
                        View All
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2.5">
                    {/* Task progress bar */}
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
                      {stats.tasks.done > 0 && (
                        <div
                          className="bg-emerald-500 transition-all duration-500"
                          style={{ width: `${(stats.tasks.done / stats.tasks.total) * 100}%` }}
                        />
                      )}
                      {stats.tasks.inProgress > 0 && (
                        <div
                          className="bg-blue-500 transition-all duration-500"
                          style={{ width: `${(stats.tasks.inProgress / stats.tasks.total) * 100}%` }}
                        />
                      )}
                      {stats.tasks.todo > 0 && (
                        <div
                          className="bg-amber-400 transition-all duration-500"
                          style={{ width: `${(stats.tasks.todo / stats.tasks.total) * 100}%` }}
                        />
                      )}
                    </div>

                    {/* Task counts */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-gray-500">To Do</span>
                        <span className="font-medium text-gray-900 ml-auto">{stats.tasks.todo}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-gray-500">In Progress</span>
                        <span className="font-medium text-gray-900 ml-auto">{stats.tasks.inProgress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-gray-500">Done</span>
                        <span className="font-medium text-gray-900 ml-auto">{stats.tasks.done}</span>
                      </div>
                      {stats.tasks.overdue > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="text-red-600 font-medium">Overdue</span>
                          <span className="font-bold text-red-600 ml-auto">{stats.tasks.overdue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            )}
          </div>
        </div>

        {/* ── Error State ── */}
        {!loading && error && (
          <AnimatedCard delay={0.5}>
            <div className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600 font-medium">Failed to load dashboard data</p>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={fetchStats}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          </AnimatedCard>
        )}
      </div>

      {/* ── Add Lead Dialog ── */}
      <AddLeadDialog
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        onLeadCreated={handleLeadCreated}
      />

      {/* ── Lead Detail Drawer ── */}
      <LeadDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        lead={selectedLead ? {
          id: selectedLead.id,
          parentName: selectedLead.parentName,
          parentPhone: '',
          parentEmail: null,
          childName: selectedLead.childName,
          childAge: null,
          source: selectedLead.source,
          stage: selectedLead.stage,
          priority: selectedLead.priority,
          programInterest: null,
          estimatedValue: selectedLead.estimatedValue,
          assignedTo: null,
          notes: null,
          nextFollowUp: selectedLead.nextFollowUp,
          convertedStudentId: null,
          lostReason: null,
          createdAt: selectedLead.createdAt,
          updatedAt: selectedLead.createdAt,
          followUps: [],
        } : null}
        onLeadUpdated={handleLeadUpdated}
      />
    </PageTransition>
  );
}
