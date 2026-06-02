'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  TrendingUp,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { PORTAL_THEMES, CRM_COLORS, CHART_PALETTE, getChartColor } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface InsightsData {
  totalLeads: number;
  conversionRate: number;
  avgDaysToConvert: number;
  enrolledCount: number;
  lostCount: number;
  sourceROI: {
    source: string;
    total: number;
    enrolled: number;
    conversionRate: number;
  }[];
  lostReasons: {
    reason: string;
    count: number;
  }[];
  monthlyTrend: {
    month: string;
    leads: number;
    conversions: number;
  }[];
  revenueForecast: {
    stage: string;
    value: number;
    color: string;
  }[];
}

const SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  GOOGLE: 'Google',
  WALK_IN: 'Walk-in',
  REFERRAL: 'Referral',
  WEBSITE: 'Website',
  JUSTDIAL: 'JustDial',
  SULEKHA: 'Sulekha',
  NEWSPAPER: 'Newspaper',
  HOARDING: 'Hoarding',
  EVENT: 'Event',
  OTHER: 'Other',
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export function CrmAnalytics() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/crm/insights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-400">
        No analytics data available
      </div>
    );
  }

  // Pie chart colors — use CHART_PALETTE instead of hardcoded hex
  const PIE_COLORS = CHART_PALETTE.series;

  return (
    <div className="space-y-6">
      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalLeads}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.conversionRate}%</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Target className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-[11px] text-green-600 font-medium">
              {data.enrolledCount} enrolled
            </span>
          </div>
        </Card>

        {/* Avg Days to Convert */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Avg Days to Convert</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.avgDaysToConvert}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Lost Leads */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Lost Leads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.lostCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend - Line Chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Monthly Trend — Leads vs Conversions</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.gridLight} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_PALETTE.axis }} />
                <YAxis tick={{ fontSize: 11, fill: CHART_PALETTE.axis }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke={getChartColor(0)}
                  strokeWidth={2}
                  dot={{ fill: getChartColor(0), r: 3 }}
                  name="Leads"
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke={getChartColor(2)}
                  strokeWidth={2}
                  dot={{ fill: getChartColor(2), r: 3 }}
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Source ROI - Horizontal Bar Chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Source Conversion Rate (%)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.sourceROI.map((s) => ({
                  source: SOURCE_LABELS[s.source] || s.source,
                  conversionRate: s.conversionRate,
                  total: s.total,
                }))}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.gridLight} />
                <XAxis type="number" tick={{ fontSize: 11, fill: CHART_PALETTE.axis }} domain={[0, 100]} />
                <YAxis type="category" dataKey="source" tick={{ fontSize: 11, fill: CHART_PALETTE.axis }} width={80} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Conversion Rate']} />
                <Bar dataKey="conversionRate" fill={theme.primary} radius={[0, 4, 4, 0]} name="Conversion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lost Reasons - Pie Chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Lost Reasons</h3>
          {data.lostReasons.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
              No lost leads data available
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.lostReasons}
                    dataKey="count"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ reason, count }) => `${reason}: ${count}`}
                  >
                    {data.lostReasons.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Revenue Forecast - Stacked Bar Chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Revenue Forecast by Stage</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.revenueForecast.map((r) => ({
                  stage: r.stage,
                  value: r.value,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.gridLight} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: CHART_PALETTE.axis }} />
                <YAxis tick={{ fontSize: 11, fill: CHART_PALETTE.axis }} />
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Est. Value']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.revenueForecast.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
