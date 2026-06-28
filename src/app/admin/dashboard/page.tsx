'use client';

// ============================================================
// PreOne — Admin Dashboard (/admin/dashboard)
//
// Enhanced dashboard with KPIs, charts, activity feed,
// admission pipeline, quick reports, and dynamic welcome.
//
// Sections:
//   1. Welcome section (dynamic greeting + date pill)
//   2. 6 CosmicStatCard KPIs (3×2 grid, horizontal layout, illustration slots)
//   3. Revenue Overview (12 months + year toggle)
//   4. Fee Breakdown (donut chart + 3-column breakdown)
//   5. Bottom row: Recent Activity + Admission Pipeline + Quick Reports
//   6. PreO mascot (optional decorative, fixed bottom-right)
//
// Color rules:
//   - ALL colors use var(--admin-*) CSS variables — no hex in JSX.
//   - Recharts components need real hex for fill/stroke props (they
//     don't support CSS vars). Those hex values are kept in data
//     constants at the top, clearly marked.
// ============================================================

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Image from 'next/image';
import {
  Users,
  GraduationCap,
  IndianRupee,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  ArrowRight,
  UserPlus,
  CreditCard,
  PhoneIncoming,
  UserMinus,
  Palmtree,
  Megaphone,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ── Mock data (replace with API calls later) ──────────────────
// NOTE: KPI `color` and chart fill/stroke colors are hex because
// Recharts props don't support CSS variables. These are NOT
// hardcoded style values — they're data-level chart colors.

const KPI_DATA = [
  { key: 'students', label: 'Students', value: 348, trend: 12.5, icon: Users, color: 'var(--chart-1)', imageSrc: '/icons/admin/kpi/students.webp' },
  { key: 'teachers', label: 'Teachers', value: 24, trend: 4.2, icon: GraduationCap, color: 'var(--admin-success)', imageSrc: '/icons/admin/kpi/teachers.webp' },
  { key: 'revenue', label: 'Revenue', value: 485000, trend: 8.3, prefix: '₹', icon: IndianRupee, color: 'var(--admin-warning)', imageSrc: '/icons/admin/kpi/revenue.webp' },
  { key: 'admissions', label: 'Admissions', value: 42, trend: 18.7, icon: ClipboardCheck, color: 'var(--admin-info)', imageSrc: '/icons/admin/kpi/admissions.webp' },
  { key: 'occupancy', label: 'Occupancy', value: 87, trend: -2.1, suffix: '%', icon: TrendingUp, color: 'var(--admin-error)', imageSrc: '/icons/admin/kpi/occupancy.webp' },
  { key: 'attendance', label: 'Attendance', value: 94, trend: 1.4, suffix: '%', icon: CalendarCheck, color: 'var(--chart-2)', imageSrc: '/icons/admin/kpi/attendance.webp' },
] as const;

const REVENUE_DATA_THIS_YEAR = [
  { month: 'Jan', invoiced: 42000, collected: 38000 },
  { month: 'Feb', invoiced: 45000, collected: 41000 },
  { month: 'Mar', invoiced: 48000, collected: 44000 },
  { month: 'Apr', invoiced: 44000, collected: 39000 },
  { month: 'May', invoiced: 50000, collected: 47000 },
  { month: 'Jun', invoiced: 52000, collected: 48000 },
  { month: 'Jul', invoiced: 48000, collected: 45000 },
  { month: 'Aug', invoiced: 55000, collected: 51000 },
  { month: 'Sep', invoiced: 58000, collected: 53000 },
  { month: 'Oct', invoiced: 60000, collected: 55000 },
  { month: 'Nov', invoiced: 62000, collected: 57000 },
  { month: 'Dec', invoiced: 65000, collected: 60000 },
];

const REVENUE_DATA_LAST_YEAR = [
  { month: 'Jan', invoiced: 38000, collected: 34000 },
  { month: 'Feb', invoiced: 40000, collected: 36000 },
  { month: 'Mar', invoiced: 42000, collected: 38000 },
  { month: 'Apr', invoiced: 39000, collected: 35000 },
  { month: 'May', invoiced: 44000, collected: 40000 },
  { month: 'Jun', invoiced: 46000, collected: 42000 },
  { month: 'Jul', invoiced: 43000, collected: 39000 },
  { month: 'Aug', invoiced: 48000, collected: 44000 },
  { month: 'Sep', invoiced: 51000, collected: 47000 },
  { month: 'Oct', invoiced: 53000, collected: 48000 },
  { month: 'Nov', invoiced: 55000, collected: 50000 },
  { month: 'Dec', invoiced: 58000, collected: 53000 },
];

// Recharts needs real hex for bar fills — matches var(--chart-1) and var(--chart-3)
const BAR_FILL_INVOICED = '#818CF8';
const BAR_FILL_COLLECTED = '#34D399';

const FEE_SUMMARY = {
  total: 875000,
  collected: 620000,
  pending: 180000,
  overdue: 75000,
};

const FEE_PIE_DATA = [
  { name: 'Collected', value: 620000 },
  { name: 'Pending', value: 180000 },
  { name: 'Overdue', value: 75000 },
];

// Recharts needs real hex for pie fills — matches admin-success / admin-warning / admin-error
const FEE_PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

const ADMISSION_PIPELINE = [
  { stage: 'New', count: 58 },
  { stage: 'Contacted', count: 42 },
  { stage: 'Visited', count: 32 },
  { stage: 'Applied', count: 18 },
  { stage: 'Enrolled', count: 12 },
];

// Pipeline bar colors: light mode / dark mode — Recharts/inline needs hex
const PIPELINE_COLORS_LIGHT = ['#6B7280', '#3B82F6', '#6366F1', '#F59E0B', '#10B981'];
const PIPELINE_COLORS_DARK = ['#9CA3B4', '#60A5FA', '#818CF8', '#FBBF24', '#34D399'];

const RECENT_ACTIVITY = [
  { id: 1, type: 'admission', text: 'New admission enquiry from Priya Sharma', time: '2 min ago', icon: UserPlus, color: 'var(--admin-info)' },
  { id: 2, type: 'payment', text: 'Payment of ₹12,500 received from Rajesh Kumar', time: '15 min ago', icon: CreditCard, color: 'var(--admin-success)' },
  { id: 3, type: 'lead', text: 'New lead: Meera Patel (Nursery)', time: '1 hr ago', icon: PhoneIncoming, color: 'var(--admin-primary)' },
  { id: 4, type: 'absence', text: 'Aarav Singh marked absent (Class 2A)', time: '2 hrs ago', icon: UserMinus, color: 'var(--admin-error)' },
  { id: 5, type: 'leave', text: 'Teacher Anjali requested leave (Jun 28–29)', time: '3 hrs ago', icon: Palmtree, color: 'var(--admin-warning)' },
  { id: 6, type: 'announcement', text: 'Annual Day announcement published', time: '5 hrs ago', icon: Megaphone, color: 'var(--admin-accent)' },
] as const;

const QUICK_REPORTS = [
  { label: 'Fee Collection Report', href: '/admin/reports?tab=fees', icon: IndianRupee },
  { label: 'Attendance Summary', href: '/admin/reports?tab=attendance', icon: ClipboardCheck },
  { label: 'Admission Pipeline Report', href: '/admin/reports?tab=admissions', icon: UserPlus },
  { label: 'Monthly Revenue Report', href: '/admin/reports?tab=revenue', icon: BarChart3 },
] as const;

// ── Reduced-motion detection ──────────────────────────────────

function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

// ── Animated counter hook ─────────────────────────────────────

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setCount(target);
      return;
    }

    if (ref.current) return;
    ref.current = true;

    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, prefersReduced]);

  return count;
}

