'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, CHART_PALETTE, GROWTH_COLORS, OBSERVATION_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  Brain,
  AlertTriangle,
  Users,
  Hand,
  Heart,
  MessageSquare,
  Sparkles,
  Download,
  ArrowRight,
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

const MILESTONE_TRACKING = [
  { category: 'Motor', onTrack: 78, behind: 12, ahead: 10, alert: 2 },
  { category: 'Cognitive', onTrack: 72, behind: 15, ahead: 8, alert: 5 },
  { category: 'Social', onTrack: 68, behind: 18, ahead: 6, alert: 8 },
  { category: 'Language', onTrack: 82, behind: 8, ahead: 7, alert: 3 },
  { category: 'Emotional', onTrack: 65, behind: 20, ahead: 5, alert: 10 },
  { category: 'Creativity', onTrack: 75, behind: 10, ahead: 12, alert: 3 },
];

const INTERVENTION_ALERTS = [
  { id: '1', student: 'Meera Joshi', category: 'PHYSICAL', title: 'Fine Motor Delay', description: 'Below benchmarks for 3+ months. OT assessment recommended.', severity: 'HIGH' },
  { id: '2', student: 'Karan Verma', category: 'EMOTIONAL', title: 'Emotional Regulation Difficulty', description: 'Frequent emotional outbursts. Counseling may be beneficial.', severity: 'HIGH' },
  { id: '3', student: 'Isha Sharma', category: 'EMOTIONAL', title: 'Separation Anxiety', description: 'Recurring Monday anxiety pattern. Gradual adjustment plan needed.', severity: 'MEDIUM' },
  { id: '4', student: 'Amit Singh', category: 'LANGUAGE', title: 'Speech Delay', description: 'Vocabulary below age level. Speech therapy evaluation suggested.', severity: 'MEDIUM' },
  { id: '5', student: 'Neha Patel', category: 'SOCIAL', title: 'Social Withdrawal', description: 'Limited peer interaction. Structured social activities recommended.', severity: 'LOW' },
];

const CLASS_COMPARISON = [
  { dimension: 'Cognitive', Nursery: 72, LKG: 80, UKG: 88 },
  { dimension: 'Social', Nursery: 68, LKG: 76, UKG: 85 },
  { dimension: 'Physical', Nursery: 80, LKG: 84, UKG: 90 },
  { dimension: 'Emotional', Nursery: 65, LKG: 73, UKG: 82 },
  { dimension: 'Language', Nursery: 60, LKG: 70, UKG: 86 },
  { dimension: 'Creativity', Nursery: 75, LKG: 78, UKG: 84 },
];

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  Motor: Hand, Cognitive: Brain, Social: Users,
  Language: MessageSquare, Emotional: Heart, Creativity: Sparkles,
};

const SEVERITY_BADGE: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  LOW: 'bg-blue-50 text-blue-700',
};

export default function GrowthAnalysisPage() {
  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" style={{ color: theme.primary }} />
                Growth Analysis
              </h1>
              <p className="text-sm text-gray-500 mt-1">Developmental milestone tracking and early intervention alerts</p>
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </StaggerItem>

        {/* Milestone Tracking */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MILESTONE_TRACKING.map((m) => {
              const growthCfg = GROWTH_COLORS[m.category.toLowerCase()] || GROWTH_COLORS.cognitive;
              const Icon = DIMENSION_ICONS[m.category] || Brain;
              return (
                <PreOneCard key={m.category} variant="strip" className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4" style={{ color: growthCfg.hex }} />
                    <span className="text-sm font-medium text-gray-700">{m.category}</span>
                    {m.alert > 0 && <Badge className="bg-red-50 text-red-700 text-[9px]">{m.alert} alerts</Badge>}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600">On Track</span>
                      <span className="font-medium">{m.onTrack}%</span>
                    </div>
                    <Progress value={m.onTrack} className="h-1.5" />
                    <div className="flex gap-2 text-[10px] text-gray-400">
                      <span className="text-amber-600">{m.behind}% behind</span>
                      <span className="text-blue-600">{m.ahead}% ahead</span>
                    </div>
                  </div>
                </PreOneCard>
              );
            })}
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Early Intervention Alerts */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Early Intervention Alerts
                </h3>
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {INTERVENTION_ALERTS.map((alert) => {
                      const catCfg = OBSERVATION_COLORS[alert.category];
                      return (
                        <div key={alert.id} className="p-3 rounded-xl border-l-4 border-l-red-400 bg-red-50/30 hover:bg-red-50/50 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                            <Badge className={`${SEVERITY_BADGE[alert.severity]} text-[9px]`}>{alert.severity}</Badge>
                          </div>
                          <p className="text-xs text-gray-500">{alert.student}</p>
                          <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${catCfg.bg} ${catCfg.text} text-[9px]`}>{alert.category}</Badge>
                            <Button variant="ghost" size="sm" className="h-5 text-[10px]">
                              Take Action <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
