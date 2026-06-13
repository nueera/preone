'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  IndianRupee,
  UserPlus,
  Building2,
  CheckCircle,
  Phone,
  AlertTriangle,
  Calendar,
  Megaphone,
  FileText,
  BarChart3,
  ClipboardList,
  Wallet,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PORTAL_THEMES, CHART_PALETTE, FEE_COLORS } from '@/lib/theme-tokens';
import { getTimeOfDay, TIME_THEME_CONFIG } from '@/lib/theme/cosmic-theme';
import { PreOneCard } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/page-transition';

const theme = PORTAL_THEMES.admin;

// ============================================================
// TYPES
// ============================================================

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  monthlyRevenue: number;
  newAdmissions: number;
  occupancyRate: number;
  attendanceRate: number;
  trends: {
    students: number;
    teachers: number;
    revenue: number;
    admissions: number;
    occupancy: number;
    attendance: number;
  };
}

interface RevenueMonth {
  month: string;
  revenue: number;
  collections: number;
}

interface ActivityEntry {
  type: string;
  message: string;
  time: string;
  icon: string;
  color: string;
}

interface FeeSummary {
  collected: number;
  pending: number;
  overdue: number;
}

interface PipelineStage {
  name: string;
  count: number;
  value: number;
  color: string;
}

// ============================================================
// HELPERS
// ============================================================

