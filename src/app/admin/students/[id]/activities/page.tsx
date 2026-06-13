'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES, ACTIVITY_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Palette,
  Search,
  CalendarDays,
  Trophy,
  Star,
  Music,
  TreePine,
  BookOpen,
  Dumbbell,
  Plus,
  Filter,
  ChevronRight,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Activity {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  teacher: string;
  status: 'COMPLETED' | 'UPCOMING' | 'IN_PROGRESS';
  rating?: number;
  notes?: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', name: 'Finger Painting Session', type: 'ART', date: '2026-06-12', time: '9:30 AM', teacher: 'Ms. Priya', status: 'COMPLETED', rating: 4, notes: 'Showed great creativity with colors' },
  { id: '2', name: 'Rhyme Time', type: 'MUSIC', date: '2026-06-11', time: '10:00 AM', teacher: 'Ms. Kavitha', status: 'COMPLETED', rating: 5, notes: 'Participated enthusiastically' },
  { id: '3', name: 'Outdoor Play', type: 'OUTDOOR', date: '2026-06-13', time: '11:00 AM', teacher: 'Mr. Raj', status: 'UPCOMING' },
  { id: '4', name: 'Story Circle', type: 'STORYTELLING', date: '2026-06-13', time: '2:00 PM', teacher: 'Ms. Priya', status: 'UPCOMING' },
  { id: '5', name: 'Dance Practice', type: 'DANCE', date: '2026-06-10', time: '9:00 AM', teacher: 'Ms. Kavitha', status: 'COMPLETED', rating: 3, notes: 'Needs more practice with rhythm' },
  { id: '6', name: 'Clay Modeling', type: 'CRAFT', date: '2026-06-09', time: '10:30 AM', teacher: 'Ms. Sana', status: 'COMPLETED', rating: 4, notes: 'Made a nice animal figure' },
  { id: '7', name: 'Yoga & Meditation', type: 'INDOOR', date: '2026-06-14', time: '8:30 AM', teacher: 'Mr. Raj', status: 'UPCOMING' },
  { id: '8', name: 'Sprint Race', type: 'SPORTS', date: '2026-06-08', time: '11:00 AM', teacher: 'Mr. Raj', status: 'COMPLETED', rating: 5, notes: 'Won the race! Great energy' },
  { id: '9', name: 'Number Fun', type: 'ACADEMIC', date: '2026-06-07', time: '9:00 AM', teacher: 'Ms. Priya', status: 'COMPLETED', rating: 4 },
  { id: '10', name: 'Free Play', type: 'OTHER', date: '2026-06-14', time: '3:00 PM', teacher: 'Ms. Sana', status: 'UPCOMING' },
];

const TYPE_ICON: Record<string, React.ElementType> = {
  ART: Palette, MUSIC: Music, DANCE: Star, OUTDOOR: TreePine,
  INDOOR: BookOpen, SPORTS: Dumbbell, STORYTELLING: BookOpen,
  CRAFT: Palette, ACADEMIC: BookOpen, OTHER: Filter,
};

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  UPCOMING: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
};

export default function StudentActivitiesPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredActivities = useMemo(() => {
    return MOCK_ACTIVITIES.filter((a) => {
      const matchSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [searchQuery, typeFilter]);

  const completed = MOCK_ACTIVITIES.filter((a) => a.status === 'COMPLETED');
  const avgRating = completed.length > 0
    ? (completed.reduce((s, a) => s + (a.rating || 0), 0) / completed.length).toFixed(1)
    : '0';

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Palette className="w-6 h-6" style={{ color: theme.primary }} />
                Student Activities
              </h1>
              <p className="text-sm text-gray-500 mt-1">Student ID: {studentId} — Activity participation</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Assign Activity
            </Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Total Activities</p>
              <p className="text-lg font-bold text-purple-700">{MOCK_ACTIVITIES.length}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-lg font-bold text-emerald-700">{completed.length}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Upcoming</p>
              <p className="text-lg font-bold text-blue-700">{MOCK_ACTIVITIES.filter((a) => a.status === 'UPCOMING').length}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-500">Avg Rating</p>
                <Trophy className="w-3 h-3 text-amber-500" />
              </div>
              <p className="text-lg font-bold text-amber-700">{avgRating}/5</p>
            </PreOneCard>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4">Participation History</h3>
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {filteredActivities.map((a) => {
                    const typeCfg = ACTIVITY_COLORS[a.type] || ACTIVITY_COLORS.OTHER;
                    const Icon = TYPE_ICON[a.type] || Filter;
                    return (
                      <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-xl ${typeCfg.bg} flex items-center justify-center shrink-0`}>
                          <span className="text-lg">{typeCfg.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{a.name}</p>
                            <Badge className={`${STATUS_BADGE[a.status]} text-[9px]`}>{a.status}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            <span>{a.time}</span>
                            <span>{a.teacher}</span>
                          </div>
                          {a.rating && (
                            <div className="flex items-center gap-0.5 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < a.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                              ))}
                            </div>
                          )}
                          {a.notes && <p className="text-xs text-gray-400 mt-1">{a.notes}</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