// ── Dark mode detection for chart colors ──────────────────────

function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

// ── Greeting helper ───────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getDatePill(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── CosmicStatCard ─────────────────────────────────────────────

function CosmicStatCard({
  label,
  value,
  trend,
  icon: Icon,
  color,
  prefix = '',
  suffix = '',
  delay = 0,
  imageSrc,
}: {
  label: string;
  value: number;
  trend: number;
  icon: React.ElementType;
  color: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
  imageSrc?: string;
}) {
  const animated = useAnimatedCounter(value);

  const formatValue = (v: number) => {
    if (prefix === '₹') {
      if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
      if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
      return `₹${v}`;
    }
    return `${prefix}${v.toLocaleString('en-IN')}${suffix}`;
  };

  const isUp = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="
        relative min-h-[120px] overflow-hidden rounded-xl border border-[var(--admin-border)]
        bg-[var(--admin-surface)] p-5
      "
      aria-label={`${label}: ${value}, ${isUp ? 'up' : 'down'} ${Math.abs(trend)} percent from last month`}
    >
      <div className="flex items-center justify-between">
        {/* ── Left: icon + text ── */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'var(--admin-primary-soft)' }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--admin-text-muted)]">
                {label}
              </p>
              <p className="mt-0.5 text-[28px] font-bold leading-none text-[var(--admin-text)]">
                {formatValue(animated)}
              </p>
            </div>
          </div>

          {/* ── Trend indicator ── */}
          <div className="mt-3 flex items-center gap-1">
            {isUp ? (
              <TrendingUp className="h-3.5 w-3.5 text-[var(--admin-success)]" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-[var(--admin-error)]" />
            )}
            <span
              className={`text-[12px] font-semibold ${
                isUp ? 'text-[var(--admin-success)]' : 'text-[var(--admin-error)]'
              }`}
            >
              {isUp ? '+' : ''}{trend}%
            </span>
            <span className="text-[11px] text-[var(--admin-text-subtle)]">vs last month</span>
          </div>
        </div>

        {/* ── Right: illustration image (or placeholder) ── */}
        {imageSrc ? (
          <div className="hidden h-16 w-16 shrink-0 md:block">
            <Image
              src={imageSrc}
              alt={label}
              width={64}
              height={64}
              className="h-16 w-16 object-contain drop-shadow-sm"
            />
          </div>
        ) : (
          <div className="hidden h-16 w-16 shrink-0 md:block" />
        )}
      </div>
    </motion.div>
  );
}

