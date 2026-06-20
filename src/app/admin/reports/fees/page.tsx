'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { PORTAL_THEMES, CHART_PALETTE, FEE_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const theme = PORTAL_THEMES.admin;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface FeeRecord {
  netAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  dueDate: string;
  paidDate: string;
}
interface FeeSummary {
  totalInvoiced: number;
  totalCollected: number;
  totalPending: number;
  invoiceCount: number;
  byStatus: Record<string, { count: number; amount: number }>;
}

export default function FeesReportPage() {
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [summary, setSummary] = useState<FeeSummary>({ totalInvoiced: 0, totalCollected: 0, totalPending: 0, invoiceCount: 0, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/reports/fees');
        if (!res.ok) throw new Error('Failed to load fee report');
        const data = await res.json();
        setRecords(data.records || []);
        setSummary(data.summary || { totalInvoiced: 0, totalCollected: 0, totalPending: 0, invoiceCount: 0, byStatus: {} });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load fee report');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalCollected = summary.totalCollected;
  const totalExpected = summary.totalInvoiced;
  const totalOverdue = summary.byStatus?.OVERDUE?.amount || 0;
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const feeBreakdown = useMemo(() => {
    const collected = totalCollected;
    const overdue = totalOverdue;
    const pending = Math.max(0, totalExpected - collected - overdue);
    return [
      { name: 'Collected', value: collected, color: FEE_COLORS.PAID.hex },
      { name: 'Pending', value: pending, color: FEE_COLORS.PENDING.hex },
      { name: 'Overdue', value: overdue, color: FEE_COLORS.OVERDUE.hex },
    ];
  }, [totalCollected, totalOverdue, totalExpected]);

  const monthlyCollection = useMemo(() => {
    const now = new Date();
    const out: { month: string; collected: number; expected: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      let collected = 0;
      let expected = 0;
      for (const r of records) {
        if (r.paidDate && r.paidDate !== '-') {
          const pd = new Date(r.paidDate);
          if (pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth()) collected += r.paidAmount;
        }
        if (r.dueDate && r.dueDate !== '-') {
          const dd = new Date(r.dueDate);
          if (dd.getFullYear() === d.getFullYear() && dd.getMonth() === d.getMonth()) expected += r.netAmount;
        }
      }
      out.push({ month: MONTHS[d.getMonth()], collected, expected });
    }
    return out;
  }, [records]);

  const overdueAging = useMemo(() => {
    const buckets = [
      { range: '0-30 days', min: 0, max: 30, count: 0, amount: 0 },
      { range: '31-60 days', min: 31, max: 60, count: 0, amount: 0 },
      { range: '61-90 days', min: 61, max: 90, count: 0, amount: 0 },
      { range: '90+ days', min: 91, max: Infinity, count: 0, amount: 0 },
    ];
    const now = Date.now();
    for (const r of records) {
      if (r.status !== 'OVERDUE' || !r.dueDate || r.dueDate === '-') continue;
      const days = Math.floor((now - new Date(r.dueDate).getTime()) / 86400000);
      const b = buckets.find((x) => days >= x.min && days <= x.max);
      if (b) { b.count++; b.amount += r.balance; }
    }
    return buckets;
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading fee report…
      </div>
    );
  }
  if (error) {
    return <div className="flex items-center justify-center py-24 text-red-500 text-sm">{error}</div>;
  }

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-6 h-6" style={{ color: theme.primary }} />
                Fee Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">Collection summary, overdue analysis, and trends</p>
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Total Invoiced</p>
              <p className="text-xl font-bold text-purple-700">₹{(totalExpected / 100000).toFixed(1)}L</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Collected</p>
              <p className="text-xl font-bold text-emerald-700">₹{(totalCollected / 100000).toFixed(1)}L</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-red-700">₹{(totalOverdue / 100000).toFixed(1)}L</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Collection Rate</p>
              <p className="text-xl font-bold text-amber-700">{collectionRate}%</p>
              <Progress value={collectionRate} className="h-1.5 mt-2" />
            </PreOneCard>
          </div>
        </StaggerItem>

        {summary.invoiceCount === 0 ? (
          <StaggerItem>
            <PreOneCard variant="default" className="p-12 text-center text-gray-400 text-sm">
              No invoices yet.
            </PreOneCard>
          </StaggerItem>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Collection */}
            <StaggerItem>
              <PreOneCard variant="default" className="p-0">
                <div className="p-6 pb-2">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Monthly Collection</h3>
                </div>
                <div className="px-6 pb-6">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyCollection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                      <RTooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                      <Bar dataKey="expected" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Expected" />
                      <Bar dataKey="collected" fill={CHART_PALETTE.series[2]} radius={[4, 4, 0, 0]} name="Collected" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </PreOneCard>
            </StaggerItem>

            {/* Fee Breakdown Pie */}
            <StaggerItem>
              <PreOneCard variant="default" className="p-0">
                <div className="p-6 pb-2"><h3 className="text-base font-semibold text-gray-900">Fee Status Breakdown</h3></div>
                <div className="px-6 pb-6 flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={feeBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                        {feeBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <RTooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-2 w-full">
                    {feeBreakdown.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-gray-600">{d.name}</span></div>
                        <span className="font-medium">₹{(d.value / 100000).toFixed(1)}L</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PreOneCard>
            </StaggerItem>

            {/* Overdue Aging */}
            <StaggerItem className="lg:col-span-2">
              <PreOneCard variant="default">
                <PreOneCardContent>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Overdue Aging Analysis</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {overdueAging.map((a) => (
                      <div key={a.range} className="p-3 rounded-xl border">
                        <p className="text-xs text-gray-500 mb-1">{a.range}</p>
                        <p className="text-lg font-bold text-red-700">₹{(a.amount / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-gray-400">{a.count} students</p>
                      </div>
                    ))}
                  </div>
                </PreOneCardContent>
              </PreOneCard>
            </StaggerItem>
          </div>
        )}
      </StaggerContainer>
    </PageTransition>
  );
}
