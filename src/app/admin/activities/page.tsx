'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import {
  Palette,
  Plus,
  List,
  Calendar as CalendarIcon,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Globe,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AddActivityDialog } from '@/components/add-activity-dialog';
import { ActivityDetailDialog } from '@/components/activity-detail-dialog';

// ── Types ──
interface ActivityClass {
  id: string;
  name: string;
  program: { name: string };
}

interface Activity {
  id: string;
  title: string;
  type: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  materials: string | null;
  learningOutcomes: string | null;
  media: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  status: string;
  classId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  class: ActivityClass | null;
}

// ── Constants ──
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ART: { label: 'Art', color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200' },
  MUSIC: { label: 'Music', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  DANCE: { label: 'Dance', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  SPORTS: { label: 'Sports', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  ACADEMIC: { label: 'Academic', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  OUTDOOR: { label: 'Outdoor', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  INDOOR: { label: 'Indoor', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  CRAFT: { label: 'Craft', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
};

const TYPE_DOT_COLORS: Record<string, string> = {
  ART: '#ec4899',
  MUSIC: '#8b5cf6',
  DANCE: '#f97316',
  SPORTS: '#22c55e',
  ACADEMIC: '#3b82f6',
  OUTDOOR: '#14b8a6',
  INDOOR: '#6366f1',
  CRAFT: '#eab308',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  UPCOMING: { label: 'Upcoming', color: 'text-blue-600', bg: 'bg-blue-50' },
  ONGOING: { label: 'Ongoing', color: 'text-green-600', bg: 'bg-green-50' },
  COMPLETED: { label: 'Completed', color: 'text-gray-600', bg: 'bg-gray-50' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50' },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Main Page ──
export default function ActivitiesPage() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string; program: { name: string } }[]>([]);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // ── Fetch classes ──
  useEffect(() => {
    async function fetchClasses() {
      try {
        const token = getToken();
        const res = await fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    }
    fetchClasses();
  }, []);

  // ── Fetch activities ──
  const fetchActivities = useCallback(async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (classFilter) params.set('classId', classFilter);
      if (publishedFilter) params.set('isPublished', publishedFilter);

      const res = await fetch(`/api/activities?${params.toString()}`, {
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
  }, [searchQuery, typeFilter, statusFilter, classFilter, publishedFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // ── Activity click ──
  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setDetailOpen(true);
  };

  // ── Calendar date click ──
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setAddOpen(true);
  };

  // ── Activity created/updated/deleted callback ──
  const handleActivityChanged = () => {
    setAddOpen(false);
    setDetailOpen(false);
    setLoading(true);
    fetchActivities();
  };

  // ── Calendar rendering ──
  const renderCalendar = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = getDay(monthStart); // 0=Sunday

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Group activities by date
    const activitiesByDate = new Map<string, Activity[]>();
    for (const activity of activities) {
      const dateKey = format(new Date(activity.date), 'yyyy-MM-dd');
      if (!activitiesByDate.has(dateKey)) activitiesByDate.set(dateKey, []);
      activitiesByDate.get(dateKey)!.push(activity);
    }

    return (
      <div className="bg-white rounded-xl border">
        {/* Calendar header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold text-gray-900">{format(calendarMonth, 'MMMM yyyy')}</h3>
          <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month start */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r p-1 bg-gray-50/50" />
          ))}

          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayActivities = activitiesByDate.get(dateKey) || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dateKey}
                className={cn(
                  'min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-purple-50/30 transition-colors',
                  isToday && 'bg-purple-50/50'
                )}
                onClick={() => handleDateClick(day)}
              >
                <div className={cn(
                  'text-xs font-medium mb-1 h-6 w-6 flex items-center justify-center rounded-full',
                  isToday ? 'bg-purple-600 text-white' : 'text-gray-600'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayActivities.slice(0, 3).map((activity) => {
                    const typeCfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.ART;
                    return (
                      <div
                        key={activity.id}
                        className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: (TYPE_DOT_COLORS[activity.type] || '#9ca3af') + '20', color: TYPE_DOT_COLORS[activity.type] }}
                        onClick={(e) => { e.stopPropagation(); handleActivityClick(activity); }}
                      >
                        {activity.title}
                      </div>
                    );
                  })}
                  {dayActivities.length > 3 && (
                    <div className="text-[10px] text-gray-400 px-1">+{dayActivities.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="h-6 w-6 text-purple-600" />
            Activities
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage activities, events, and programs for your preschool</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchActivities(); }} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button onClick={() => { setSelectedDate(null); setAddOpen(true); }} className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        </div>
      </div>

      {/* ── View Toggle + Search + Filters ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-8 text-xs gap-1', viewMode === 'list' && 'bg-white shadow-sm')}
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-8 text-xs gap-1', viewMode === 'calendar' && 'bg-white shadow-sm')}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Calendar
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search activities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
          </div>
          <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* ── Filters Row ── */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap p-3 bg-white rounded-xl border">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={(v) => setClassFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={publishedFilter} onValueChange={(v) => setPublishedFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Published" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Unpublished</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={() => { setTypeFilter(''); setStatusFilter(''); setClassFilter(''); setPublishedFilter(''); setSearchQuery(''); }} className="text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading activities...
        </div>
      ) : viewMode === 'list' ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                    No activities found. Click &quot;Add Activity&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => {
                  const typeCfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.ART;
                  const statusCfg = STATUS_CONFIG[activity.status] || STATUS_CONFIG.UPCOMING;
                  return (
                    <TableRow key={activity.id} className="cursor-pointer hover:bg-gray-50/80" onClick={() => handleActivityClick(activity)}>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">{activity.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[11px]', typeCfg.bg, typeCfg.color)}>
                          {typeCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{format(new Date(activity.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {activity.startTime && activity.endTime ? `${activity.startTime} - ${activity.endTime}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{activity.class?.name || 'All Classes'}</TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusCfg.bg, statusCfg.color)}>
                          {statusCfg.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {activity.isPublished ? (
                          <Badge className="bg-green-50 text-green-700 text-[10px] border-green-200">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-gray-400">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-purple-600" onClick={(e) => { e.stopPropagation(); handleActivityClick(activity); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        renderCalendar()
      )}

      {/* ── Add Activity Dialog ── */}
      <AddActivityDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onActivityCreated={handleActivityChanged}
        defaultDate={selectedDate}
      />

      {/* ── Activity Detail Dialog ── */}
      <ActivityDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        activity={selectedActivity}
        onActivityChanged={handleActivityChanged}
      />
    </div>
  );
}
