'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, OBSERVATION_COLORS, PRIORITY_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Brain,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Shield,
  Eye,
  ArrowRight,
  Zap,
  CheckCircle2,
  RefreshCw,
  User,
  Users,
  BarChart3,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface AIInsight {
  id: string;
  type: 'OBSERVATION' | 'RECOMMENDATION' | 'ALERT';
  category: 'COGNITIVE' | 'SOCIAL' | 'PHYSICAL' | 'EMOTIONAL' | 'LANGUAGE' | 'CREATIVE';
  student: string;
  title: string;
  description: string;
  confidence: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  acted: boolean;
}

const MOCK_INSIGHTS: AIInsight[] = [
  { id: '1', type: 'ALERT', category: 'EMOTIONAL', student: 'Isha Sharma', title: 'Separation Anxiety Pattern', description: 'AI detected a recurring pattern of separation anxiety on Mondays. The child takes significantly longer to settle after weekends. Consider implementing a Monday morning welcome routine.', confidence: 89, priority: 'HIGH', createdAt: '2026-06-12 09:30', acted: false },
  { id: '2', type: 'OBSERVATION', category: 'COGNITIVE', student: 'Aarav Kumar', title: 'Accelerated Problem Solving', description: 'This student consistently completes puzzles 40% faster than class average. Consider introducing more challenging cognitive activities to maintain engagement.', confidence: 94, priority: 'MEDIUM', createdAt: '2026-06-11 14:00', acted: false },
  { id: '3', type: 'RECOMMENDATION', category: 'SOCIAL', student: 'Vihaan Singh', title: 'Peer Interaction Opportunity', description: 'Vihaan shows strong leadership during group activities. Recommend pairing with quieter students to encourage peer learning and social development.', confidence: 87, priority: 'MEDIUM', createdAt: '2026-06-10 11:00', acted: true },
  { id: '4', type: 'ALERT', category: 'PHYSICAL', student: 'Meera Joshi', title: 'Fine Motor Delay', description: 'Grip strength measurements are below age-appropriate benchmarks for 3 consecutive months. Recommend assessment by occupational therapist.', confidence: 91, priority: 'HIGH', createdAt: '2026-06-09 16:00', acted: false },
  { id: '5', type: 'OBSERVATION', category: 'LANGUAGE', student: 'Ananya Gupta', title: 'Vocabulary Spurt', description: 'Significant increase in new word usage detected — 28 new words in the past 2 weeks vs class average of 12. Consider introducing more complex vocabulary in activities.', confidence: 92, priority: 'LOW', createdAt: '2026-06-08 10:30', acted: false },
  { id: '6', type: 'RECOMMENDATION', category: 'CREATIVE', student: 'Rohan Mehta', title: 'Art Expression Channel', description: 'Rohan expresses emotions more freely through art than verbal communication. Consider using art-based activities as a bridge to verbal expression.', confidence: 85, priority: 'MEDIUM', createdAt: '2026-06-07 13:00', acted: false },
  { id: '7', type: 'OBSERVATION', category: 'SOCIAL', student: 'Kabir Reddy', title: 'Collaborative Play Growth', description: 'Notable improvement in cooperative play duration — from 5 min average to 18 min. This is above the expected developmental trajectory.', confidence: 88, priority: 'LOW', createdAt: '2026-06-06 15:00', acted: true },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  OBSERVATION: { icon: Eye, color: 'text-blue-700', bg: 'bg-blue-50' },
  RECOMMENDATION: { icon: Lightbulb, color: 'text-amber-700', bg: 'bg-amber-50' },
  ALERT: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50' },
};

export default function AIInsightsPage() {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = filterType === 'all' ? MOCK_INSIGHTS : MOCK_INSIGHTS.filter((i) => i.type === filterType);

  const alertCount = MOCK_INSIGHTS.filter((i) => i.type === 'ALERT').length;
  const unactedCount = MOCK_INSIGHTS.filter((i) => !i.acted).length;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6" style={{ color: theme.primary }} />
                AI Insights
              </h1>
              <p className="text-sm text-gray-500 mt-1">AI-generated observations, recommendations, and alerts</p>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh Insights
            </Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-purple-600" /><span className="text-xs text-gray-500">Total Insights</span></div>
              <p className="text-lg font-bold text-purple-700 mt-1">{MOCK_INSIGHTS.length}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-xs text-gray-500">Alerts</span></div>
              <p className="text-lg font-bold text-red-700 mt-1">{alertCount}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-600" /><span className="text-xs text-gray-500">Pending Action</span></div>
              <p className="text-lg font-bold text-amber-700 mt-1">{unactedCount}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs text-gray-500">Acted On</span></div>
              <p className="text-lg font-bold text-emerald-700 mt-1">{MOCK_INSIGHTS.filter((i) => i.acted).length}</p>
            </PreOneCard>
          </div>
        </StaggerItem>

        {/* Filter */}
        <StaggerItem>
          <div className="flex gap-2">
            {['all', 'OBSERVATION', 'RECOMMENDATION', 'ALERT'].map((t) => (
              <Badge key={t} variant={filterType === t ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setFilterType(t)}>
                {t === 'all' ? 'All' : t}
              </Badge>
            ))}
          </div>
        </StaggerItem>

        {/* Insight Cards */}
        <StaggerItem>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-3">
              {filtered.map((insight) => {
                const typeCfg = TYPE_CONFIG[insight.type];
                const catCfg = OBSERVATION_COLORS[insight.category];
                const TypeIcon = typeCfg.icon;
                const priCfg = PRIORITY_COLORS[insight.priority];
                return (
                  <PreOneCard key={insight.id} variant="strip" className={`p-4 ${insight.type === 'ALERT' ? 'border-l-4 border-l-red-400' : insight.type === 'RECOMMENDATION' ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-blue-400'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${typeCfg.bg} flex items-center justify-center shrink-0`}>
                        <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                            <Badge className={`${priCfg.bg} ${priCfg.text} text-[9px]`}>{insight.priority}</Badge>
                          </div>
                          {insight.acted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{insight.student}</p>
                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <Badge className={`${catCfg.bg} ${catCfg.text} text-[9px]`}>{insight.category}</Badge>
                          <span>Confidence: {insight.confidence}%</span>
                          <span>{insight.createdAt}</span>
                        </div>
                      </div>
                      {!insight.acted && (
                        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">
                          Take Action <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </PreOneCard>
                );
              })}
            </div>
          </ScrollArea>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
