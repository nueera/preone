'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES, OBSERVATION_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  Plus,
  Send,
  X,
  Clock,
  User,
  Brain,
  Heart,
  Hand,
  BookOpen,
  Sparkles,
  Camera,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface GrowthObservation {
  id: string;
  student: string;
  category: string;
  content: string;
  teacher: string;
  date: string;
  photo?: boolean;
}

const CATEGORY_ICON: Record<string, React.ElementType> = {
  COGNITIVE: Brain, SOCIAL: User, PHYSICAL: Hand,
  EMOTIONAL: Heart, LANGUAGE: BookOpen, CREATIVE: Sparkles,
};

export default function GrowthObservationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('COGNITIVE');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [observations, setObservations] = useState<GrowthObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/growth/observations');
        if (!res.ok) throw new Error('Failed to load observations');
        const data = await res.json();
        setObservations(data.observations || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load observations');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredObs = useMemo(
    () => (filterCategory === 'all' ? observations : observations.filter((o) => o.category === filterCategory)),
    [observations, filterCategory]
  );

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <Eye className="w-6 h-6" style={{ color: theme.primary }} />
                Growth Observations
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Teacher observations and developmental tracking</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" /> Add Observation
            </Button>
          </div>
        </StaggerItem>

        {/* Add Form (shell) */}
        {showForm && (
          <StaggerItem>
            <PreOneCard variant="emotional" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[var(--admin-text)]">New Growth Observation</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Student name..." />
                <div className="flex flex-wrap gap-2">
                  {Object.entries(OBSERVATION_COLORS).map(([key, cfg]) => {
                    const Icon = CATEGORY_ICON[key] || Brain;
                    return (
                      <Badge key={key} variant={newCategory === key ? 'default' : 'outline'} className={`cursor-pointer text-xs ${newCategory !== key ? cfg.text : ''}`} onClick={() => setNewCategory(key)}>
                        <Icon className="w-3 h-3 mr-1" /> {key}
                      </Badge>
                    );
                  })}
                </div>
                <Input placeholder="Observation title..." />
                <Textarea placeholder="Describe your observation..." rows={3} />
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm"><Camera className="w-3 h-3 mr-1" /> Add Photo</Button>
                  <Input placeholder="Related milestone (optional)..." className="flex-1" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-sky-500 text-white"><Send className="w-3 h-3 mr-1" /> Save</Button>
                </div>
              </div>
            </PreOneCard>
          </StaggerItem>
        )}

        {/* Category Filter */}
        <StaggerItem>
          <div className="flex flex-wrap gap-2">
            <Badge variant={filterCategory === 'all' ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setFilterCategory('all')}>All</Badge>
            {Object.entries(OBSERVATION_COLORS).map(([key, cfg]) => (
              <Badge key={key} variant={filterCategory === key ? 'default' : 'outline'} className={`cursor-pointer text-xs ${filterCategory !== key ? cfg.text : ''}`} onClick={() => setFilterCategory(key)}>
                {key}
              </Badge>
            ))}
          </div>
        </StaggerItem>

        {/* Timeline */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-[var(--admin-text)] mb-4">Observations Timeline</h3>
              {loading ? (
                <p className="text-sm text-[var(--admin-text-subtle)] py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading observations…</p>
              ) : error ? (
                <p className="text-sm text-red-500 py-10 text-center">{error}</p>
              ) : filteredObs.length === 0 ? (
                <p className="text-sm text-[var(--admin-text-subtle)] py-10 text-center">No observations recorded yet.</p>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="relative pl-6 border-l-2 border-[var(--admin-border)] space-y-6">
                    {filteredObs.map((obs) => {
                      const cfg = OBSERVATION_COLORS[obs.category] || OBSERVATION_COLORS.COGNITIVE;
                      const Icon = CATEGORY_ICON[obs.category] || Brain;
                      return (
                        <div key={obs.id} className="relative">
                          <div className={`absolute -left-[31px] w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center border-2 border-white`}>
                            <Icon className={`w-3 h-3 ${cfg.text}`} />
                          </div>
                          <div className="ml-4 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-[var(--admin-text)]">{obs.student}</p>
                              <div className="flex items-center gap-1.5">
                                {obs.photo && <Badge className="bg-sky-50 text-sky-700 text-[9px]"><Camera className="w-2.5 h-2.5 mr-0.5" /> Photo</Badge>}
                                <Badge className={`${cfg.bg} ${cfg.text} text-[9px]`}>{obs.category}</Badge>
                              </div>
                            </div>
                            <p className="text-sm text-[var(--admin-text-muted)] mb-2">{obs.content}</p>
                            <div className="flex items-center gap-3 text-xs text-[var(--admin-text-subtle)]">
                              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {obs.teacher}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(obs.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
