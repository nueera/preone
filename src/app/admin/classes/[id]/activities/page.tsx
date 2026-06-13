'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  Calendar,
  BookOpen,
  Clock,
  Palette,
  Music,
  TreePine,
  Sparkles,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ACTIVITY_COLORS } from '@/lib/theme-tokens';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;

// ── Types ──
interface ClassInfo {
  id: string;
  name: string;
  program: { id: string; name: string };
}

interface ActivityItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  teacher?: { firstName: string; lastName: string } | null;
}

// ── Activity type icon mapping ──
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  ART: <Palette className="h-4 w-4" />,
  MUSIC: <Music className="h-4 w-4" />,
  OUTDOOR: <TreePine className="h-4 w-4" />,
  INDOOR: <Sparkles className="h-4 w-4" />,
  CRAFT: <Palette className="h-4 w-4" />,
  STORYTELLING: <BookOpen className="h-4 w-4" />,
  DANCE: <Music className="h-4 w-4" />,
  SPORTS: <TreePine className="h-4 w-4" />,
  ACADEMIC: <BookOpen className="h-4 w-4" />,
  OTHER: <Calendar className="h-4 w-4" />,
};

// ── Activity status colors ──
const ACTIVITY_STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPCOMING: 'bg-sky-50 text-sky-700 border-sky-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  DRAFT: 'bg-gray-50 text-gray-600 border-gray-200',
};

// ── Calendar day type ──
interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  activities: ActivityItem[];
}

// ── Auth helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function ClassActivitiesPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [className, setClassName] = useState('');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ── Fetch class name ──
  useEffect(() => {
    async function fetchClassName() {
      try {
        const token = getToken();
        const res = await fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const found = (data.classes || []).find((c: ClassInfo) => c.id === classId);
          if (found) setClassName(found.name);
        }
      } catch (err) {
        console.error('Failed to fetch class:', err);
      }
    }
    fetchClassName();
  }, [classId]);

  // ── Fetch activities ──
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/activities?classId=${classId}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // ── Derived stats ──
  const completedCount = activities.filter((a) => a.status === 'COMPLETED').length;
  const upcomingCount = activities.filter((a) => a.status === 'UPCOMING').length;
  const inProgressCount = activities.filter((a) => a.status === 'IN_PROGRESS').length;

  // ── Build calendar days ──
  const getCalendarDays = (): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: CalendarDay[] = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, activities: [] });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayActivities = activities.filter((a) => format(new Date(a.date), 'yyyy-MM-dd') === dateStr);
      days.push({ date, isCurrentMonth: true, activities: dayActivities });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push({ date, isCurrentMonth: false, activities: [] });
    }

    return days;
  };

  const calendarDays = getCalendarDays();
  const isToday = (date: Date) => format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Back Button ── */}
        <Button
          variant="ghost"
          className="gap-1 text-muted-foreground"
          onClick={() => router.push(`/admin/classes/${classId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {className || 'Class'}
        </Button>

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {className} — Activities
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage class activities and events
            </p>
          </div>
          <Button
            className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            onClick={() => {/* TODO: Add activity dialog */}}
          >
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Total Activities"
            value={activities.length}
            icon={<Calendar className="h-5 w-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Completed"
            value={completedCount}
            icon={<BookOpen className="h-5 w-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Upcoming"
            value={upcomingCount}
            icon={<Clock className="h-5 w-5" />}
            color="bg-sky-500"
          />
          <CosmicStatCard
            label="In Progress"
            value={inProgressCount}
            icon={<Sparkles className="h-5 w-5" />}
            color="bg-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Activity Calendar ── */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Activity Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  ←
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                  →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const dayActivities = day.activities;
                  return (
                    <div
                      key={i}
                      className={`min-h-[72px] rounded-lg border p-1 text-xs transition-colors ${
                        !day.isCurrentMonth
                          ? 'bg-gray-50/50 text-muted-foreground/50'
                          : isToday(day.date)
                            ? 'bg-portal-50 border-portal-200'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`text-right text-[11px] font-medium mb-0.5 ${
                        isToday(day.date) ? 'text-portal-600' : ''
                      }`}>
                        {format(day.date, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {dayActivities.slice(0, 2).map((act) => {
                          const typeColor = ACTIVITY_COLORS[act.type] || ACTIVITY_COLORS.OTHER;
                          return (
                            <div
                              key={act.id}
                              className={`truncate rounded px-1 py-0.5 text-[9px] font-medium ${typeColor.bg} ${typeColor.text}`}
                              title={act.title}
                            >
                              {act.title}
                            </div>
                          );
                        })}
                        {dayActivities.length > 2 && (
                          <div className="text-[9px] text-muted-foreground text-center">
                            +{dayActivities.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Activities List ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activities scheduled</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activities.slice(0, 15).map((activity) => {
                    const typeColor = ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.OTHER;
                    const statusColor = ACTIVITY_STATUS_COLORS[activity.status] || ACTIVITY_STATUS_COLORS.DRAFT;
                    const typeIcon = ACTIVITY_ICONS[activity.type] || <Calendar className="h-4 w-4" />;
                    return (
                      <PreOneCard key={activity.id} variant="default" hover className="cursor-pointer">
                        <PreOneCardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${typeColor.bg} ${typeColor.text}`}>
                                {typeIcon}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                                  {activity.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {format(new Date(activity.date), 'dd MMM')}
                                  {activity.startTime && ` · ${activity.startTime}`}
                                </p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium border whitespace-nowrap ${statusColor}`}>
                              {activity.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-[10px] ${typeColor.bg} ${typeColor.text} border-0`}>
                              {activity.type}
                            </Badge>
                            {activity.teacher && (
                              <span className="text-[11px] text-muted-foreground">
                                by {activity.teacher.firstName} {activity.teacher.lastName}
                              </span>
                            )}
                          </div>
                        </PreOneCardContent>
                      </PreOneCard>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
