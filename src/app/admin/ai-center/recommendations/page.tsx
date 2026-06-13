'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, PRIORITY_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Lightbulb,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'STUDENT' | 'CLASS' | 'TEACHER' | 'SYSTEM';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'COMPLETED' | 'DISMISSED';
  actionItems: string[];
  student?: string;
  impact: string;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { id: '1', title: 'Fine Motor Intervention Program', description: 'Implement a structured fine motor skills program for 3 students showing developmental delays. Include daily 15-minute activities focusing on grip strength and hand-eye coordination.', category: 'STUDENT', priority: 'HIGH', status: 'ACTIVE', actionItems: ['Schedule OT assessment for Meera Joshi', 'Prepare fine motor activity kits', 'Set up weekly progress tracking'], student: 'Meera Joshi', impact: 'High — Direct impact on 3 students', effort: 'MEDIUM', createdAt: '2026-06-12' },
  { id: '2', title: 'Monday Morning Welcome Routine', description: 'Introduce a structured Monday morning welcome routine to help students with separation anxiety transition more smoothly after weekends.', category: 'CLASS', priority: 'HIGH', status: 'ACTIVE', actionItems: ['Design welcome routine with teachers', 'Communicate plan to affected parents', 'Track Monday attendance patterns'], student: 'Isha Sharma', impact: 'Medium — Benefits 5+ students', effort: 'LOW', createdAt: '2026-06-11' },
  { id: '3', title: 'Peer Learning Groups', description: 'Create structured peer learning groups pairing socially confident students with quieter peers to encourage social development through guided interaction.', category: 'CLASS', priority: 'MEDIUM', status: 'ACTIVE', actionItems: ['Identify peer learning pairs', 'Create group activity plans', 'Monitor interaction quality'], impact: 'Medium — Improves social skills across class', effort: 'MEDIUM', createdAt: '2026-06-10' },
  { id: '4', title: 'Advanced Cognitive Activities', description: 'Introduce more challenging problem-solving activities for students who are ahead of their peers in cognitive development to maintain engagement.', category: 'STUDENT', priority: 'MEDIUM', status: 'ACTIVE', actionItems: ['Curate advanced activity sets', 'Train teachers on differentiation', 'Set up enrichment corner'], student: 'Aarav Kumar', impact: 'Medium — Maintains engagement for advanced learners', effort: 'MEDIUM', createdAt: '2026-06-09' },
  { id: '5', title: 'Art-Based Emotional Expression', description: 'Use art-based activities as a bridge to verbal expression for students who communicate emotions better through creative media.', category: 'STUDENT', priority: 'LOW', status: 'COMPLETED', actionItems: ['Prepare art materials', 'Design guided art prompts', 'Schedule parent workshop'], student: 'Arjun Patel', impact: 'Low — Targeted intervention for 2 students', effort: 'LOW', createdAt: '2026-06-08' },
  { id: '6', title: 'Teacher Training: Observation Techniques', description: 'Conduct a workshop on systematic observation techniques to improve the quality and consistency of teacher observations.', category: 'TEACHER', priority: 'MEDIUM', status: 'ACTIVE', actionItems: ['Schedule workshop date', 'Prepare training materials', 'Set up practice sessions'], impact: 'High — Improves data quality for all AI insights', effort: 'HIGH', createdAt: '2026-06-07' },
  { id: '7', title: 'Automated Fee Reminder Optimization', description: 'Optimize fee reminder timing based on payment pattern analysis. Send first reminder 5 days before due date instead of on due date.', category: 'SYSTEM', priority: 'LOW', status: 'DISMISSED', actionItems: ['Analyze payment patterns', 'Update reminder schedule', 'A/B test timing'], impact: 'Medium — Could reduce overdue by 20%', effort: 'LOW', createdAt: '2026-06-05' },
];

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  STUDENT: { color: 'text-purple-700', bg: 'bg-purple-50', icon: Target },
  CLASS: { color: 'text-blue-700', bg: 'bg-blue-50', icon: Filter },
  TEACHER: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: Sparkles },
  SYSTEM: { color: 'text-gray-700', bg: 'bg-gray-50', icon: Zap },
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  DISMISSED: 'bg-gray-50 text-gray-700',
};

export default function RecommendationsPage() {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return MOCK_RECOMMENDATIONS.filter((r) => {
      const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchPriority && matchStatus;
    });
  }, [priorityFilter, statusFilter]);

  const activeCount = MOCK_RECOMMENDATIONS.filter((r) => r.status === 'ACTIVE').length;
  const completedCount = MOCK_RECOMMENDATIONS.filter((r) => r.status === 'COMPLETED').length;
  const highPriorityCount = MOCK_RECOMMENDATIONS.filter((r) => r.priority === 'HIGH' && r.status === 'ACTIVE').length;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6" style={{ color: theme.primary }} />
            AI Recommendations
          </h1>
          <p className="text-sm text-gray-500 mt-1">Personalized recommendations with action items and priority levels</p>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-blue-600" /><span className="text-xs text-gray-500">Active</span></div>
              <p className="text-lg font-bold text-blue-700 mt-1">{activeCount}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs text-gray-500">Completed</span></div>
              <p className="text-lg font-bold text-emerald-700 mt-1">{completedCount}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-xs text-gray-500">High Priority</span></div>
              <p className="text-lg font-bold text-red-700 mt-1">{highPriorityCount}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-xs text-gray-500">Avg Effort</span></div>
              <p className="text-lg font-bold text-amber-700 mt-1">Medium</p>
            </PreOneCard>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1.5">
              <span className="text-xs text-gray-400 self-center">Priority:</span>
              {['all', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <Badge key={p} variant={priorityFilter === p ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setPriorityFilter(p)}>{p === 'all' ? 'All' : p}</Badge>
              ))}
            </div>
            <div className="flex gap-1.5">
              <span className="text-xs text-gray-400 self-center">Status:</span>
              {['all', 'ACTIVE', 'COMPLETED', 'DISMISSED'].map((s) => (
                <Badge key={s} variant={statusFilter === s ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setStatusFilter(s)}>{s === 'all' ? 'All' : s}</Badge>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Recommendations */}
        <StaggerItem>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-3">
              {filtered.map((rec) => {
                const catCfg = CATEGORY_CONFIG[rec.category];
                const CatIcon = catCfg.icon;
                const priCfg = PRIORITY_COLORS[rec.priority];
                return (
                  <PreOneCard key={rec.id} variant="strip" className={`p-4 ${rec.priority === 'HIGH' && rec.status === 'ACTIVE' ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${catCfg.bg} flex items-center justify-center shrink-0`}>
                        <CatIcon className={`w-5 h-5 ${catCfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-sm font-medium text-gray-900">{rec.title}</h4>
                          <Badge className={`${priCfg.bg} ${priCfg.text} text-[9px]`}>{rec.priority}</Badge>
                          <Badge className={`${STATUS_BADGE[rec.status]} text-[9px]`}>{rec.status}</Badge>
                          <Badge className={`${catCfg.bg} ${catCfg.color} text-[9px]`}>{rec.category}</Badge>
                        </div>
                        {rec.student && <p className="text-xs text-gray-500 mb-1">Student: {rec.student}</p>}
                        <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Action Items:</p>
                          <ul className="space-y-0.5">
                            {rec.actionItems.map((item, i) => (
                              <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>Impact: {rec.impact}</span>
                          <span>Effort: {rec.effort}</span>
                          <span>{rec.createdAt}</span>
                        </div>
                      </div>
                      {rec.status === 'ACTIVE' && (
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-violet-600 to-sky-500 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs">Dismiss</Button>
                        </div>
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