// ── Revenue chart (Recharts) ──────────────────────────────────

function RevenueChart() {
  const [yearView, setYearView] = useState<'this' | 'last'>('this');
  const isDark = useIsDark();

  const data = yearView === 'this' ? REVENUE_DATA_THIS_YEAR : REVENUE_DATA_LAST_YEAR;

  const formatY = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      className="
        rounded-xl border border-[var(--admin-border)]
        bg-[var(--admin-surface)] p-5
      "
    >
      {/* ── Header row ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--admin-text)]">
            Revenue Overview
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--admin-text-muted)]">
            Monthly invoiced vs collected
          </p>
        </div>
        {/* ── Year toggle ── */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setYearView('this')}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={{
              background: yearView === 'this' ? 'var(--admin-primary)' : 'var(--admin-surface-2)',
              color: yearView === 'this' ? 'var(--admin-primary-foreground)' : 'var(--admin-text-muted)',
            }}
          >
            This Year
          </button>
          <button
            type="button"
            onClick={() => setYearView('last')}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={{
              background: yearView === 'last' ? 'var(--admin-primary)' : 'var(--admin-surface-2)',
              color: yearView === 'last' ? 'var(--admin-primary-foreground)' : 'var(--admin-text-muted)',
            }}
          >
            Last Year
          </button>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#232B3D' : '#E5E7EB'} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: isDark ? '#9CA3B4' : '#6B7280' }}
              axisLine={{ stroke: isDark ? '#232B3D' : '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: isDark ? '#9CA3B4' : '#6B7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatY}
            />
            <Tooltip
              contentStyle={{
                background: isDark ? '#131826' : '#FFFFFF',
                border: `1px solid ${isDark ? '#232B3D' : '#E5E7EB'}`,
                borderRadius: 8,
                fontSize: 13,
                color: isDark ? '#F5F7FA' : '#1F2937',
              }}
              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: isDark ? '#9CA3B4' : '#6B7280' }}
            />
            <Bar dataKey="invoiced" name="Invoiced" fill={BAR_FILL_INVOICED} radius={[4, 4, 0, 0]} />
            <Bar dataKey="collected" name="Collected" fill={BAR_FILL_COLLECTED} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ── Fee Breakdown card (donut chart) ──────────────────────────

// Custom label component for the donut center
function DonutCenterLabel({ isDark, total }: { isDark: boolean; total: number }) {
  const formattedTotal = total >= 100000
    ? `₹${(total / 100000).toFixed(2)}L`
    : `₹${total.toLocaleString('en-IN')}`;

  return (
    <g>
      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={isDark ? '#F5F7FA' : '#1F2937'}
        style={{ fontSize: 20, fontWeight: 700 }}
      >
        {formattedTotal}
      </text>
      <text
        x="50%"
        y="60%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={isDark ? '#9CA3B4' : '#6B7280'}
        style={{ fontSize: 12 }}
      >
        Total
      </text>
    </g>
  );
}

function FeeBreakdownCard() {
  const isDark = useIsDark();
  const collectedPct = Math.round((FEE_SUMMARY.collected / FEE_SUMMARY.total) * 100);
  const pendingPct = Math.round((FEE_SUMMARY.pending / FEE_SUMMARY.total) * 100);
  const overduePct = Math.round((FEE_SUMMARY.overdue / FEE_SUMMARY.total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
      className="
        rounded-xl border border-[var(--admin-border)]
        bg-[var(--admin-surface)] p-5
      "
      aria-label={`Fee breakdown: ${collectedPct}% collected, ${pendingPct}% pending, ${overduePct}% overdue`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--admin-text)]">
            Fee Breakdown
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--admin-text-muted)]">
            Current fee collection status
          </p>
        </div>
        <Link
          href="/admin/fees"
          className="
            inline-flex items-center gap-1 text-[12px] font-medium
            text-[var(--admin-primary)] transition-colors hover:underline
          "
        >
          View Details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* ── Donut chart ── */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={FEE_PIE_DATA}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {FEE_PIE_DATA.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={FEE_PIE_COLORS[index]} />
              ))}
            </Pie>
            <DonutCenterLabel isDark={isDark} total={FEE_SUMMARY.total} />
            <Tooltip
              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
              contentStyle={{
                background: isDark ? '#131826' : '#FFFFFF',
                border: `1px solid ${isDark ? '#232B3D' : '#E5E7EB'}`,
                borderRadius: 8,
                fontSize: 13,
                color: isDark ? '#F5F7FA' : '#1F2937',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ── Breakdown ── */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Collected', value: FEE_SUMMARY.collected, pct: collectedPct, color: 'var(--admin-success)', soft: 'var(--admin-success-soft)' },
          { label: 'Pending', value: FEE_SUMMARY.pending, pct: pendingPct, color: 'var(--admin-warning)', soft: 'var(--admin-warning-soft)' },
          { label: 'Overdue', value: FEE_SUMMARY.overdue, pct: overduePct, color: 'var(--admin-error)', soft: 'var(--admin-error-soft)' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg px-3 py-2"
            style={{ background: item.soft }}
          >
            <p className="text-[11px] font-medium" style={{ color: item.color }}>
              {item.label}
            </p>
            <p className="mt-0.5 text-[15px] font-bold text-[var(--admin-text)]">
              ₹{(item.value / 1000).toFixed(0)}K
            </p>
            <p className="text-[11px] text-[var(--admin-text-muted)]">{item.pct}%</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Recent Activity feed ──────────────────────────────────────

function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
      className="
        rounded-xl border border-[var(--admin-border)]
        bg-[var(--admin-surface)] p-5
      "
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--admin-text)]">
            Recent Activity
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--admin-text-muted)]">
            Latest actions and events
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="
            inline-flex items-center gap-1 text-[12px] font-medium
            text-[var(--admin-primary)] transition-colors hover:underline
          "
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-[var(--admin-border)]">
        {RECENT_ACTIVITY.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--admin-primary-soft)' }}
              >
                <Icon className="h-4 w-4" style={{ color: item.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-[var(--admin-text)]">
                  {item.text}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--admin-text-subtle)]">
                  {item.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Admission Pipeline ─────────────────────────────────────────

function AdmissionPipeline() {
  const maxCount = Math.max(...ADMISSION_PIPELINE.map((s) => s.count));
  const totalPipeline = ADMISSION_PIPELINE.reduce((sum, s) => sum + s.count, 0);
  const isDark = useIsDark();
  const colors = isDark ? PIPELINE_COLORS_DARK : PIPELINE_COLORS_LIGHT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
      className="
        rounded-xl border border-[var(--admin-border)]
        bg-[var(--admin-surface)] p-5
      "
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--admin-text)]">
            Admission Pipeline
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--admin-text-muted)]">
            Lead conversion funnel
          </p>
        </div>
        <Link
          href="/admin/admission"
          className="
            inline-flex items-center gap-1 text-[12px] font-medium
            text-[var(--admin-primary)] transition-colors hover:underline
          "
        >
          View Details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {ADMISSION_PIPELINE.map((stage, idx) => {
          const pct = Math.round((stage.count / maxCount) * 100);
          return (
            <div
              key={stage.stage}
              role="meter"
              aria-valuenow={stage.count}
              aria-valuemin={0}
              aria-valuemax={maxCount}
              aria-label={`${stage.stage}: ${stage.count} leads`}
              className="flex items-center gap-3"
            >
              <div className="w-[72px] shrink-0">
                <span className="text-[13px] font-semibold text-[var(--admin-text)]">
                  {stage.stage}
                </span>
                <span className="ml-1.5 text-[13px] font-mono text-[var(--admin-text-muted)]">
                  {stage.count}
                </span>
              </div>
              <div className="flex-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--admin-surface-2)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: colors[idx],
                      transitionDuration: '500ms',
                    }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-[12px] text-[var(--admin-text-subtle)]">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-[var(--admin-border)] pt-3">
        <p className="text-[14px] font-bold text-[var(--admin-text)]">
          Total Pipeline: <span className="font-mono">{totalPipeline}</span>
        </p>
      </div>
    </motion.div>
  );
}

// ── Quick Reports ──────────────────────────────────────────────

function QuickReports() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6, ease: 'easeOut' }}
      className="
        rounded-xl border border-[var(--admin-border)]
        bg-[var(--admin-surface)] p-5
      "
    >
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-[var(--admin-text)]">
          Quick Reports
        </h3>
        <p className="mt-0.5 text-[12px] text-[var(--admin-text-muted)]">
          Jump to frequently used reports
        </p>
      </div>

      <div className="space-y-1">
        {QUICK_REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.label}
              href={report.href}
              className="
                flex items-center gap-3 rounded-lg px-3 py-2.5
                text-[14px] font-medium text-[var(--admin-text)]
                transition-colors
                hover:bg-[var(--admin-surface-2)]
              "
              style={{ transitionDuration: '150ms' }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--admin-primary-soft)' }}
              >
                <Icon className="h-5 w-5 text-[var(--admin-primary)]" />
              </div>
              <span className="flex-1">{report.label}</span>
              <ChevronRight className="h-4 w-4 text-[var(--admin-text-subtle)]" />
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── PreO Mascot (decorative, bottom-right) ─────────────────────
// Renders nothing until the user adds /public/characters/preo-superhero.svg

