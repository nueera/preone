'use client';

import React from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, CHART_PALETTE, ATTENDANCE_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
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

const OVERALL_RATES = [
  { label: 'Present', value: 87, color: 'text-emerald-700' },
  { label: 'Absent', value: 8, color: 'text-red-700' },
  { label: 'Late', value: 3, color: 'text-amber-700' },
  { label: 'Excused', value: 2, color: 'text-blue-700' },
];

const CLASS_WISE = [
  { class: 'Nursery-A', rate: 85 }, { class: 'Nursery-B', rate: 88 },
  { class: 'LKG-A', rate: 90 }, { class: 'LKG-B', rate: 82 },
  { class: 'UKG-A', rate: 92 }, { class: 'UKG-B', rate: 89 },
];

const MONTHLY_TREND = [
  { month: 'Jan', rate: 90 }, { month: 'Feb', rate: 88 },
  { month: 'Mar', rate: 85 }, { month: 'Apr', rate: 91 },
  { month: 'May', rate: 87 }, { month: 'Jun', rate: 84 },
];

const COMPARISON = [
  { category: 'Students', present: 87, late: 3, absent: 8 },
  { category: 'Teachers', present: 94, late: 2, absent: 4 },
  { category: 'Staff', present: 96, late: 1, absent: 3 },
];

export default function AttendanceReportPage() {
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
              <p className="text-sm text-gray-500 mt-1">Overall rates, class-wise, trends, and comparison</p>
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </StaggerItem>

        {/* Overall Rate + Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {OVERALL_RATES.map((r) => (
              <PreOneCard key={r.label} variant="strip" className="p-4">
                <p className="text-xs text-gray-500">{r.label}</p>
                <p className={`text-xl font-bold ${r.color}`}>{r.value}%</p>
                <Progress value={r.value} className="h-1.5 mt-2" />
              </PreOneCard>
            ))}
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Monthly Trend</h3>
              </div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={MONTHLY_TREND}>
                    <defs><linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[70, 100]} />
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
                  <BarChart data={CLASS_WISE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="class" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[70, 100]} />
                    <RTooltip />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                      {CLASS_WISE.map((entry, i) => (
                        <Cell key={i} fill={entry.rate >= 90 ? CHART_PALETTE.series[2] : entry.rate >= 85 ? CHART_PALETTE.series[3] : CHART_PALETTE.series[4]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PreOneCard>
          </StaggerItem>

          {/* Comparison */}
          <StaggerItem className="lg:col-span-2">
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-4">Students vs Teachers vs Staff</h3>
                <div className="space-y-4">
                  {COMPARISON.map((c) => (
                    <div key={c.category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{c.category}</span>
                        <span className="text-sm font-bold text-gray-900">{c.present}% present</span>
                      </div>
                      <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 rounded-l-full" style={{ width: `${c.present}%` }} />
                        <div className="bg-amber-400" style={{ width: `${c.late}%` }} />
                        <div className="bg-red-400 rounded-r-full" style={{ width: `${c.absent}%` }} />
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Present {c.present}%</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> Late {c.late}%</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Absent {c.absent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}

function Cell(props: any) {
  const { fill, ...rest } = props;
  return <rect {...rest} fill={fill} />;
}
