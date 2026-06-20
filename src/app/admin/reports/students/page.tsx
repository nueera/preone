'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { PORTAL_THEMES, CHART_PALETTE } from '@/lib/theme-tokens';
import {
  Download,
  Users,
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const theme = PORTAL_THEMES.admin;

// Shape of a record from GET /api/reports/students
interface StudentRecord {
  name: string;
  className: string;
  gender: string;
  dob: string;
  admissionDate: string;
  status: string;
}

interface Aggregations {
  total: number;
  newThisMonth: number;
  avgClassSize: number;
  genderRatio: string;
  enrollmentTrend: { month: string; students: number }[];
  classDistribution: { name: string; students: number; color: string }[];
  ageDistribution: { range: string; count: number }[];
  genderData: { name: string; value: number; color: string }[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function aggregate(records: StudentRecord[]): Aggregations {
  const now = new Date();

  // Class distribution
  const classMap: Record<string, number> = {};
  for (const r of records) {
    const c = r.className && r.className !== '-' ? r.className : 'Unassigned';
    classMap[c] = (classMap[c] || 0) + 1;
  }
  const classDistribution = Object.entries(classMap).map(([name, students], i) => ({
    name,
    students,
    color: CHART_PALETTE.series[i % CHART_PALETTE.series.length],
  }));

  // Gender
  let boys = 0;
  let girls = 0;
  for (const r of records) {
    const g = (r.gender || '').toLowerCase();
    if (g.startsWith('m')) boys++;
    else if (g.startsWith('f')) girls++;
  }
  const genderData = [
    { name: 'Boys', value: boys, color: CHART_PALETTE.series[1] },
    { name: 'Girls', value: girls, color: CHART_PALETTE.series[4] },
  ];

  // Age buckets
  const buckets: Record<string, number> = { '2-3 yrs': 0, '3-4 yrs': 0, '4-5 yrs': 0, '5-6 yrs': 0, '6+ yrs': 0 };
  for (const r of records) {
    if (r.dob && r.dob !== '-') {
      const age = (now.getTime() - new Date(r.dob).getTime()) / (365.25 * 86400000);
      if (age < 3) buckets['2-3 yrs']++;
      else if (age < 4) buckets['3-4 yrs']++;
      else if (age < 5) buckets['4-5 yrs']++;
      else if (age < 6) buckets['5-6 yrs']++;
      else buckets['6+ yrs']++;
    }
  }
  const ageDistribution = Object.entries(buckets).map(([range, count]) => ({ range, count }));

  // Enrollment trend — new admissions per month over the last 6 months
  const trend: { month: string; students: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = records.filter((r) => {
      if (!r.admissionDate || r.admissionDate === '-') return false;
      const ad = new Date(r.admissionDate);
      return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth();
    }).length;
    trend.push({ month: MONTHS[d.getMonth()], students: count });
  }

  const thisMonthCount = records.filter((r) => {
    if (!r.admissionDate || r.admissionDate === '-') return false;
    const ad = new Date(r.admissionDate);
    return ad.getFullYear() === now.getFullYear() && ad.getMonth() === now.getMonth();
  }).length;

  const total = records.length;
  const avgClassSize = classDistribution.length ? Math.round(total / classDistribution.length) : 0;
  const genderRatio = boys + girls > 0
    ? `${Math.round((boys / (boys + girls)) * 100)}:${Math.round((girls / (boys + girls)) * 100)}`
    : '—';

  return {
    total,
    newThisMonth: thisMonthCount,
    avgClassSize,
    genderRatio,
    enrollmentTrend: trend,
    classDistribution,
    ageDistribution,
    genderData,
  };
}

export default function StudentsReportPage() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/reports/students');
        if (!res.ok) throw new Error('Failed to load student report');
        const data = await res.json();
        setRecords(data.records || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load student report');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const agg = useMemo(() => aggregate(records), [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading student report…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500 text-sm">{error}</div>
    );
  }

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
              <p className="text-xl font-bold text-purple-700">{agg.total}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">New This Month</p>
              <p className="text-xl font-bold text-emerald-700">+{agg.newThisMonth}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Avg Class Size</p>
              <p className="text-xl font-bold text-amber-700">{agg.avgClassSize}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Gender Ratio</p>
              <p className="text-xl font-bold text-purple-700">{agg.genderRatio}</p>
            </PreOneCard>
          </div>
        </StaggerItem>

        {agg.total === 0 ? (
          <StaggerItem>
            <PreOneCard variant="default" className="p-12 text-center text-gray-400 text-sm">
              No student data yet.
            </PreOneCard>
          </StaggerItem>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment Trend */}
            <StaggerItem>
              <PreOneCard variant="default" className="p-0">
                <div className="p-6 pb-2">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Enrollment Trend</h3>
                </div>
                <div className="px-6 pb-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={agg.enrollmentTrend}>
                      <defs><linearGradient id="gEnroll" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
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
                      <Pie data={agg.genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                        {agg.genderData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="px-6 pb-4 flex justify-center gap-6">
                  {agg.genderData.map((g) => (
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
                    <BarChart data={agg.classDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <RTooltip />
                      <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                        {agg.classDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
                    <BarChart data={agg.ageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <RTooltip />
                      <Bar dataKey="count" fill={CHART_PALETTE.series[2]} radius={[6, 6, 0, 0]} />
                    </BarChart>
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
