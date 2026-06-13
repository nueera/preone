'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, GROWTH_COLORS, CHART_PALETTE } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  FileText,
  Download,
  Brain,
  Users,
  Hand,
  Heart,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const theme = PORTAL_THEMES.admin;

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  cognitive: Brain, social: Users, physical: Hand,
  emotional: Heart, language: MessageSquare, creativity: Sparkles,
};

const CLASS_COMPARISON = [
  { dimension: 'Cognitive', Nursery: 72, LKG: 80, UKG: 88 },
  { dimension: 'Social', Nursery: 68, LKG: 76, UKG: 85 },
  { dimension: 'Physical', Nursery: 80, LKG: 84, UKG: 90 },
  { dimension: 'Emotional', Nursery: 65, LKG: 73, UKG: 82 },
  { dimension: 'Language', Nursery: 60, LKG: 70, UKG: 86 },
  { dimension: 'Creativity', Nursery: 75, LKG: 78, UKG: 84 },
];

const RADAR_DATA = [
  { dimension: 'Cognitive', score: 82, benchmark: 75 },
  { dimension: 'Social', score: 76, benchmark: 75 },
  { dimension: 'Physical', score: 88, benchmark: 80 },
  { dimension: 'Emotional', score: 70, benchmark: 72 },
  { dimension: 'Language', score: 78, benchmark: 75 },
  { dimension: 'Creativity', score: 84, benchmark: 78 },
];

const DIMENSION_PROGRESS = [
  { key: 'cognitive', label: 'Cognitive', score: 82, students: 28 },
  { key: 'social', label: 'Social', score: 76, students: 28 },
  { key: 'physical', label: 'Physical', score: 88, students: 28 },
  { key: 'emotional', label: 'Emotional', score: 70, students: 28 },
  { key: 'language', label: 'Language', score: 78, students: 28 },
  { key: 'creativity', label: 'Creativity', score: 84, students: 28 },
];

const RECENT_REPORTS = [
  { id: '1', title: 'Q1 Growth Report — Nursery', date: '2026-04-15', type: 'Quarterly', students: 32 },
  { id: '2', title: 'Q1 Growth Report — LKG', date: '2026-04-15', type: 'Quarterly', students: 28 },
  { id: '3', title: 'Q1 Growth Report — UKG', date: '2026-04-15', type: 'Quarterly', students: 26 },
  { id: '4', title: 'Annual Development Summary', date: '2026-03-31', type: 'Annual', students: 86 },
  { id: '5', title: 'Mid-Year Progress Card', date: '2026-01-15', type: 'Mid-Year', students: 90 },
];

export default function GrowthReportsPage() {
  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" style={{ color: theme.primary }} />
                Growth Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">Report cards, progress summaries, and developmental analysis</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <FileText className="w-4 h-4 mr-2" /> Generate Report
            </Button>
          </div>
        </StaggerItem>

        {/* Dimension Progress */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DIMENSION_PROGRESS.map((d) => {
              const cfg = GROWTH_COLORS[d.key];
              const Icon = DIMENSION_ICONS[d.key] || Brain;
              return (
                <PreOneCard key={d.key} variant="strip" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${cfg.text}`} />
                    <span className="text-sm font-medium text-gray-700">{d.label}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Avg Score</span>
                    <span className="text-sm font-bold" style={{ color: cfg.hex }}>{d.score}%</span>
                  </div>
                  <Progress value={d.score} className="h-1.5" />
                </PreOneCard>
              );
            })}
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2">
                <h3 className="text-base font-semibold text-gray-900">Developmental Scores vs Benchmark</h3>
                <p className="text-sm text-gray-500 mt-0.5">School average vs age-appropriate benchmarks</p>
              </div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={RADAR_DATA}>
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

          {/* Class Comparison Bar Chart */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2">
                <h3 className="text-base font-semibold text-gray-900">Class Comparison</h3>
                <p className="text-sm text-gray-500 mt-0.5">Average developmental scores by class</p>
              </div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={CLASS_COMPARISON}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[0, 100]} />
                    <RTooltip />
                    <Bar dataKey="Nursery" fill={CHART_PALETTE.series[0]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="LKG" fill={CHART_PALETTE.series[1]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="UKG" fill={CHART_PALETTE.series[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PreOneCard>
          </StaggerItem>
        </div>

        {/* Recent Reports */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-500" /> Recent Reports
              </h3>
              <div className="space-y-3">
                {RECENT_REPORTS.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.title}</p>
                        <p className="text-xs text-gray-400">{r.type} • {r.students} students • {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
