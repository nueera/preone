'use client';

import React from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, CHART_PALETTE, GROWTH_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Download,
  Brain,
  Users,
  Hand,
  Heart,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Target,
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

const MILESTONE_COMPLETION = [
  { category: 'Motor', completed: 78, total: 100 },
  { category: 'Cognitive', completed: 72, total: 100 },
  { category: 'Social', completed: 68, total: 100 },
  { category: 'Language', completed: 82, total: 100 },
  { category: 'Emotional', completed: 65, total: 100 },
  { category: 'Creativity', completed: 75, total: 100 },
];

const CLASS_COMPARISON = [
  { dimension: 'Cognitive', Nursery: 72, LKG: 80, UKG: 88 },
  { dimension: 'Social', Nursery: 68, LKG: 76, UKG: 85 },
  { dimension: 'Physical', Nursery: 80, LKG: 84, UKG: 90 },
  { dimension: 'Emotional', Nursery: 65, LKG: 73, UKG: 82 },
  { dimension: 'Language', Nursery: 60, LKG: 70, UKG: 86 },
  { dimension: 'Creativity', Nursery: 75, LKG: 78, UKG: 84 },
];

const DEVELOPMENTAL_SCORES = [
  { dimension: 'Cognitive', score: 78, benchmark: 75 },
  { dimension: 'Social', score: 72, benchmark: 75 },
  { dimension: 'Physical', score: 84, benchmark: 80 },
  { dimension: 'Emotional', score: 68, benchmark: 72 },
  { dimension: 'Language', score: 80, benchmark: 75 },
  { dimension: 'Creativity', score: 76, benchmark: 78 },
];

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  Motor: Hand, Cognitive: Brain, Social: Users,
  Language: MessageSquare, Emotional: Heart, Creativity: Sparkles,
};

export default function GrowthReportPage() {
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
              <p className="text-sm text-gray-500 mt-1">Milestone completion, developmental scores, and class comparison</p>
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </StaggerItem>

        {/* Milestone Completion */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MILESTONE_COMPLETION.map((m) => {
              const growthCfg = GROWTH_COLORS[m.category.toLowerCase()] || GROWTH_COLORS.cognitive;
              const Icon = DIMENSION_ICONS[m.category] || Brain;
              const rate = Math.round((m.completed / m.total) * 100);
              return (
                <PreOneCard key={m.category} variant="strip" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color: growthCfg.hex }} />
                    <span className="text-sm font-medium text-gray-700">{m.category}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{m.completed}/{m.total} milestones</span>
                    <span className="text-sm font-bold" style={{ color: growthCfg.hex }}>{rate}%</span>
                  </div>
                  <Progress value={rate} className="h-1.5" />
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
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Developmental Scores vs Benchmark</h3>
              </div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={DEVELOPMENTAL_SCORES}>
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
              <div className="p-6 pb-2"><h3 className="text-base font-semibold text-gray-900">Class Comparison</h3></div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={CLASS_COMPARISON}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[0, 100]} />
                    <RTooltip />
                    <Bar dataKey="Nursery" fill={CHART_PALETTE.series[0]} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="LKG" fill={CHART_PALETTE.series[1]} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="UKG" fill={CHART_PALETTE.series[2]} radius={[3, 3, 0, 0]} />
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
