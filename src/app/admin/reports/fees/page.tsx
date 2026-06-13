'use client';

import React from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, CHART_PALETTE, FEE_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Download,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const theme = PORTAL_THEMES.admin;

const MONTHLY_COLLECTION = [
  { month: 'Jan', collected: 420000, expected: 500000 },
  { month: 'Feb', collected: 460000, expected: 500000 },
  { month: 'Mar', collected: 380000, expected: 500000 },
  { month: 'Apr', collected: 490000, expected: 500000 },
  { month: 'May', collected: 470000, expected: 500000 },
  { month: 'Jun', collected: 350000, expected: 500000 },
];

const FEE_BREAKDOWN = [
  { name: 'Collected', value: 2570000, color: FEE_COLORS.PAID.hex },
  { name: 'Pending', value: 280000, color: FEE_COLORS.PENDING.hex },
  { name: 'Overdue', value: 150000, color: FEE_COLORS.OVERDUE.hex },
];

const OVERDUE_AGING = [
  { range: '0-30 days', count: 8, amount: 96000 },
  { range: '31-60 days', count: 5, amount: 75000 },
  { range: '61-90 days', count: 3, amount: 42000 },
  { range: '90+ days', count: 2, amount: 35000 },
];

export default function FeesReportPage() {
  const totalCollected = FEE_BREAKDOWN[0].value;
  const totalPending = FEE_BREAKDOWN[1].value;
  const totalOverdue = FEE_BREAKDOWN[2].value;
  const totalExpected = totalCollected + totalPending + totalOverdue;
  const collectionRate = Math.round((totalCollected / totalExpected) * 100);

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
              <p className="text-xs text-gray-500">Total Expected</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Collection */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Monthly Collection</h3>
              </div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={MONTHLY_COLLECTION}>
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
                    <Pie data={FEE_BREAKDOWN} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {FEE_BREAKDOWN.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RTooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2 w-full">
                  {FEE_BREAKDOWN.map((d) => (
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
                  {OVERDUE_AGING.map((a) => (
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
      </StaggerContainer>
    </PageTransition>
  );
}
