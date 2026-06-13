'use client';

import React from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, CHART_PALETTE } from '@/lib/theme-tokens';
import {
  BarChart3,
  Download,
  Users,
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const theme = PORTAL_THEMES.admin;

const ENROLLMENT_TREND = [
  { month: 'Jan', students: 95 }, { month: 'Feb', students: 98 },
  { month: 'Mar', students: 102 }, { month: 'Apr', students: 108 },
  { month: 'May', students: 112 }, { month: 'Jun', students: 109 },
];

const CLASS_DISTRIBUTION = [
  { name: 'Nursery-A', students: 28, color: CHART_PALETTE.series[0] },
  { name: 'Nursery-B', students: 26, color: CHART_PALETTE.series[1] },
  { name: 'LKG-A', students: 30, color: CHART_PALETTE.series[2] },
  { name: 'LKG-B', students: 28, color: CHART_PALETTE.series[3] },
  { name: 'UKG-A', students: 32, color: CHART_PALETTE.series[4] },
  { name: 'UKG-B', students: 30, color: CHART_PALETTE.series[5] },
];

const AGE_DISTRIBUTION = [
  { range: '2-3 yrs', count: 54 }, { range: '3-4 yrs', count: 58 },
  { range: '4-5 yrs', count: 62 }, { range: '5-6 yrs', count: 30 },
];

const GENDER_DATA = [
  { name: 'Boys', value: 112, color: CHART_PALETTE.series[1] },
  { name: 'Girls', value: 92, color: CHART_PALETTE.series[4] },
];

export default function StudentsReportPage() {
  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6" style={{ color: theme.primary }} />
                Student Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">Demographics, enrollment trends, and class distribution</p>
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Total Students</p>
              <p className="text-xl font-bold text-purple-700">204</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">New This Month</p>
              <p className="text-xl font-bold text-emerald-700">+8</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Avg Class Size</p>
              <p className="text-xl font-bold text-amber-700">29</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Gender Ratio</p>
              <p className="text-xl font-bold text-purple-700">55:45</p>
            </PreOneCard>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment Trend */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Enrollment Trend</h3>
              </div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={ENROLLMENT_TREND}>
                    <defs><linearGradient id="gEnroll" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <RTooltip />
                    <Area type="monotone" dataKey="students" stroke={CHART_PALETTE.series[0]} fill="url(#gEnroll)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </PreOneCard>
          </StaggerItem>

          {/* Gender Pie */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2"><h3 className="text-base font-semibold text-gray-900">Gender Distribution</h3></div>
              <div className="px-6 pb-6 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={GENDER_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {GENDER_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="px-6 pb-4 flex justify-center gap-6">
                {GENDER_DATA.map((g) => (
                  <div key={g.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="text-gray-600">{g.name}: {g.value}</span>
                  </div>
                ))}
              </div>
            </PreOneCard>
          </StaggerItem>

          {/* Class Distribution */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2"><h3 className="text-base font-semibold text-gray-900">Class Distribution</h3></div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={CLASS_DISTRIBUTION}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <RTooltip />
                    <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                      {CLASS_DISTRIBUTION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PreOneCard>
          </StaggerItem>

          {/* Age Distribution */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2"><h3 className="text-base font-semibold text-gray-900">Age Distribution</h3></div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={AGE_DISTRIBUTION}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <RTooltip />
                    <Bar dataKey="count" fill={CHART_PALETTE.series[2]} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
