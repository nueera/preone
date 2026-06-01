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
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
  LEAD: 'text-purple-500',
  ATTENDANCE: 'text-red-500',
  LEAVE: 'text-orange-500',
  ANNOUNCEMENT: 'text-blue-500',
};

const ACTIVITY_BG: Record<string, string> = {
  ADMISSION: 'bg-emerald-50',
  PAYMENT: 'bg-emerald-50',
  LEAD: 'bg-purple-50',
  ATTENDANCE: 'bg-red-50',
  LEAVE: 'bg-orange-50',
  ANNOUNCEMENT: 'bg-blue-50',
};

// ── Stat card config ──
const STAT_CARDS: {
  key: keyof DashboardStats;
  label: string;
  icon: React.ElementType;
  iconColorClass: string;
  trendKey: keyof DashboardStats['trends'];
  isCurrency?: boolean;
  isPercent?: boolean;
}[] = [
  {
    key: 'totalStudents',
    label: 'Total Students',
    icon: GraduationCap,
    iconColorClass: 'bg-purple-100 text-purple-600',
    trendKey: 'students',
  },
  {
    key: 'totalTeachers',
    label: 'Total Teachers',
    icon: Users,
    iconColorClass: 'bg-blue-100 text-blue-600',
    trendKey: 'teachers',
  },
  {
    key: 'monthlyRevenue',
    label: 'Monthly Revenue',
    icon: IndianRupee,
    iconColorClass: 'bg-emerald-100 text-emerald-600',
    trendKey: 'revenue',
    isCurrency: true,
  },
  {
    key: 'newAdmissions',
    label: 'New Admissions',
    icon: UserPlus,
    iconColorClass: 'bg-pink-100 text-pink-600',
    trendKey: 'admissions',
  },
  {
    key: 'occupancyRate',
    label: 'Occupancy Rate',
    icon: Building2,
    iconColorClass: 'bg-orange-100 text-orange-600',
    trendKey: 'occupancy',
    isPercent: true,
  },
  {
    key: 'attendanceRate',
    label: 'Attendance Rate',
    icon: CheckCircle,
    iconColorClass: 'bg-teal-100 text-teal-600',
    trendKey: 'attendance',
    isPercent: true,
  },
];

// ============================================================
// COMPONENT: StatCard
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
  iconColorClass,
  trend,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColorClass: string;
  trend: number;
  loading: boolean;
}) {
  const isPositive = trend >= 0;

  return (
    <Card className="rounded-xl shadow-sm border-0 bg-white">
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${iconColorClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">{label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">
                  {value}
                </span>
                {trend !== 0 && (
                  <span
                    className={`inline-flex items-center text-xs font-medium ${
                      isPositive ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(trend)}%
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

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
    // Show all 12 months or filter based on period
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
    <Card className="rounded-xl shadow-sm border-0 bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue vs collections</CardDescription>
        </div>
        <div className="flex gap-1">
          {['This Year', 'Last Year'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              className={`h-7 text-xs rounded-lg ${
                period === p
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : ''
              }`}
              onClick={() => onPeriodChange(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="gradCollections"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatYAxis}
              />
              <RTooltip
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString('en-IN')}`,
                  name === 'revenue' ? 'Revenue' : 'Collections',
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7C3AED"
                strokeWidth={2}
                fill="url(#gradRevenue)"
                name="revenue"
              />
              <Area
                type="monotone"
                dataKey="collections"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradCollections)"
                name="collections"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
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
      { name: 'Collected', value: data.collected, color: '#10b981' },
      { name: 'Pending', value: data.pending, color: '#f59e0b' },
      { name: 'Overdue', value: data.overdue, color: '#ef4444' },
    ],
    [data],
  );

  return (
    <Card className="rounded-xl shadow-sm border-0 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Fee Breakdown</CardTitle>
        <CardDescription>Current fee collection status</CardDescription>
      </CardHeader>
      <CardContent>
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
                  <p className="text-lg font-bold">{formatINR(total)}</p>
                  <p className="text-[10px] text-gray-400">Total</p>
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
                    <span className="text-gray-600">{d.name}</span>
                  </div>
                  <span className="font-medium">{formatINR(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
    <Card className="rounded-xl shadow-sm border-0 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <CardDescription>Latest actions and events</CardDescription>
      </CardHeader>
      <CardContent>
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
            <div className="space-y-3 pr-2">
              {activities.map((a, idx) => {
                const Icon = ACTIVITY_ICONS[a.type] || Megaphone;
                const color = ACTIVITY_COLORS[a.type] || 'text-gray-500';
                const bg = ACTIVITY_BG[a.type] || 'bg-gray-50';

                return (
                  <div
                    key={`${a.type}-${idx}`}
                    className="flex items-start gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {a.message}
                      </p>
                      <p className="text-xs text-gray-400">{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">
            No recent activity
          </p>
        )}
      </CardContent>
    </Card>
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
    <Card className="rounded-xl shadow-sm border-0 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Admission Pipeline
        </CardTitle>
        <CardDescription>Lead conversion funnel</CardDescription>
      </CardHeader>
      <CardContent>
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
                href={`/admin/crm?stage=${stage.name}`}
                className="block group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-medium text-gray-600 w-20 capitalize">
                    {stage.name}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden relative">
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
                  <span className="text-xs font-medium text-gray-500 w-16 text-right">
                    {formatINR(stage.value)}
                  </span>
                </div>
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Pipeline</span>
                <span className="font-semibold">
                  {formatINR(stages.reduce((s, st) => s + st.value, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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

  // ── Format stat value ──
  const formatStatValue = (
    key: keyof DashboardStats,
    value: number,
    isCurrency?: boolean,
    isPercent?: boolean,
  ): string => {
    if (isCurrency) return formatINR(value);
    if (isPercent) return `${value}%`;
    return value.toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6">
      {/* ── Page Title ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back! Here&apos;s your preschool overview.
        </p>
      </div>

      {/* ── Stat Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            iconColorClass={card.iconColorClass}
            value={
              stats
                ? formatStatValue(
                    card.key,
                    stats[card.key] as number,
                    card.isCurrency,
                    card.isPercent,
                  )
                : '—'
            }
            trend={stats?.trends?.[card.trendKey] ?? 0}
            loading={loadingStats}
          />
        ))}
      </div>

      {/* ── Revenue Chart (2/3) + Fee Breakdown (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart
            data={revenueData}
            loading={loadingRevenue}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>
        <div>
          <FeeBreakdownPie data={feeSummary} loading={loadingFee} />
        </div>
      </div>

      {/* ── Activity Feed (1/2) + Admission Pipeline (1/2) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={activities} loading={loadingActivities} />
        <AdmissionPipeline stages={pipeline} loading={loadingPipeline} />
      </div>
    </div>
  );
}
