'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES, OBSERVATION_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  WarmPremium,
  WarmCard,
  WarmCardHeader,
  WarmCardTitle,
  WarmCardDescription,
  WarmCardContent,
  WarmCardFooter,
  WarmSectionHeading,
  WarmEmptyState,
  WarmButton,
  WarmStatCard,
  WarmPill,
} from '@/components/warm-premium';
import {
  Eye,
  Plus,
  Clock,
  User,
  Brain,
  Heart,
  Hand,
  BookOpen,
  Sparkles,
  Send,
  X,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

// Matches the Prisma ObservationCategory + Priority enums
const MODEL_CATEGORIES = ['COGNITIVE', 'SOCIAL', 'EMOTIONAL', 'PHYSICAL', 'BEHAVIORAL', 'ACADEMIC'] as const;

interface Observation {
  id: string;
  category: string;
  content: string;
  priority: string;
  teacher: string;
  date: string;
}

interface ApiObservation {
  id: string;
  category: string;
  content: string;
  priority: string;
  createdAt: string;
  teacher?: { firstName: string; lastName: string } | null;
}

const CATEGORY_ICON: Record<string, React.ElementType> = {
  COGNITIVE: Brain, SOCIAL: User, PHYSICAL: Hand,
  EMOTIONAL: Heart, ACADEMIC: BookOpen, BEHAVIORAL: Sparkles,
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-[var(--warm-surface-2)] text-[var(--admin-text-muted)]',
  NORMAL: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-amber-50 text-amber-700',
  CONCERN: 'bg-red-50 text-red-700',
};

const toTitle = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function StudentObservationsPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('COGNITIVE');
  const [newNote, setNewNote] = useState('');
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/students/${studentId}`);
        if (!res.ok) throw new Error('Failed to load observations');
        const data = await res.json();
        const obs: ApiObservation[] = data.student?.observations || [];
        setObservations(obs.map((o) => ({
          id: o.id,
          category: o.category,
          content: o.content,
          priority: o.priority,
          teacher: o.teacher ? `${o.teacher.firstName} ${o.teacher.lastName}` : 'Staff',
          date: o.createdAt,
        })));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load observations');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of observations) m[o.category] = (m[o.category] || 0) + 1;
    return m;
  }, [observations]);

  return (
    <WarmPremium className="min-h-screen">
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <Eye className="w-6 h-6" style={{ color: theme.primary }} />
                Student Observations
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Teacher observations timeline</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" /> Add Observation
            </Button>
          </div>
        </StaggerItem>

        {/* Add Observation Form */}
        {showForm && (
          <StaggerItem>
            <WarmCard variant="emotional" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[var(--admin-text)]">New Observation</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {MODEL_CATEGORIES.map((key) => {
                    const Icon = CATEGORY_ICON[key] || Brain;
                    return (
                      <Badge
                        key={key}
                        variant={newCategory === key ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => setNewCategory(key)}
                      >
                        <Icon className="w-3 h-3 mr-1" /> {toTitle(key)}
                      </Badge>
                    );
                  })}
                </div>
                <Textarea placeholder="Describe your observation..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-sky-500 text-white">
                    <Send className="w-3 h-3 mr-1" /> Save
                  </Button>
                </div>
              </div>
            </WarmCard>
          </StaggerItem>
        )}

        {/* Category Stats */}
        <StaggerItem>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {MODEL_CATEGORIES.map((key) => {
              const cfg = OBSERVATION_COLORS[key] || OBSERVATION_COLORS.COGNITIVE;
              const Icon = CATEGORY_ICON[key] || Brain;
              return (
                <WarmCard key={key} variant="strip" className="p-3 text-center">
                  <Icon className={`w-5 h-5 mx-auto ${cfg.text}`} />
                  <p className="text-[10px] text-[var(--admin-text-muted)] mt-1 capitalize">{toTitle(key)}</p>
                  <p className="text-sm font-bold" style={{ color: cfg.hex }}>{categoryCounts[key] || 0}</p>
                </WarmCard>
              );
            })}
          </div>
        </StaggerItem>

        {/* Timeline */}
        <StaggerItem>
          <WarmCard variant="default">
            <WarmCardContent>
              <h3 className="font-semibold text-[var(--admin-text)] mb-4">Observation Timeline</h3>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-[var(--admin-text-subtle)]"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading observations…</div>
              ) : error ? (
                <div className="py-12 text-center text-red-500 text-sm">{error}</div>
              ) : observations.length === 0 ? (
                <div className="py-12 text-center text-[var(--admin-text-subtle)] text-sm">No observations recorded for this student yet.</div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="relative pl-6 border-l-2 border-[var(--warm-border)] space-y-6">
                    {observations.map((obs) => {
                      const cfg = OBSERVATION_COLORS[obs.category] || OBSERVATION_COLORS.COGNITIVE;
                      const Icon = CATEGORY_ICON[obs.category] || Brain;
                      return (
                        <div key={obs.id} className="relative">
                          <div className={`absolute -left-[31px] w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center border-2 border-white`}>
                            <Icon className={`w-3 h-3 ${cfg.text}`} />
                          </div>
                          <div className="ml-4 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-[var(--admin-text)]">{toTitle(obs.category)}</h4>
                              <Badge className={`${PRIORITY_BADGE[obs.priority] || 'bg-[var(--warm-surface-2)] text-[var(--admin-text-muted)]'} text-[9px]`}>{obs.priority}</Badge>
                            </div>
                            <p className="text-sm text-[var(--admin-text-muted)] mb-2">{obs.content}</p>
                            <div className="flex items-center gap-3 text-xs text-[var(--admin-text-subtle)]">
                              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {obs.teacher}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(obs.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <Badge className={`${cfg.bg} ${cfg.text} text-[9px]`}>{toTitle(obs.category)}</Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </WarmCardContent>
          </WarmCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
    </WarmPremium>
  );
}
