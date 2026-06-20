'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { PORTAL_THEMES, CHART_PALETTE } from '@/lib/theme-tokens';
import {
  BarChart3,
  Download,
  TrendingUp,
  Funnel,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
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
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Lead stages, in funnel order (LOST is excluded — it's a drop-off, not a stage).
const STAGE_ORDER = ['NEW', 'CONTACTED', 'QUALIFIED', 'TOUR_SCHEDULED', 'TOUR_COMPLETED', 'APPLICATION', 'ENROLLED'];
const STAGE_LABEL: Record<string, string> = {
  NEW: 'New Leads',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  TOUR_SCHEDULED: 'Tour Scheduled',
  TOUR_COMPLETED: 'Tour Completed',
  APPLICATION: 'Application',
  ENROLLED: 'Enrolled',
};

interface CrmSummary {
  totalLeads: number;
  enrolled: number;
  conversionRate: string;
  totalEstimatedRevenue: number;
  enrolledRevenue: number;
  byStage: Record<string, { count: number; value: number }>;
  bySource: Record<string, number>;
}
interface CrmRecord {
  stage: string;
  createdAt: string;
}

export default function AdmissionsReportPage() {
  const [summary, setSummary] = useState<CrmSummary>({ totalLeads: 0, enrolled: 0, conversionRate: '0', totalEstimatedRevenue: 0, enrolledRevenue: 0, byStage: {}, bySource: {} });
  const [records, setRecords] = useState<CrmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/reports/crm');
        if (!res.ok) throw new Error('Failed to load admissions report');
        const data = await res.json();
        setSummary(data.summary || { totalLeads: 0, enrolled: 0, conversionRate: '0', totalEstimatedRevenue: 0, enrolledRevenue: 0, byStage: {}, bySource: {} });
        setRecords(data.records || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load admissions report');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const funnel = useMemo(() => {
    return STAGE_ORDER
      .filter((s) => summary.byStage?.[s])
      .map((s, i) => ({
        stage: STAGE_LABEL[s] || s,
        count: summary.byStage[s].count,
        color: CHART_PALETTE.series[i % CHART_PALETTE.series.length],
      }));
  }, [summary]);

  const sourcePie = useMemo(() => {
    return Object.entries(summary.bySource || {}).map(([name, value], i) => ({
      name,
      value,
      color: CHART_PALETTE.series[i % CHART_PALETTE.series.length],
    }));
  }, [summary]);

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const out: { month: string; leads: number; enrolled: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const inMonth = records.filter((r) => {
        if (!r.createdAt) return false;
        const cd = new Date(r.createdAt);
        return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
      });
      out.push({
        month: MONTHS[d.getMonth()],
        leads: inMonth.length,
        enrolled: inMonth.filter((r) => r.stage === 'ENROLLED').length,
      });
    }
    return out;
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading admissions report…
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
              <p className="text-xl font-bold text-purple-700">{summary.totalLeads}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Enrolled</p>
              <p className="text-xl font-bold text-emerald-700">{summary.enrolled}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Conversion Rate</p>
              <p className="text-xl font-bold text-amber-700">{summary.conversionRate}%</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Est. Revenue</p>
              <p className="text-xl font-bold text-purple-700">₹{(summary.totalEstimatedRevenue / 100000).toFixed(1)}L</p>
            </PreOneCard>
          </div>
        </StaggerItem>

        {summary.totalLeads === 0 ? (
          <StaggerItem>
            <PreOneCard variant="default" className="p-12 text-center text-gray-400 text-sm">
              No leads yet.
            </PreOneCard>
          </StaggerItem>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <StaggerItem>
              <PreOneCard variant="default" className="p-0">
                <div className="p-6 pb-2">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Funnel className="w-4 h-4" /> Conversion Funnel</h3>
                </div>
                <div className="px-6 pb-6">
                  <div className="space-y-2">
                    {funnel.length === 0 ? (
                      <p className="text-sm text-gray-400 py-6 text-center">No pipeline data.</p>
                    ) : (
                      funnel.map((stage, i) => {
                        const maxCount = funnel[0].count || 1;
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
                              {i > 0 ? `${Math.round((stage.count / funnel[i - 1].count) * 100)}%` : ''}
                            </span>
                          </div>
                        );
                      })
                    )}
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
                      <Pie data={sourcePie} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                        {sourcePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 justify-center mt-2">
                    {sourcePie.map((s) => (
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
                    <AreaChart data={monthlyTrend}>
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
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <RTooltip />
                      <Area type="monotone" dataKey="leads" stroke={CHART_PALETTE.series[0]} fill="url(#gradLeads)" name="Leads" />
                      <Area type="monotone" dataKey="enrolled" stroke={CHART_PALETTE.series[2]} fill="url(#gradEnrolled)" name="Enrolled" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </PreOneCard>
            </StaggerItem>
          </div>
        )}
      </StaggerContainer>
    </PageTransition>
  );
}
