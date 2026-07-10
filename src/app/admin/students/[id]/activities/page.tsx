'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES, ACTIVITY_COLORS } from '@/lib/theme-tokens';
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
  Palette,
  Search,
  CalendarDays,
  Plus,
  Filter,
  ChevronRight,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Activity {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  status: string;
  className: string;
  notes?: string;
}

interface ApiActivity {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime?: string | null;
  status: string;
  description?: string | null;
  class?: { name: string } | null;
}

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  UPCOMING: 'bg-blue-50 text-blue-700',
  ONGOING: 'bg-amber-50 text-amber-700',
  CANCELLED: 'bg-[var(--warm-surface-2)] text-[var(--admin-text-muted)]',
};

export default function StudentActivitiesPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        // Activities are scoped to the student's class
        const sRes = await fetch(`/api/students/${studentId}`);
        if (!sRes.ok) throw new Error('Failed to load student');
        const sData = await sRes.json();
        const classId: string | undefined = sData.student?.class?.id;
        if (!classId) {
          setActivities([]);
          return;
        }
        const aRes = await fetch(`/api/activities?classId=${classId}&limit=100`);
        if (!aRes.ok) throw new Error('Failed to load activities');
        const aData = await aRes.json();
        const apiActivities: ApiActivity[] = aData.activities || [];
        setActivities(apiActivities.map((a) => ({
          id: a.id,
          name: a.title,
          type: a.type,
          date: a.date,
          time: a.startTime || '',
          status: a.status,
          className: a.class?.name || '',
          notes: a.description || undefined,
        })));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const matchSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [activities, searchQuery, typeFilter]);

  const completed = activities.filter((a) => a.status === 'COMPLETED').length;
  const upcoming = activities.filter((a) => a.status === 'UPCOMING').length;
  const ongoing = activities.filter((a) => a.status === 'ONGOING').length;

  return (
    <WarmPremium className="min-h-screen">
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <Palette className="w-6 h-6" style={{ color: theme.primary }} />
                Student Activities
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Activities for this student&apos;s class</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Assign Activity
            </Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <WarmCard variant="strip" className="p-4">
              <p className="text-xs text-[var(--admin-text-muted)]">Total Activities</p>
              <p className="text-lg font-bold text-purple-700">{activities.length}</p>
            </WarmCard>
            <WarmCard variant="strip" className="p-4">
              <p className="text-xs text-[var(--admin-text-muted)]">Completed</p>
              <p className="text-lg font-bold text-emerald-700">{completed}</p>
            </WarmCard>
            <WarmCard variant="strip" className="p-4">
              <p className="text-xs text-[var(--admin-text-muted)]">Upcoming</p>
              <p className="text-lg font-bold text-blue-700">{upcoming}</p>
            </WarmCard>
            <WarmCard variant="strip" className="p-4">
              <p className="text-xs text-[var(--admin-text-muted)]">Ongoing</p>
              <p className="text-lg font-bold text-amber-700">{ongoing}</p>
            </WarmCard>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-subtle)]" />
              <Input placeholder="Search activities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={typeFilter === 'all' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setTypeFilter('all')}>All</Badge>
              {Object.entries(ACTIVITY_COLORS).slice(0, 6).map(([key, cfg]) => (
                <Badge key={key} variant={typeFilter === key ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setTypeFilter(key)}>
                  {cfg.icon} {key}
                </Badge>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Activity Timeline */}
        <StaggerItem>
          <WarmCard variant="default">
            <WarmCardContent>
              <h3 className="font-semibold text-[var(--admin-text)] mb-4">Participation History</h3>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-[var(--admin-text-subtle)]"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading activities…</div>
              ) : error ? (
                <div className="py-12 text-center text-red-500 text-sm">{error}</div>
              ) : filteredActivities.length === 0 ? (
                <div className="py-12 text-center text-[var(--admin-text-subtle)] text-sm">No activities found for this student&apos;s class.</div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {filteredActivities.map((a) => {
                      const typeCfg = ACTIVITY_COLORS[a.type] || ACTIVITY_COLORS.OTHER || { bg: 'bg-[var(--warm-surface-2)]', icon: '🎯' };
                      return (
                        <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--warm-surface-2)] transition-colors">
                          <div className={`w-10 h-10 rounded-xl ${typeCfg.bg} flex items-center justify-center shrink-0`}>
                            <span className="text-lg">{typeCfg.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[var(--admin-text)]">{a.name}</p>
                              <Badge className={`${STATUS_BADGE[a.status] || 'bg-[var(--warm-surface-2)] text-[var(--admin-text-muted)]'} text-[9px]`}>{a.status}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--admin-text-muted)]">
                              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              {a.time && <span>{a.time}</span>}
                              {a.className && <span>{a.className}</span>}
                              <Badge variant="outline" className="text-[9px]">{a.type}</Badge>
                            </div>
                            {a.notes && <p className="text-xs text-[var(--admin-text-subtle)] mt-1">{a.notes}</p>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--admin-text-subtle)] shrink-0 mt-1" />
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
