'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES, GROWTH_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trophy,
  Plus,
  Search,
  Award,
  Star,
  Target,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Achievement {
  id: string;
  student: string;
  title: string;
  category: string;
  type: string;
  date: string;
  description: string;
  icon: string;
}

// Shape from GET /api/growth/achievements
interface ApiAchievement {
  id: string;
  student: string;
  title: string;
  description: string;
  icon: string;
  date: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  CERTIFICATE: { icon: Award, color: 'text-purple-700', bg: 'bg-purple-50' },
  BADGE: { icon: Star, color: 'text-amber-700', bg: 'bg-amber-50' },
  MILESTONE: { icon: Target, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  AWARD: { icon: Trophy, color: 'text-pink-700', bg: 'bg-pink-50' },
};

export default function AchievementsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/growth/achievements');
        if (!res.ok) throw new Error('Failed to load achievements');
        const data = await res.json();
        const mapped: Achievement[] = (data.achievements || []).map((a: ApiAchievement) => ({
          id: a.id,
          student: a.student,
          title: a.title,
          description: a.description,
          icon: a.icon || '🏆',
          date: a.date,
          // The Achievement model has no type/category — default for display.
          type: 'BADGE',
          category: 'general',
        }));
        setAchievements(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load achievements');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return achievements.filter((a) => {
      const matchSearch = !searchQuery || a.student.toLowerCase().includes(searchQuery.toLowerCase()) || a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [achievements, searchQuery, typeFilter]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-6 h-6" style={{ color: theme.primary }} />
                Achievements
              </h1>
              <p className="text-sm text-gray-500 mt-1">Certificates, badges, milestones, and awards</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Achievement
            </Button>
          </div>
        </StaggerItem>

        {/* Type Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
              const Icon = cfg.icon;
              const count = achievements.filter((a) => a.type === type).length;
              return (
                <PreOneCard key={type} variant="strip" hover className={`p-4 cursor-pointer ${typeFilter === type ? 'ring-2 ring-purple-400' : ''}`} onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{type}</p>
                      <p className="text-lg font-bold" style={{ color: theme.primary }}>{count}</p>
                    </div>
                  </div>
                </PreOneCard>
              );
            })}
          </div>
        </StaggerItem>

        {/* Search */}
        <StaggerItem>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search by student or title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
        </StaggerItem>

        {/* Achievement Grid */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4">All Achievements</h3>
              {loading ? (
                <p className="text-sm text-gray-400 py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading achievements…</p>
              ) : error ? (
                <p className="text-sm text-red-500 py-10 text-center">{error}</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-gray-400 py-10 text-center">No achievements recorded yet.</p>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((a) => {
                      const typeCfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.BADGE;
                      const growthCfg = GROWTH_COLORS[a.category];
                      const TypeIcon = typeCfg.icon;
                      return (
                        <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                          <div className="text-2xl">{a.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{a.title}</h4>
                              <div className={`w-6 h-6 rounded-full ${typeCfg.bg} flex items-center justify-center shrink-0`}>
                                <TypeIcon className={`w-3 h-3 ${typeCfg.color}`} />
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">{a.student}</p>
                            <p className="text-xs text-gray-400 mb-1.5 line-clamp-2">{a.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px]">{a.type}</Badge>
                              {a.date && <span className="text-[10px] text-gray-400">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
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
