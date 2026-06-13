'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES, OBSERVATION_COLORS, PRIORITY_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Search,
  Users,
  Heart,
  Hand,
  MessageSquare,
  Sparkles,
  Eye,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Baby as ChildIcon,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface ChildInsight {
  id: string;
  student: string;
  class: string;
  category: 'COGNITIVE' | 'SOCIAL' | 'PHYSICAL' | 'EMOTIONAL' | 'LANGUAGE' | 'CREATIVE';
  insightType: 'BEHAVIORAL' | 'ACADEMIC' | 'SOCIAL';
  title: string;
  description: string;
  confidence: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  date: string;
}

const MOCK_INSIGHTS: ChildInsight[] = [
  { id: '1', student: 'Aarav Kumar', class: 'Nursery-A', category: 'COGNITIVE', insightType: 'ACADEMIC', title: 'Accelerated Problem Solving', description: 'Completes puzzles 40% faster than class average. Consider introducing more challenging cognitive activities.', confidence: 94, priority: 'MEDIUM', trend: 'IMPROVING', date: '2026-06-12' },
  { id: '2', student: 'Isha Sharma', class: 'Nursery-B', category: 'EMOTIONAL', insightType: 'BEHAVIORAL', title: 'Monday Separation Anxiety', description: 'Recurring pattern of separation anxiety on Mondays. Takes significantly longer to settle after weekends.', confidence: 89, priority: 'HIGH', trend: 'STABLE', date: '2026-06-12' },
  { id: '3', student: 'Meera Joshi', class: 'LKG-B', category: 'PHYSICAL', insightType: 'ACADEMIC', title: 'Fine Motor Delay', description: 'Grip strength below age-appropriate benchmarks for 3 consecutive months. Recommend OT assessment.', confidence: 91, priority: 'HIGH', trend: 'DECLINING', date: '2026-06-11' },
  { id: '4', student: 'Ananya Gupta', class: 'UKG-B', category: 'LANGUAGE', insightType: 'ACADEMIC', title: 'Vocabulary Spurt', description: '28 new words in 2 weeks vs class average of 12. Consider introducing more complex vocabulary.', confidence: 92, priority: 'LOW', trend: 'IMPROVING', date: '2026-06-10' },
  { id: '5', student: 'Vihaan Singh', class: 'UKG-A', category: 'SOCIAL', insightType: 'SOCIAL', title: 'Leadership Emergence', description: 'Shows strong leadership during group activities. Could benefit from structured leadership opportunities.', confidence: 87, priority: 'MEDIUM', trend: 'IMPROVING', date: '2026-06-09' },
  { id: '6', student: 'Arjun Patel', class: 'LKG-A', category: 'CREATIVE', insightType: 'BEHAVIORAL', title: 'Art as Expression Channel', description: 'Expresses emotions more freely through art than verbal communication. Art-based bridging recommended.', confidence: 85, priority: 'MEDIUM', trend: 'STABLE', date: '2026-06-08' },
  { id: '7', student: 'Rohan Mehta', class: 'Nursery-A', category: 'SOCIAL', insightType: 'SOCIAL', title: 'Collaborative Play Growth', description: 'Cooperative play duration improved from 5 min to 18 min average. Above expected trajectory.', confidence: 88, priority: 'LOW', trend: 'IMPROVING', date: '2026-06-07' },
];

const CATEGORY_ICON: Record<string, React.ElementType> = {
  COGNITIVE: Brain, SOCIAL: Users, PHYSICAL: Hand,
  EMOTIONAL: Heart, LANGUAGE: MessageSquare, CREATIVE: Sparkles,
};

const TREND_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  IMPROVING: { icon: TrendingUp, color: 'text-emerald-600' },
  STABLE: { icon: TrendingUp, color: 'text-blue-600' },
  DECLINING: { icon: TrendingDown, color: 'text-red-600' },
};

export default function ChildInsightsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return MOCK_INSIGHTS.filter((i) => {
      const matchSearch = !searchQuery || i.student.toLowerCase().includes(searchQuery.toLowerCase()) || i.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || i.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [searchQuery, categoryFilter]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ChildIcon className="w-6 h-6" style={{ color: theme.primary }} />
              Child Insights
            </h1>
            <p className="text-sm text-gray-500 mt-1">AI-generated behavioral, academic, and social insights</p>
          </div>
        </StaggerItem>

        {/* Search */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search by student name or insight title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={categoryFilter === 'all' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setCategoryFilter('all')}>All</Badge>
              {Object.entries(OBSERVATION_COLORS).map(([key, cfg]) => (
                <Badge key={key} variant={categoryFilter === key ? 'default' : 'outline'} className={`cursor-pointer text-[10px] ${categoryFilter !== key ? cfg.text : ''}`} onClick={() => setCategoryFilter(key)}>{key}</Badge>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Insights List */}
        <StaggerItem>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-3">
              {filtered.map((insight) => {
                const catCfg = OBSERVATION_COLORS[insight.category];
                const CatIcon = CATEGORY_ICON[insight.category];
                const priCfg = PRIORITY_COLORS[insight.priority];
                const trendCfg = TREND_CONFIG[insight.trend];
                const TrendIcon = trendCfg.icon;
                return (
                  <PreOneCard key={insight.id} variant="strip" className={`p-4 ${insight.priority === 'HIGH' ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${catCfg.bg} flex items-center justify-center shrink-0`}>
                        <CatIcon className={`w-5 h-5 ${catCfg.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                          <Badge className={`${priCfg.bg} ${priCfg.text} text-[9px]`}>{insight.priority}</Badge>
                          <TrendIcon className={`w-3.5 h-3.5 ${trendCfg.color}`} />
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{insight.student} • {insight.class}</p>
                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <Badge className={`${catCfg.bg} ${catCfg.text} text-[9px]`}>{insight.category}</Badge>
                          <Badge variant="outline" className="text-[9px]">{insight.insightType}</Badge>
                          <span>Confidence: {insight.confidence}%</span>
                          <span>{insight.date}</span>
                        </div>
                        <div className="mt-2">
                          <Progress value={insight.confidence} className="h-1 w-24" />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0">
                        Details <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
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
