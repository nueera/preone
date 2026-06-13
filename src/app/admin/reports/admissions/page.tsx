'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, CHART_PALETTE } from '@/lib/theme-tokens';
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  Target,
  Funnel,
  CalendarDays,
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
  AreaChart,
  Area,
} from 'recharts';

const theme = PORTAL_THEMES.admin;

const CONVERSION_FUNNEL = [
  { stage: 'New Leads', count: 156, color: CHART_PALETTE.series[0] },
  { stage: 'Contacted', count: 128, color: CHART_PALETTE.series[1] },
  { stage: 'Tour Scheduled', count: 89, color: CHART_PALETTE.series[4] },
  { stage: 'Tour Completed', count: 72, color: CHART_PALETTE.series[2] },
  { stage: 'Application', count: 58, color: CHART_PALETTE.series[3] },
  { stage: 'Enrolled', count: 42, color: CHART_PALETTE.series[5] },
];

const SOURCE_DATA = [
  { source: 'Instagram', leads: 42, converted: 18, rate: 43, revenue: 360000 },
  { source: 'Walk-in', leads: 28, converted: 16, rate: 57, revenue: 320000 },
  { source: 'Referral', leads: 35, converted: 15, rate: 43, revenue: 300000 },
  { source: 'Google', leads: 22, converted: 8, rate: 36, revenue: 160000 },
  { source: 'Facebook', leads: 18, converted: 6, rate: 33, revenue: 120000 },
  { source: 'Other', leads: 11, converted: 3, rate: 27, revenue: 60000 },
];

const MONTHLY_TREND = [
  { month: 'Jan', leads: 18, enrolled: 5 }, { month: 'Feb', leads: 22, enrolled: 8 },
  { month: 'Mar', leads: 28, enrolled: 10 }, { month: 'Apr', leads: 32, enrolled: 12 },
  { month: 'May', leads: 26, enrolled: 9 }, { month: 'Jun', leads: 30, enrolled: 8 },
];

const SOURCE_PIE = [
  { name: 'Instagram', value: 42, color: CHART_PALETTE.series[0] },
  { name: 'Walk-in', value: 28, color: CHART_PALETTE.series[1] },
  { name: 'Referral', value: 35, color: CHART_PALETTE.series[2] },
  { name: 'Google', value: 22, color: CHART_PALETTE.series[3] },
  { name: 'Facebook', value: 18, color: CHART_PALETTE.series[4] },
  { name: 'Other', value: 11, color: CHART_PALETTE.series[5] },
];

export default function AdmissionsReportPage() {
  const totalLeads = SOURCE_DATA.reduce((s, d) => s + d.leads, 0);
  const totalConverted = SOURCE_DATA.reduce((s, d) => s + d.converted, 0);
  const convRate = Math.round((totalConverted / totalLeads) * 100);
  const totalRevenue = SOURCE_DATA.reduce((s, d) => s + d.revenue, 0);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" style={{ color: theme.primary }} />
                Admission Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">Conversion funnel, source analysis, and trends</p>
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Total Leads</p>
              <p className="text-xl font-bold text-purple-700">{totalLeads}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Enrolled</p>
              <p className="text-xl font-bold text-emerald-700">{totalConverted}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Conversion Rate</p>
              <p className="text-xl font-bold text-amber-700">{convRate}%</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-xl font-bold text-purple-700">₹{(totalRevenue / 100000).toFixed(1)}L</p>
            </PreOneCard>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Funnel className="w-4 h-4" /> Conversion Funnel</h3>
              </div>
              <div className="px-6 pb-6">
                <div className="space-y-2">
                  {CONVERSION_FUNNEL.map((stage, i) => {
                    const maxCount = CONVERSION_FUNNEL[0].count;
                    const width = Math.max((stage.count / maxCount) * 100, 8);
                    return (
                      <div key={stage.stage} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-28">{stage.stage}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                          <div className="h-full rounded-full flex items-center justify-end pr-3 transition-all" style={{ width: `${width}%`, backgroundColor: stage.color }}>
                            <span className="text-xs font-semibold text-white">{stage.count}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">
                          {i > 0 ? `${Math.round((stage.count / CONVERSION_FUNNEL[i - 1].count) * 100)}%` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PreOneCard>
          </StaggerItem>

          {/* Source Pie */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2">
                <h3 className="text-base font-semibold text-gray-900">Lead Sources</h3>
              </div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={SOURCE_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                      {SOURCE_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {SOURCE_PIE.map((s) => (
                    <div key={s.name} className="flex items-center gap-1 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </PreOneCard>
          </StaggerItem>

          {/* Monthly Trend */}
          <StaggerItem className="lg:col-span-2">
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Monthly Trends</h3>
              </div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={MONTHLY_TREND}>
                    <defs>
                      <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradEnrolled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_PALETTE.series[2]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_PALETTE.series[2]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <RTooltip />
                    <Area type="monotone" dataKey="leads" stroke={CHART_PALETTE.series[0]} fill="url(#gradLeads)" name="Leads" />
                    <Area type="monotone" dataKey="enrolled" stroke={CHART_PALETTE.series[2]} fill="url(#gradEnrolled)" name="Enrolled" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
