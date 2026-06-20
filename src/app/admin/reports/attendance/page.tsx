'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { PORTAL_THEMES, CHART_PALETTE } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  CheckCircle2,
  TrendingUp,
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
  AreaChart,
  Area,
} from 'recharts';

const theme = PORTAL_THEMES.admin;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface AttendanceRecord {
  date: string;
  className: string;
  status: string;
}
interface Summary {
  total: number;
  present: number;
  absent: number;
  late: number;
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

export default function AttendanceReportPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, present: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const to = new Date();
        const from = new Date(to.getFullYear(), to.getMonth() - 5, 1);
        const qs = `from=${from.toISOString().split('T')[0]}&to=${to.toISOString().split('T')[0]}`;
        const res = await fetch(`/api/reports/attendance?${qs}`);
        if (!res.ok) throw new Error('Failed to load attendance report');
        const data = await res.json();
        setRecords(data.records || []);
        setSummary(data.summary || { total: 0, present: 0, absent: 0, late: 0 });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load attendance report');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const overallRates = useMemo(() => {
    const t = summary.total;
    return [
      { label: 'Present', value: pct(summary.present, t), color: 'text-emerald-700' },
      { label: 'Absent', value: pct(summary.absent, t), color: 'text-red-700' },
      { label: 'Late', value: pct(summary.late, t), color: 'text-amber-700' },
      { label: 'Records', value: t, color: 'text-blue-700', raw: true },
    ];
  }, [summary]);

  const classWise = useMemo(() => {
    const map: Record<string, { present: number; total: number }> = {};
    for (const r of records) {
      const c = r.className && r.className !== '-' ? r.className : 'Unassigned';
      if (!map[c]) map[c] = { present: 0, total: 0 };
      map[c].total++;
      if (r.status === 'PRESENT' || r.status === 'LATE') map[c].present++;
    }
    return Object.entries(map).map(([cls, v], i) => ({
      class: cls,
      rate: pct(v.present, v.total),
      color: CHART_PALETTE.series[i % CHART_PALETTE.series.length],
    }));
  }, [records]);

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const out: { month: string; rate: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const inMonth = records.filter((r) => {
        const rd = new Date(r.date);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      });
      const present = inMonth.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      out.push({ month: MONTHS[d.getMonth()], rate: pct(present, inMonth.length) });
    }
    return out;
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading attendance report…
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
                <CheckCircle2 className="w-6 h-6" style={{ color: theme.primary }} />
                Attendance Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">Overall rates, class-wise breakdown, and trend (last 6 months)</p>
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </StaggerItem>

        {/* Overall Rate + Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {overallRates.map((r) => (
              <PreOneCard key={r.label} variant="strip" className="p-4">
                <p className="text-xs text-gray-500">{r.label}</p>
                <p className={`text-xl font-bold ${r.color}`}>{r.raw ? r.value : `${r.value}%`}</p>
                {!r.raw && <Progress value={r.value} className="h-1.5 mt-2" />}
              </PreOneCard>
            ))}
          </div>
        </StaggerItem>

        {summary.total === 0 ? (
          <StaggerItem>
            <PreOneCard variant="default" className="p-12 text-center text-gray-400 text-sm">
              No attendance recorded in the last 6 months.
            </PreOneCard>
          </StaggerItem>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <StaggerItem>
              <PreOneCard variant="default" className="p-0">
                <div className="p-6 pb-2">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Monthly Trend</h3>
                </div>
                <div className="px-6 pb-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={monthlyTrend}>
                      <defs><linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[0, 100]} />
                      <RTooltip />
                      <Area type="monotone" dataKey="rate" stroke={CHART_PALETTE.series[0]} fill="url(#gAtt)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </PreOneCard>
            </StaggerItem>

            {/* Class-Wise */}
            <StaggerItem>
              <PreOneCard variant="default" className="p-0">
                <div className="p-6 pb-2"><h3 className="text-base font-semibold text-gray-900">Class-wise Attendance</h3></div>
                <div className="px-6 pb-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={classWise}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="class" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[0, 100]} />
                      <RTooltip />
                      <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                        {classWise.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </PreOneCard>
            </StaggerItem>

            {/* Status breakdown */}
            <StaggerItem className="lg:col-span-2">
              <PreOneCard variant="default">
                <PreOneCardContent>
                  <h3 className="font-semibold text-gray-900 mb-4">Student Attendance Breakdown (last 6 months)</h3>
                  <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 rounded-l-full" style={{ width: `${pct(summary.present, summary.total)}%` }} />
                    <div className="bg-amber-400" style={{ width: `${pct(summary.late, summary.total)}%` }} />
                    <div className="bg-red-400 rounded-r-full" style={{ width: `${pct(summary.absent, summary.total)}%` }} />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Present {pct(summary.present, summary.total)}%</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> Late {pct(summary.late, summary.total)}%</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Absent {pct(summary.absent, summary.total)}%</span>
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

function Cell(props: React.SVGProps<SVGRectElement> & { fill?: string }) {
  const { fill, ...rest } = props;
  return <rect {...rest} fill={fill} />;
}
