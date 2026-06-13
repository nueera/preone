'use client';

import React from 'react';
import Link from 'next/link';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, PRIORITY_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Brain,
  BarChart3,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Baby as ChildIcon,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Eye,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

const INSIGHT_CARDS = [
  { key: 'child', title: 'Child Insights', description: 'Individual child development insights and growth patterns identified by AI', icon: ChildIcon, badge: '8 new', badgeColor: 'bg-blue-50 text-blue-700', stats: ['109 students', '6 dimensions', 'Daily updates'], href: '/admin/ai-center/child-insights' },
  { key: 'admission', title: 'Admission Insights', description: 'Pipeline analytics, conversion predictions, and source optimization', icon: BarChart3, badge: '3 new', badgeColor: 'bg-purple-50 text-purple-700', stats: ['156 leads', '42% conversion', 'Recommendations'], href: '/admin/ai-center/admission-insights' },
  { key: 'growth', title: 'Growth Analysis', description: 'Class-wide and individual growth trend analysis with benchmarks', icon: TrendingUp, badge: '5 new', badgeColor: 'bg-emerald-50 text-emerald-700', stats: ['6 dimensions', 'Weekly updates', 'Benchmarks'], href: '/admin/ai-center/growth-analysis' },
  { key: 'recommendations', title: 'Recommendations', description: 'Actionable AI recommendations for teachers and administrators', icon: Lightbulb, badge: '2 urgent', badgeColor: 'bg-red-50 text-red-700', stats: ['12 active', '8 completed', '4 pending'], href: '/admin/ai-center/recommendations' },
];

const RECENT_OBSERVATIONS = [
  { id: '1', student: 'Aarav Kumar', type: 'OBSERVATION', category: 'Cognitive', title: 'Accelerated Problem Solving', time: '2h ago', priority: 'MEDIUM' },
  { id: '2', student: 'Isha Sharma', type: 'ALERT', category: 'Emotional', title: 'Separation Anxiety Pattern', time: '4h ago', priority: 'HIGH' },
  { id: '3', student: 'Meera Joshi', type: 'ALERT', category: 'Physical', title: 'Fine Motor Delay', time: '8h ago', priority: 'HIGH' },
  { id: '4', student: 'Ananya Gupta', type: 'OBSERVATION', category: 'Language', title: 'Vocabulary Spurt', time: '1d ago', priority: 'LOW' },
  { id: '5', student: 'Vihaan Singh', type: 'RECOMMENDATION', category: 'Social', title: 'Peer Interaction Opportunity', time: '1d ago', priority: 'MEDIUM' },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  OBSERVATION: { icon: Eye, color: 'text-blue-600' },
  ALERT: { icon: AlertTriangle, color: 'text-red-600' },
  RECOMMENDATION: { icon: Lightbulb, color: 'text-amber-600' },
};

export default function AICenterPage() {
  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6" style={{ color: theme.primary }} />
              AI Center
            </h1>
            <p className="text-sm text-gray-500 mt-1">AI-powered insights, analysis, and recommendations</p>
          </div>
        </StaggerItem>

        {/* Insight Cards */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INSIGHT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.key} href={card.href}>
                  <PreOneCard variant="strip" hover className="p-5 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{card.title}</h3>
                      </div>
                      <Badge className={`${card.badgeColor} text-[10px]`}>{card.badge}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{card.description}</p>
                    <div className="flex items-center gap-4 pt-2 border-t text-xs text-gray-400">
                      {card.stats.map((s, i) => (
                        <span key={i}>{i > 0 && '• '}{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: theme.primary }}>
                      Explore <ArrowRight className="w-3 h-3" />
                    </div>
                  </PreOneCard>
                </Link>
              );
            })}
          </div>
        </StaggerItem>

        {/* Recent AI Observations */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" /> Recent AI Observations
                </h3>
                <Button variant="outline" size="sm" className="h-7 text-xs">View All</Button>
              </div>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {RECENT_OBSERVATIONS.map((obs) => {
                    const typeCfg = TYPE_CONFIG[obs.type];
                    const TypeIcon = typeCfg.icon;
                    const priCfg = PRIORITY_COLORS[obs.priority];
                    return (
                      <div key={obs.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className={`w-8 h-8 rounded-lg ${obs.type === 'ALERT' ? 'bg-red-50' : obs.type === 'RECOMMENDATION' ? 'bg-amber-50' : 'bg-blue-50'} flex items-center justify-center shrink-0`}>
                          <TypeIcon className={`w-4 h-4 ${typeCfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{obs.title}</p>
                          <p className="text-xs text-gray-400">{obs.student} • {obs.category}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`${priCfg.bg} ${priCfg.text} text-[9px]`}>{obs.priority}</Badge>
                          <span className="text-[10px] text-gray-400">{obs.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Quick Actions */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Run Analysis', icon: Brain, desc: 'Trigger AI analysis on new data' },
                  { label: 'Generate Report', icon: Target, desc: 'Create growth summary report' },
                  { label: 'View Alerts', icon: AlertTriangle, desc: 'Check high-priority alerts' },
                  { label: 'Browse Insights', icon: Eye, desc: 'Explore all AI observations' },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button key={action.label} variant="outline" className="h-auto p-3 flex flex-col items-center gap-2 text-center">
                      <Icon className="w-5 h-5 text-purple-500" />
                      <span className="text-xs font-medium">{action.label}</span>
                      <span className="text-[10px] text-gray-400">{action.desc}</span>
                    </Button>
                  );
                })}
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
