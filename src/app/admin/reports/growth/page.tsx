'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { PORTAL_THEMES, CHART_PALETTE, GROWTH_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  Brain,
  Users,
  Heart,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Target,
  Activity,
  ShieldCheck,
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const theme = PORTAL_THEMES.admin;
const BENCHMARK = 75; // reference line for the radar

// Dimensions returned by GET /api/reports/growth (summary.averages + records)
const DIMENSIONS = ['creativity', 'communication', 'social', 'confidence', 'cognitive', 'physical'] as const;
type Dim = typeof DIMENSIONS[number];

const DIM_LABEL: Record<Dim, string> = {
  creativity: 'Creativity',
  communication: 'Communication',
  social: 'Social',
  confidence: 'Confidence',
  cognitive: 'Cognitive',
  physical: 'Physical',
};
const DIM_ICON: Record<Dim, React.ElementType> = {
  creativity: Sparkles,
  communication: MessageSquare,
  social: Users,
  confidence: ShieldCheck,
  cognitive: Brain,
  physical: Activity,
};

interface GrowthRecord {
  className: string;
  creativity: number;
  communication: number;
  social: number;
  confidence: number;
  cognitive: number;
  physical: number;
  overall: number | string;
}

export default function GrowthReportPage() {
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [averages, setAverages] = useState<Record<string, number>>({});
  const [totalAssessments, setTotalAssessments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/reports/growth');
        if (!res.ok) throw new Error('Failed to load growth report');
        const data = await res.json();
        setRecords(data.records || []);
        setAverages(data.summary?.averages || {});
        setTotalAssessments(data.summary?.totalAssessments || 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load growth report');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const radarData = useMemo(
    () => DIMENSIONS.map((d) => ({ dimension: DIM_LABEL[d], score: averages[d] || 0, benchmark: BENCHMARK })),
    [averages]
  );

  // Per-class average overall score
  const classComparison = useMemo(() => {
    const map: Record<string, { sum: number; n: number }> = {};
    for (const r of records) {
      const c = r.className && r.className !== '-' ? r.className : 'Unassigned';
      const overall = typeof r.overall === 'number' ? r.overall : 0;
      if (!map[c]) map[c] = { sum: 0, n: 0 };
      map[c].sum += overall;
      map[c].n++;
    }
    return Object.entries(map).map(([cls, v], i) => ({
      class: cls,
      score: v.n ? Math.round(v.sum / v.n) : 0,
      color: CHART_PALETTE.series[i % CHART_PALETTE.series.length],
    }));
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading growth report…
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
                <Target className="w-6 h-6" style={{ color: theme.primary }} />
                Growth Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">Developmental dimension averages, benchmark, and class comparison</p>
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </StaggerItem>

        {totalAssessments === 0 ? (
          <StaggerItem>
            <PreOneCard variant="default" className="p-12 text-center text-gray-400 text-sm">
              No growth assessments recorded yet.
            </PreOneCard>
          </StaggerItem>
        ) : (
          <>
            {/* Dimension averages */}
            <StaggerItem>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {DIMENSIONS.map((d) => {
                  const cfg = GROWTH_COLORS[d] || GROWTH_COLORS.cognitive;
                  const Icon = DIM_ICON[d];
                  const score = averages[d] || 0;
                  return (
                    <PreOneCard key={d} variant="strip" className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4" style={{ color: cfg.hex }} />
                        <span className="text-sm font-medium text-gray-700">{DIM_LABEL[d]}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">avg score</span>
                        <span className="text-sm font-bold" style={{ color: cfg.hex }}>{score}</span>
                      </div>
                      <Progress value={score} className="h-1.5" />
                    </PreOneCard>
                  );
                })}
              </div>
            </StaggerItem>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Developmental Radar */}
              <StaggerItem>
                <PreOneCard variant="default" className="p-0">
                  <div className="p-6 pb-2">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Dimension Averages vs Benchmark</h3>
                  </div>
                  <div className="px-6 pb-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                        <Radar name="School Avg" dataKey="score" stroke={CHART_PALETTE.series[0]} fill={CHART_PALETTE.series[0]} fillOpacity={0.2} />
                        <Radar name="Benchmark" dataKey="benchmark" stroke={CHART_PALETTE.series[2]} fill={CHART_PALETTE.series[2]} fillOpacity={0.1} />
                        <RTooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </PreOneCard>
              </StaggerItem>

              {/* Class Comparison */}
              <StaggerItem>
                <PreOneCard variant="default" className="p-0">
                  <div className="p-6 pb-2"><h3 className="text-base font-semibold text-gray-900">Class Comparison (avg overall)</h3></div>
                  <div className="px-6 pb-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={classComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="class" tick={{ fontSize: 10, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[0, 100]} />
                        <RTooltip />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                          {classComparison.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </PreOneCard>
              </StaggerItem>
            </div>
          </>
        )}
      </StaggerContainer>
    </PageTransition>
  );
}

function Cell(props: React.SVGProps<SVGRectElement> & { fill?: string }) {
  const { fill, ...rest } = props;
  return <rect {...rest} fill={fill} />;
}
