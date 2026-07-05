'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import {
  Plus,
  Search,
  Brain,
  Users,
  Baby,
  MessageSquare,
  Target,
  Star,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface MilestoneTemplate {
  id: string;
  name: string;
  category: string;
  ageRange: string;
  description: string;
}

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; hex: string }> = {
  Motor:     { color: 'text-orange-700', bg: 'bg-orange-50', icon: Baby, hex: '#f97316' },
  Cognitive: { color: 'text-purple-700', bg: 'bg-purple-50', icon: Brain, hex: '#7c3aed' },
  Social:    { color: 'text-green-700', bg: 'bg-green-50', icon: Users, hex: '#22c55e' },
  Language:  { color: 'text-sky-700', bg: 'bg-sky-50', icon: MessageSquare, hex: '#0ea5e9' },
};
const FALLBACK_CFG = { color: 'text-[var(--admin-text-muted)]', bg: 'bg-[var(--admin-surface-2)]', icon: Target, hex: '#6b7280' };
const cfgFor = (cat: string) => CATEGORY_CONFIG[cat] || FALLBACK_CFG;

export default function MilestonesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [milestones, setMilestones] = useState<MilestoneTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/growth/milestones');
        if (!res.ok) throw new Error('Failed to load milestones');
        const data = await res.json();
        const mapped: MilestoneTemplate[] = (data.milestones || []).map((m: { id: string; name: string; category: string; ageGroup: string; description: string | null }) => ({
          id: m.id,
          name: m.name,
          category: m.category,
          ageRange: m.ageGroup,
          description: m.description || '',
        }));
        setMilestones(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load milestones');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      const matchSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || m.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [milestones, searchQuery, categoryFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, MilestoneTemplate[]> = {};
    filteredMilestones.forEach((m) => {
      const c = m.category || 'Other';
      if (!groups[c]) groups[c] = [];
      groups[c].push(m);
    });
    return groups;
  }, [filteredMilestones]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <Target className="w-6 h-6" style={{ color: theme.primary }} />
                Milestone Templates
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Developmental milestones by category</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Milestone
            </Button>
          </div>
        </StaggerItem>

        {/* Category Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => {
              const Icon = cfg.icon;
              const count = milestones.filter((m) => m.category === cat).length;
              return (
                <PreOneCard
                  key={cat}
                  variant="strip"
                  hover
                  className={`p-4 cursor-pointer ${categoryFilter === cat ? 'ring-2 ring-purple-400' : ''}`}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--admin-text-muted)]">{cat}</p>
                      <p className="text-lg font-bold" style={{ color: cfg.hex }}>{count}</p>
                    </div>
                  </div>
                </PreOneCard>
              );
            })}
          </div>
        </StaggerItem>

        {/* Search */}
        <StaggerItem>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-subtle)]" />
            <Input placeholder="Search milestones..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </StaggerItem>

        {/* Grid by Category */}
        {loading ? (
          <StaggerItem><PreOneCard variant="default" className="p-12 text-center text-[var(--admin-text-subtle)]"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading milestones…</PreOneCard></StaggerItem>
        ) : error ? (
          <StaggerItem><PreOneCard variant="default" className="p-12 text-center text-red-500 text-sm">{error}</PreOneCard></StaggerItem>
        ) : milestones.length === 0 ? (
          <StaggerItem><PreOneCard variant="default" className="p-12 text-center text-[var(--admin-text-subtle)] text-sm">No milestone templates defined yet.</PreOneCard></StaggerItem>
        ) : (
          Object.entries(grouped).map(([category, list]) => {
            const cfg = cfgFor(category);
            const Icon = cfg.icon;
            return (
              <StaggerItem key={category}>
                <PreOneCard variant="default">
                  <PreOneCardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <h3 className="font-semibold text-[var(--admin-text)]">{category} Development</h3>
                      <Badge className={`${cfg.bg} ${cfg.color} text-[10px]`}>{list.length} milestones</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {list.map((m) => (
                        <div key={m.id} className="p-3 rounded-xl border hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-[var(--admin-text)]">{m.name}</h4>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          </div>
                          <p className="text-xs text-[var(--admin-text-muted)] mb-2">{m.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[9px]">{m.ageRange}</Badge>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px]">Edit</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PreOneCardContent>
                </PreOneCard>
              </StaggerItem>
            );
          })
        )}
      </StaggerContainer>
    </PageTransition>
  );
}