function PreOMascot() {
  return null;
}

// ── Main page ─────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const greeting = useMemo(() => getGreeting(), []);
  const datePill = useMemo(() => getDatePill(), []);

  return (
    <div>
      {/* ── Welcome section ── */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[var(--admin-text)]">
            {greeting}, Admin! 👋
          </h1>
          <p className="mt-1 text-[14px] text-[var(--admin-text-muted)]">
            Here&apos;s your preschool overview at a glance.
          </p>
        </div>
        <div
          className="
            hidden shrink-0 items-center rounded-lg border
            border-[var(--admin-border)] bg-[var(--admin-surface)]
            px-3 py-1.5 sm:inline-flex
          "
        >
          <span className="text-[13px] text-[var(--admin-text-muted)]">{datePill}</span>
        </div>
      </div>

      {/* ── KPI grid (responsive: 1→2→3→6 columns) ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {KPI_DATA.map((kpi, idx) => (
          <CosmicStatCard
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            icon={kpi.icon}
            color={kpi.color}
            prefix={'prefix' in kpi ? (kpi as { prefix?: string }).prefix : ''}
            suffix={'suffix' in kpi ? (kpi as { suffix?: string }).suffix : ''}
            delay={idx * 0.06}
            imageSrc={'imageSrc' in kpi ? (kpi as { imageSrc?: string }).imageSrc : undefined}
          />
        ))}
      </div>

      {/* ── Charts + Fee breakdown row ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <FeeBreakdownCard />
      </div>

      {/* ── Bottom row: Activity + Pipeline + Quick Reports ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <RecentActivity />
        <AdmissionPipeline />
        <QuickReports />
      </div>

      {/* ── PreO mascot (optional, desktop only — enable when asset exists) ── */}
      <PreOMascot />
    </div>
  );
}
