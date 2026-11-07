'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, OBSERVATION_COLORS, PRIORITY_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Brain,
  AlertTriangle,
  Lightbulb,
  Eye,
  ArrowRight,
  Zap,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface AIInsight {
  id: string;
  type: string;
  category: string;
  student: string;
  title: string;
  description: string;
  priority: string;
  createdAt: string;
  acted: boolean;
}

// Shape from GET /api/growth/ai-observations
interface ApiInsight {
  id: string;
  studentName: string;
  insight: string;
  dimension: string | null;
  severity: string | null;
  isActioned: boolean;
  createdAt: string;
}

const SEV_TO_TYPE: Record<string, string> = { high: 'ALERT', medium: 'RECOMMENDATION', low: 'OBSERVATION' };
const SEV_TO_PRIORITY: Record<string, string> = { high: 'HIGH', medium: 'MEDIUM', low: 'LOW' };
const DIM_TO_CATEGORY: Record<string, string> = {
  cognitive: 'COGNITIVE', social: 'SOCIAL', 'social skills': 'SOCIAL', physical: 'PHYSICAL',
  creativity: 'CREATIVE', communication: 'LANGUAGE', confidence: 'EMOTIONAL',
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  OBSERVATION: { icon: Eye, color: 'text-blue-700', bg: 'bg-blue-50' },
  RECOMMENDATION: { icon: Lightbulb, color: 'text-amber-700', bg: 'bg-amber-50' },
  ALERT: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50' },
};

function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export default function AIInsightsPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/growth/ai-observations');
        if (!res.ok) throw new Error('Failed to load AI insights');
        const data = await res.json();
        const mapped: AIInsight[] = (data.observations || []).map((o: ApiInsight) => {
          const sev = (o.severity || 'low').toLowerCase();
          const dim = (o.dimension || '').toLowerCase();
          return {
            id: o.id,
            type: SEV_TO_TYPE[sev] || 'OBSERVATION',
            category: DIM_TO_CATEGORY[dim] || 'COGNITIVE',
            student: o.studentName,
            title: o.dimension ? `${cap(o.dimension)} insight` : 'Insight',
            description: o.insight,
            priority: SEV_TO_PRIORITY[sev] || 'LOW',
            createdAt: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            acted: o.isActioned,
          };
        });
        setInsights(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load AI insights');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => (filterType === 'all' ? insights : insights.filter((i) => i.type === filterType)),
    [insights, filterType]
  );
  const alertCount = insights.filter((i) => i.type === 'ALERT').length;
  const unactedCount = insights.filter((i) => !i.acted).length;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <Sparkles className="w-6 h-6" style={{ color: theme.primary }} />
                AI Insights
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">AI-generated observations, recommendations, and alerts</p>
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
              <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-purple-600" /><span className="text-xs text-[var(--admin-text-muted)]">Total Insights</span></div>
              <p className="text-lg font-bold text-purple-700 mt-1">{insights.length}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-xs text-[var(--admin-text-muted)]">Alerts</span></div>
              <p className="text-lg font-bold text-red-700 mt-1">{alertCount}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-600" /><span className="text-xs text-[var(--admin-text-muted)]">Pending Action</span></div>
              <p className="text-lg font-bold text-amber-700 mt-1">{unactedCount}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs text-[var(--admin-text-muted)]">Acted On</span></div>
              <p className="text-lg font-bold text-emerald-700 mt-1">{insights.filter((i) => i.acted).length}</p>
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
          {loading ? (
            <p className="text-sm text-[var(--admin-text-subtle)] py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading insights…</p>
          ) : error ? (
            <p className="text-sm text-red-500 py-10 text-center">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[var(--admin-text-subtle)] py-10 text-center">No AI insights yet.</p>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3">
                {filtered.map((insight) => {
                  const typeCfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.OBSERVATION;
                  const catCfg = OBSERVATION_COLORS[insight.category] || OBSERVATION_COLORS.COGNITIVE;
                  const TypeIcon = typeCfg.icon;
                  const priCfg = PRIORITY_COLORS[insight.priority] || PRIORITY_COLORS.LOW;
                  return (
                    <PreOneCard key={insight.id} variant="strip" className={`p-4 ${insight.type === 'ALERT' ? 'border-l-4 border-l-red-400' : insight.type === 'RECOMMENDATION' ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-blue-400'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${typeCfg.bg} flex items-center justify-center shrink-0`}>
                          <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-[var(--admin-text)]">{insight.title}</h4>
                              <Badge className={`${priCfg.bg} ${priCfg.text} text-[9px]`}>{insight.priority}</Badge>
                            </div>
                            {insight.acted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <p className="text-xs text-[var(--admin-text-muted)] mb-1">{insight.student}</p>
                          <p className="text-sm text-[var(--admin-text-muted)] mb-2">{insight.description}</p>
                          <div className="flex items-center gap-3 text-xs text-[var(--admin-text-subtle)]">
                            <Badge className={`${catCfg.bg} ${catCfg.text} text-[9px]`}>{insight.category}</Badge>
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
          )}
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
