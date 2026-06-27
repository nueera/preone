'use client';

// ============================================================
// PreOne — Admin Dashboard (/admin/dashboard)
//
// Real dashboard with KPIs, charts, and activity feed.
// Reached by clicking the "Dashboard" card in the module grid
// at /admin.
//
// Sections:
//   1. PageHeader (dashboard icon + title)
//   2. 6 CosmicStatCard KPIs (animated counters + trend)
//   3. Revenue chart (Recharts BarChart — invoiced vs collected)
//   4. Fee summary card (progress bar + breakdown)
//   5. Recent Activity feed (last 8 events)
// ============================================================

import { useEffect, useState, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/admin/page-header';
import Link from 'next/link';

// ── Mock data (replace with API calls later) ──────────────────

const KPI_DATA = [
  { key: 'students', label: 'Students', value: 348, trend: 12.5, icon: Users, color: '#818CF8' },
  { key: 'teachers', label: 'Teachers', value: 24, trend: 4.2, icon: GraduationCap, color: '#34D399' },
  { key: 'revenue', label: 'Revenue', value: 485000, trend: 8.3, prefix: '₹', icon: IndianRupee, color: '#FBBF24' },
  { key: 'admissions', label: 'Admissions', value: 42, trend: 18.7, icon: ClipboardCheck, color: '#60A5FA' },
  { key: 'occupancy', label: 'Occupancy', value: 87, trend: -2.1, suffix: '%', icon: TrendingUp, color: '#F87171' },
  { key: 'attendance', label: 'Attendance', value: 94, trend: 1.4, suffix: '%', icon: CalendarCheck, color: '#A78BFA' },
] as const;

const REVENUE_DATA = [
  { month: 'Jan', invoiced: 42000, collected: 38000 },
  { month: 'Feb', invoiced: 45000, collected: 41000 },
  { month: 'Mar', invoiced: 48000, collected: 44000 },
  { month: 'Apr', invoiced: 44000, collected: 39000 },
  { month: 'May', invoiced: 50000, collected: 47000 },
  { month: 'Jun', invoiced: 52000, collected: 48000 },
];

const FEE_SUMMARY = {
  total: 485000,
  collected: 352000,
  pending: 98000,
  overdue: 35000,
};

const RECENT_ACTIVITY = [
  { id: 1, type: 'admission', text: 'New admission enquiry from Priya Sharma', time: '2 min ago', icon: UserPlus, color: 'var(--admin-info)' },
  { id: 2, type: 'payment', text: 'Payment of ₹12,500 received from Rajesh Kumar', time: '15 min ago', icon: CreditCard, color: 'var(--admin-success)' },
  { id: 3, type: 'lead', text: 'New lead: Meera Patel (Nursery)', time: '1 hr ago', icon: PhoneIncoming, color: 'var(--admin-primary)' },
  { id: 4, type: 'absence', text: 'Aarav Singh marked absent (Class 2A)', time: '2 hrs ago', icon: UserMinus, color: 'var(--admin-error)' },
  { id: 5, type: 'leave', text: 'Teacher Anjali requested leave (Jun 28–29)', time: '3 hrs ago', icon: Palmtree, color: 'var(--admin-warning)' },
  { id: 6, type: 'announcement', text: 'Annual Day announcement published', time: '5 hrs ago', icon: Megaphone, color: 'var(--admin-accent)' },
  { id: 7, type: 'payment', text: 'Payment of ₹8,000 received from Sunil Das', time: '6 hrs ago', icon: CreditCard, color: 'var(--admin-success)' },
  { id: 8, type: 'admission', text: 'Admission confirmed for Vihaan Reddy (KG)', time: 'Yesterday', icon: UserPlus, color: 'var(--admin-info)' },
] as const;

// ── Animated counter hook ─────────────────────────────────────

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;

    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return count;
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
}: {
  label: string;
  value: number;
  trend: number;
  icon: React.ElementType;
  color: string;
  prefix?: string;
  suffix?: string;
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
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="
        relative overflow-hidden rounded-xl border border-[var(--admin-border)]
        bg-[var(--admin-surface)] p-5
      "
    >
      {/* ── Decorative glow ── */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-2xl"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--admin-text-muted)]">
            {label}
          </p>
          <p className="mt-2 text-[28px] font-bold leading-none text-[var(--admin-text)]">
            {formatValue(animated)}
          </p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${color}18` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
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
    </motion.div>
  );
}

// ── Revenue chart (Recharts) ──────────────────────────────────

function RevenueChart() {
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
      <h3 className="mb-4 text-[15px] font-semibold text-[var(--admin-text)]">
        Revenue Overview
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={REVENUE_DATA} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: 'var(--admin-text-muted)' }}
              axisLine={{ stroke: 'var(--admin-border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--admin-text-muted)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: 'var(--admin-text-muted)' }}
            />
            <Bar dataKey="invoiced" name="Invoiced" fill="#818CF8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="collected" name="Collected" fill="#34D399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ── Fee Summary card ──────────────────────────────────────────

function FeeSummaryCard() {
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
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[var(--admin-text)]">
          Fee Summary
        </h3>
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

      <p className="text-[24px] font-bold text-[var(--admin-text)]">
        ₹{(FEE_SUMMARY.total / 100000).toFixed(1)}L
        <span className="ml-2 text-[13px] font-normal text-[var(--admin-text-muted)]">total</span>
      </p>

      {/* ── Progress bar ── */}
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[var(--admin-border)]">
        <div className="flex h-full">
          <div
            className="rounded-l-full bg-[var(--admin-success)]"
            style={{ width: `${collectedPct}%` }}
          />
          <div
            className="bg-[var(--admin-warning)]"
            style={{ width: `${pendingPct}%` }}
          />
          <div
            className="rounded-r-full bg-[var(--admin-error)]"
            style={{ width: `${overduePct}%` }}
          />
        </div>
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
        <h3 className="text-[15px] font-semibold text-[var(--admin-text)]">
          Recent Activity
        </h3>
        <span className="text-[12px] text-[var(--admin-text-muted)]">Last 24 hours</span>
      </div>

      <div className="divide-y divide-[var(--admin-border)]">
        {RECENT_ACTIVITY.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${item.color}18` }}
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

// ── Main page ─────────────────────────────────────────────────

export default function AdminDashboardPage() {
  return (
    <div>
      <PageHeader
        iconKey="dashboard"
        title="Dashboard"
        subtitle="KPIs, charts and school overview"
      />

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {KPI_DATA.map((kpi) => (
          <CosmicStatCard
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            icon={kpi.icon}
            color={kpi.color}
            prefix={'prefix' in kpi ? (kpi as { prefix?: string }).prefix : ''}
            suffix={'suffix' in kpi ? (kpi as { suffix?: string }).suffix : ''}
          />
        ))}
      </div>

      {/* ── Charts + Fee summary row ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <FeeSummaryCard />
      </div>

      {/* ── Recent Activity ── */}
      <div className="mt-6">
        <RecentActivity />
      </div>
    </div>
  );
}