/** Format Indian currency with L (lakh) suffix */
function formatINR(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

/** Format for Y-axis ticks */
function formatYAxis(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

/** Auth-aware fetch helper */
async function apiFetch(url: string): Promise<unknown> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('preone_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Activity type → icon mapping ──
const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  ADMISSION: UserPlus,
  PAYMENT: IndianRupee,
  LEAD: Phone,
  ATTENDANCE: AlertTriangle,
  LEAVE: Calendar,
  ANNOUNCEMENT: Megaphone,
};

const ACTIVITY_COLORS: Record<string, string> = {
  ADMISSION: 'text-emerald-500',
  PAYMENT: 'text-emerald-600',
  LEAD: `text-portal-600`,
  ATTENDANCE: 'text-red-500',
  LEAVE: 'text-orange-500',
  ANNOUNCEMENT: 'text-blue-500',
};

const ACTIVITY_BG: Record<string, string> = {
  ADMISSION: 'bg-emerald-50 dark:bg-emerald-950/40',
  PAYMENT: 'bg-emerald-50 dark:bg-emerald-950/40',
  LEAD: 'bg-portal-50 dark:bg-purple-950/40',
  ATTENDANCE: 'bg-red-50 dark:bg-red-950/40',
  LEAVE: 'bg-orange-50 dark:bg-orange-950/40',
  ANNOUNCEMENT: 'bg-blue-50 dark:bg-blue-950/40',
};

// ── Stat card config (mapped to CosmicStatCard) ──
const STAT_CARDS: {
  key: keyof DashboardStats;
  label: string;
  icon: React.ReactNode;
  color: string;
  trendKey: keyof DashboardStats['trends'];
  suffix?: string;
}[] = [
  {
    key: 'totalStudents',
    label: 'Total Students',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'bg-purple-500',
    trendKey: 'students',
  },
  {
    key: 'totalTeachers',
    label: 'Total Teachers',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-sky-500',
    trendKey: 'teachers',
  },
  {
    key: 'monthlyRevenue',
    label: 'Monthly Revenue',
    icon: <IndianRupee className="w-5 h-5" />,
    color: 'bg-emerald-500',
    trendKey: 'revenue',
    suffix: '₹',
  },
  {
    key: 'newAdmissions',
    label: 'New Admissions',
    icon: <UserPlus className="w-5 h-5" />,
    color: 'bg-pink-500',
    trendKey: 'admissions',
  },
  {
    key: 'occupancyRate',
    label: 'Occupancy Rate',
    icon: <Building2 className="w-5 h-5" />,
    color: 'bg-orange-500',
    trendKey: 'occupancy',
    suffix: '%',
  },
  {
    key: 'attendanceRate',
    label: 'Attendance Rate',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'bg-teal-500',
    trendKey: 'attendance',
    suffix: '%',
  },
];

// ── Quick report links ──
const QUICK_REPORTS = [
  { label: 'Fee Collection Report', icon: Wallet, href: '/admin/fees' },
  { label: 'Attendance Summary', icon: ClipboardList, href: '/admin/operations/attendance' },
  { label: 'Admission Pipeline', icon: BarChart3, href: '/admin/admissions' },
  { label: 'Monthly Revenue', icon: FileText, href: '/admin/reports' },
];

// ============================================================
// COMPONENT: RevenueChart
// ============================================================

function RevenueChart({
  data,
  loading,
  period,
  onPeriodChange,
}: {
  data: RevenueMonth[];
  loading: boolean;
  period: string;
  onPeriodChange: (p: string) => void;
}) {
  const filteredData = useMemo(() => {
    return data.length > 0
      ? data
      : [
          { month: 'Jan', revenue: 0, collections: 0 },
          { month: 'Feb', revenue: 0, collections: 0 },
          { month: 'Mar', revenue: 0, collections: 0 },
          { month: 'Apr', revenue: 0, collections: 0 },
          { month: 'May', revenue: 0, collections: 0 },
          { month: 'Jun', revenue: 0, collections: 0 },
          { month: 'Jul', revenue: 0, collections: 0 },
          { month: 'Aug', revenue: 0, collections: 0 },
          { month: 'Sep', revenue: 0, collections: 0 },
          { month: 'Oct', revenue: 0, collections: 0 },
          { month: 'Nov', revenue: 0, collections: 0 },
          { month: 'Dec', revenue: 0, collections: 0 },
        ];
  }, [data]);

  return (
    <PreOneCard variant="strip" className="p-0">
      <div className="flex flex-row items-center justify-between p-6 pb-2">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Revenue Overview
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            Monthly revenue vs collections
          </p>
        </div>
        <div className="flex gap-1">
          {['This Year', 'Last Year'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              className={`h-7 text-xs rounded-lg ${
                period === p
                  ? 'bg-[var(--preone-primary)] hover:bg-[var(--preone-primary-dark)] text-white'
                  : 'dark:bg-[rgba(255,255,255,0.06)] dark:text-[var(--text-secondary)] dark:border-[rgba(255,255,255,0.08)]'
              }`}
              onClick={() => onPeriodChange(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>
      <div className="px-6 pb-6">
        {loading ? (
          <Skeleton className="h-[300px] w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="gradCollections"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={CHART_PALETTE.series[2]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_PALETTE.series[2]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatYAxis}
              />
              <RTooltip
                contentStyle={{
                  backgroundColor: 'var(--card, #fff)',
                  borderColor: 'var(--border, #e5e7eb)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString('en-IN')}`,
                  name === 'revenue' ? 'Revenue' : 'Collections',
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={CHART_PALETTE.series[0]}
                strokeWidth={2}
                fill="url(#gradRevenue)"
                name="revenue"
              />
              <Area
                type="monotone"
                dataKey="collections"
                stroke={CHART_PALETTE.series[2]}
                strokeWidth={2}
                fill="url(#gradCollections)"
                name="collections"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </PreOneCard>
  );
}

// ============================================================
// COMPONENT: FeeBreakdownPie
// ============================================================

function FeeBreakdownPie({
  data,
  loading,
}: {
  data: FeeSummary;
  loading: boolean;
}) {
  const total = data.collected + data.pending + data.overdue;

  const pieData = useMemo(
    () => [
      { name: 'Collected', value: data.collected, color: FEE_COLORS.PAID.hex },
      { name: 'Pending', value: data.pending, color: FEE_COLORS.PENDING.hex },
      { name: 'Overdue', value: data.overdue, color: FEE_COLORS.OVERDUE.hex },
    ],
    [data],
  );

  return (
    <PreOneCard variant="default" className="p-0">
      <div className="p-6 pb-2">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Fee Breakdown
        </h3>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
          Current fee collection status
        </p>
      </div>
      <div className="px-6 pb-6">
        {loading ? (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-[240px] mx-auto">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RTooltip
                    formatter={(value: number) => formatINR(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {formatINR(total)}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">Total</p>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-4 space-y-2 w-full">
              {pieData.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-[var(--text-secondary)]">{d.name}</span>
                  </div>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatINR(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PreOneCard>
  );
}

// ============================================================
// COMPONENT: ActivityFeed
// ============================================================

function ActivityFeed({
  activities,
  loading,
}: {
  activities: ActivityEntry[];
  loading: boolean;
}) {
  return (
    <PreOneCard variant="strip" className="p-0">
      <div className="p-6 pb-2">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Recent Activity
        </h3>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
          Latest actions and events
        </p>
      </div>
      <div className="px-6 pb-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1 pr-2">
              {activities.map((a, idx) => {
                const Icon = ACTIVITY_ICONS[a.type] || Megaphone;
                const color = ACTIVITY_COLORS[a.type] || 'text-gray-500 dark:text-gray-400';
                const bg = ACTIVITY_BG[a.type] || 'bg-gray-50 dark:bg-gray-800/40';

                return (
                  <div
                    key={`${a.type}-${idx}`}
                    className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-[var(--hover-bg,rgba(0,0,0,0.02))] dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {a.message}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">
            No recent activity
          </p>
        )}
      </div>
    </PreOneCard>
  );
}

// ============================================================
// COMPONENT: AdmissionPipeline
// ============================================================

function AdmissionPipeline({
  stages,
  loading,
}: {
  stages: PipelineStage[];
  loading: boolean;
}) {
  const maxCount = useMemo(
    () => Math.max(...stages.map((s) => s.count), 1),
    [stages],
  );

  return (
    <PreOneCard variant="default" className="p-0">
      <div className="p-6 pb-2">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Admission Pipeline
        </h3>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
          Lead conversion funnel
        </p>
      </div>
      <div className="px-6 pb-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {stages.map((stage) => (
              <Link
                key={stage.name}
                href={`/admin/admissions?stage=${stage.name}`}
                className="block group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-medium text-[var(--text-secondary)] w-20 capitalize">
                    {stage.name}
                  </span>
                  <div className="flex-1 bg-[var(--bg-secondary,#f3f4f6)] dark:bg-[rgba(255,255,255,0.06)] rounded-full h-8 overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                      style={{
                        width: `${Math.max(
                          (stage.count / maxCount) * 100,
                          8,
                        )}%`,
                        backgroundColor: stage.color,
                      }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[var(--text-tertiary)] w-16 text-right">
                    {formatINR(stage.value)}
                  </span>
                </div>
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-[var(--border,rgba(0,0,0,0.06))] dark:border-[rgba(255,255,255,0.06)]">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Total Pipeline</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatINR(stages.reduce((s, st) => s + st.value, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PreOneCard>
  );
}

// ============================================================
// COMPONENT: QuickReports
// ============================================================

function QuickReports() {
  return (
    <PreOneCard variant="glass" className="p-0">
      <div className="p-6 pb-3">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Quick Reports
        </h3>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
          Jump to frequently used reports
        </p>
      </div>
      <div className="px-6 pb-6 space-y-1">
        {QUICK_REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.label}
              href={report.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg,rgba(0,0,0,0.03))] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--preone-primary-50,rgba(99,102,241,0.08))] dark:bg-[rgba(129,140,248,0.1)]">
                <Icon className="h-4 w-4 text-[var(--preone-primary)] dark:text-[var(--preone-primary-light)]" />
              </div>
              {report.label}
            </Link>
          );
        })}
      </div>
    </PreOneCard>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function AdminDashboardPage() {
  // ── Data state ──
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueMonth[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [feeSummary, setFeeSummary] = useState<FeeSummary>({
    collected: 0,
    pending: 0,
    overdue: 0,
  });
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);

  // ── Loading state ──
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingFee, setLoadingFee] = useState(true);
  const [loadingPipeline, setLoadingPipeline] = useState(true);

  // ── Chart period ──
  const [period, setPeriod] = useState('This Year');

  // ── Time-of-day greeting ──
  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const greetingConfig = TIME_THEME_CONFIG[timeOfDay];

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = (await apiFetch('/api/dashboard/stats')) as DashboardStats;
      setStats(data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── Fetch revenue ──
  const fetchRevenue = useCallback(async () => {
    setLoadingRevenue(true);
    try {
      const year =
        period === 'Last Year'
          ? new Date().getFullYear() - 1
          : new Date().getFullYear();
      const data = (await apiFetch(
        `/api/dashboard/revenue?year=${year}`,
      )) as { data: RevenueMonth[] };
      setRevenueData(data.data || []);
    } catch (err) {
      console.error('Revenue fetch error:', err);
    } finally {
      setLoadingRevenue(false);
    }
  }, [period]);

  // ── Fetch activities ──
  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const data = (await apiFetch(
        '/api/dashboard/activities?limit=15',
      )) as { activities: ActivityEntry[] };
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Activities fetch error:', err);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  // ── Fetch fee summary ──
  const fetchFeeSummary = useCallback(async () => {
    setLoadingFee(true);
    try {
      const data = (await apiFetch(
        '/api/dashboard/fee-summary',
      )) as FeeSummary;
      setFeeSummary(data);
    } catch (err) {
      console.error('Fee summary fetch error:', err);
    } finally {
      setLoadingFee(false);
    }
  }, []);

  // ── Fetch pipeline ──
  const fetchPipeline = useCallback(async () => {
    setLoadingPipeline(true);
    try {
      const data = (await apiFetch(
        '/api/dashboard/pipeline',
      )) as { stages: PipelineStage[] };
      setPipeline(data.stages || []);
    } catch (err) {
      console.error('Pipeline fetch error:', err);
    } finally {
      setLoadingPipeline(false);
    }
  }, []);

  // ── Initial data load ──
  useEffect(() => {
    fetchStats();
    fetchActivities();
    fetchFeeSummary();
    fetchPipeline();
  }, [fetchStats, fetchActivities, fetchFeeSummary, fetchPipeline]);

  // ── Refetch revenue when period changes ──
  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* ── Greeting Section ── */}
        <StaggerItem>
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={timeOfDay}>
              {greetingConfig.icon}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {greetingConfig.greeting}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Here&apos;s your preschool overview at a glance.
              </p>
            </div>
          </div>
        </StaggerItem>

        {/* ── Stat Cards Row ── */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadingStats
              ? STAT_CARDS.map((card) => (
                  <PreOneCard key={card.key} variant="strip" className="p-5">
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </PreOneCard>
                ))
              : STAT_CARDS.map((card) => (
                  <CosmicStatCard
                    key={card.key}
                    label={card.label}
                    value={(stats?.[card.key] as number) ?? 0}
                    suffix={card.suffix}
                    icon={card.icon}
                    color={card.color}
                    trend={
                      stats?.trends
                        ? {
                            value: Math.abs(stats.trends[card.trendKey]),
                            positive: stats.trends[card.trendKey] >= 0,
                          }
                        : undefined
                    }
                  />
                ))}
          </div>
        </StaggerItem>

        {/* ── Main Content Grid: 2/3 left, 1/3 right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <StaggerItem>
              <RevenueChart
                data={revenueData}
                loading={loadingRevenue}
                period={period}
                onPeriodChange={setPeriod}
              />
            </StaggerItem>
            <StaggerItem>
              <ActivityFeed
                activities={activities}
                loading={loadingActivities}
              />
            </StaggerItem>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            <StaggerItem>
              <FeeBreakdownPie data={feeSummary} loading={loadingFee} />
            </StaggerItem>
            <StaggerItem>
              <QuickReports />
            </StaggerItem>
            <StaggerItem>
              <AdmissionPipeline stages={pipeline} loading={loadingPipeline} />
            </StaggerItem>
          </div>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
