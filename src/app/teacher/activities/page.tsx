'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Eye,
  Share2,
  ShieldOff,
  AlertTriangle,
  X,
  Clock,
  Calendar,
  MapPin,
  Package,
  Target,
  CheckCircle2,
  XCircle,
  Radio,
  Palette,
  Music,
  TreePine,
  Home,
  Scissors,
  BookOpen,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { PORTAL_THEMES, ACTIVITY_COLORS } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.teacher;

// ── Types ──
type ActivityType = 'ART' | 'MUSIC' | 'DANCE' | 'SPORTS' | 'ACADEMIC' | 'OUTDOOR' | 'INDOOR' | 'CRAFT';
type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

interface ActivityRecord {
  id: string;
  title: string;
  type: ActivityType;
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
  status: ActivityStatus;
  classId: string | null;
  className: string | null;
  programName: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Type Config ──
const TYPE_CONFIG: Record<ActivityType, { label: string; icon: string; color: string; bg: string; border: string; LucideIcon: React.ElementType }> = {
  ART:      { label: 'Art',      icon: ACTIVITY_COLORS.ART?.icon || '🎨', color: ACTIVITY_COLORS.ART?.text || 'text-pink-700',    bg: ACTIVITY_COLORS.ART?.bg || 'bg-pink-100',    border: 'border-pink-300',    LucideIcon: Palette },
  MUSIC:    { label: 'Music',    icon: ACTIVITY_COLORS.MUSIC?.icon || '🎵', color: ACTIVITY_COLORS.MUSIC?.text || 'text-purple-700',  bg: ACTIVITY_COLORS.MUSIC?.bg || 'bg-purple-100',  border: 'border-purple-300',  LucideIcon: Music },
  DANCE:    { label: 'Dance',    icon: ACTIVITY_COLORS.DANCE?.icon || '💃', color: ACTIVITY_COLORS.DANCE?.text || 'text-orange-700',  bg: ACTIVITY_COLORS.DANCE?.bg || 'bg-orange-100',  border: 'border-orange-300',  LucideIcon: Sparkles },
  SPORTS:   { label: 'Sports',   icon: ACTIVITY_COLORS.SPORTS?.icon || '⚽', color: ACTIVITY_COLORS.SPORTS?.text || 'text-green-700',   bg: ACTIVITY_COLORS.SPORTS?.bg || 'bg-green-100',   border: 'border-green-300',   LucideIcon: Trophy },
  ACADEMIC: { label: 'Academic', icon: ACTIVITY_COLORS.ACADEMIC?.icon || '📚', color: ACTIVITY_COLORS.ACADEMIC?.text || 'text-blue-700', bg: ACTIVITY_COLORS.ACADEMIC?.bg || 'bg-blue-100', border: 'border-blue-300', LucideIcon: BookOpen },
  OUTDOOR:  { label: 'Outdoor',  icon: ACTIVITY_COLORS.OUTDOOR?.icon || '🌳', color: ACTIVITY_COLORS.OUTDOOR?.text || 'text-teal-700',    bg: ACTIVITY_COLORS.OUTDOOR?.bg || 'bg-teal-100',    border: 'border-teal-300',    LucideIcon: TreePine },
  INDOOR:   { label: 'Indoor',   icon: ACTIVITY_COLORS.INDOOR?.icon || '🏠', color: ACTIVITY_COLORS.INDOOR?.text || 'text-indigo-700',  bg: ACTIVITY_COLORS.INDOOR?.bg || 'bg-indigo-100',  border: 'border-indigo-300',  LucideIcon: Home },
  CRAFT:    { label: 'Craft',    icon: ACTIVITY_COLORS.CRAFT?.icon || '✂️', color: ACTIVITY_COLORS.CRAFT?.text || 'text-yellow-700',  bg: ACTIVITY_COLORS.CRAFT?.bg || 'bg-yellow-100',  border: 'border-yellow-300',  LucideIcon: Scissors },
};

const STATUS_CONFIG: Record<ActivityStatus, { label: string; color: string; bg: string; border: string }> = {
  UPCOMING:  { label: 'Upcoming',  color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-300' },
  ONGOING:   { label: 'Ongoing',   color: 'text-emerald-700',bg: 'bg-emerald-100', border: 'border-emerald-300' },
  COMPLETED: { label: 'Completed', color: 'text-gray-600',   bg: 'bg-gray-100',   border: 'border-gray-300' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-300' },
};

// ── Helpers ──
function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function isToday(dateStr: string): boolean {
  return dateStr === getTodayStr();
}

function isPast(dateStr: string): boolean {
  return dateStr < getTodayStr();
}

function isCurrentActivity(dateStr: string, startTime: string | null, endTime: string | null): boolean {
  if (!isToday(dateStr) || !startTime || !endTime) return false;
  const now = new Date();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  return nowMins >= startMins && nowMins <= endMins;
}

function getDayLabel(dateStr: string): string {
  const today = getTodayStr();
  if (dateStr === today) return 'Today';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' });
}

function groupByDate(activities: ActivityRecord[]): Map<string, ActivityRecord[]> {
  const map = new Map<string, ActivityRecord[]>();
  activities.forEach((a) => {
    const list = map.get(a.date) || [];
    list.push(a);
    map.set(a.date, list);
  });
  return map;
}

/**
 * ActivitiesContent — Inner component that uses useSearchParams
 */
function ActivitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ activities: ActivityRecord[]; className: string; total: number } | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');

  // All activities filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPublished, setFilterPublished] = useState<string>('all');

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    type: '' as ActivityType | '',
    description: '',
    date: getTodayStr(),
    startTime: '',
    endTime: '',
    location: '',
    materials: '',
    learningOutcomes: '',
    isPublished: true,
  });
  const [creating, setCreating] = useState(false);

  // Detail dialog
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    title: '',
    type: '' as ActivityType | '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    materials: '',
    learningOutcomes: '',
    status: 'UPCOMING' as ActivityStatus,
  });
  const [editing, setEditing] = useState(false);

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActivityRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch activities ──
  const fetchActivities = useCallback(async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) { router.push('/login'); return; }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (activeTab === 'upcoming') {
        const today = getTodayStr();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        params.set('dateFrom', today);
        params.set('dateTo', futureDate.toISOString().split('T')[0]);
      }
      if (filterType !== 'all') params.set('type', filterType);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterPublished !== 'all') params.set('isPublished', filterPublished);

      const res = await fetch(`/api/teacher/activities?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load activities');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [router, activeTab, filterType, filterStatus, filterPublished]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // ── Create activity ──
  const handleCreate = async () => {
    if (!createForm.title || !createForm.type || !createForm.date) {
      toast.error('Please fill in title, type, and date');
      return;
    }

    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setCreating(true);
      const res = await fetch('/api/teacher/activities', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create');
      }

      toast.success('Activity created successfully');
      setShowCreateDialog(false);
      setCreateForm({
        title: '',
        type: '',
        description: '',
        date: getTodayStr(),
        startTime: '',
        endTime: '',
        location: '',
        materials: '',
        learningOutcomes: '',
        isPublished: true,
      });
      await fetchActivities();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create activity');
    } finally {
      setCreating(false);
    }
  };

  // ── Edit activity ──
  const handleEdit = async () => {
    const token = localStorage.getItem('preone_token');
    if (!token || !editForm.id) return;

    try {
      setEditing(true);
      const res = await fetch(`/api/teacher/activities/${editForm.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      toast.success('Activity updated successfully');
      setShowEditDialog(false);
      await fetchActivities();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setEditing(false);
    }
  };

  // ── Delete activity ──
  const handleDelete = async () => {
    const token = localStorage.getItem('preone_token');
    if (!token || !deleteTarget) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/teacher/activities/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }

      toast.success('Activity deleted');
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      setShowDetailDialog(false);
      await fetchActivities();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // ── Toggle publish ──
  const handleTogglePublish = async (activity: ActivityRecord) => {
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      const willPublish = !activity.isPublished;
      const res = await fetch(`/api/teacher/activities/${activity.id}/publish`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: willPublish }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      toast.success(willPublish ? 'Activity published — parents notified' : 'Activity unpublished');
      await fetchActivities();
      // Update detail view if open
      if (selectedActivity?.id === activity.id) {
        setSelectedActivity((prev) => prev ? { ...prev, isPublished: willPublish } : null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  // ── Open edit ──
  const openEdit = (a: ActivityRecord) => {
    setEditForm({
      id: a.id,
      title: a.title,
      type: a.type,
      description: a.description || '',
      date: a.date,
      startTime: a.startTime || '',
      endTime: a.endTime || '',
      location: a.location || '',
      materials: a.materials || '',
      learningOutcomes: a.learningOutcomes || '',
      status: a.status,
    });
    setShowEditDialog(true);
  };

  // ── Loading state ──
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Activities</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchActivities} className="bg-portal-600 hover:bg-portal-700 rounded-xl">
          Retry
        </Button>
      </div>
    );
  }

  const activities = data?.activities || [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-portal-500" />
                Activities
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {data?.className || 'Class'} | {data?.total || 0} Activities
              </p>
            </div>
            <Button
              className="bg-portal-600 hover:bg-portal-700 rounded-xl text-sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Create Activity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upcoming' | 'all')} className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-xl h-auto">
          <TabsTrigger value="upcoming" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 mr-1.5" /> Today & Upcoming
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Eye className="h-4 w-4 mr-1.5" /> All Activities
          </TabsTrigger>
        </TabsList>

        {/* ── Today & Upcoming Tab ── */}
        <TabsContent value="upcoming">
          {activities.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-16 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Activities Scheduled</h3>
                <p className="text-sm text-gray-500 mb-4">No activities for the next 7 days. Create one to get started!</p>
                <Button className="bg-portal-600 hover:bg-portal-700 rounded-xl text-sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Create Activity
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Array.from(groupByDate(activities).entries()).map(([date, dayActivities]) => {
                const dayLabel = getDayLabel(date);
                const past = isPast(date);

                return (
                  <div key={date}>
                    {/* Day header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        isToday(date)
                          ? 'bg-portal-600 text-white'
                          : past
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {new Date(date + 'T00:00:00').getDate()}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${past ? 'text-gray-400' : 'text-gray-900'}`}>
                          {dayLabel}
                          {isToday(date) && <span className="ml-2 text-portal-600 text-xs">— {formatDate(date)}</span>}
                          {!isToday(date) && <span className="ml-2 text-gray-400 text-xs">— {formatDate(date)}</span>}
                        </p>
                        <p className="text-xs text-gray-400">{dayActivities.length} activit{dayActivities.length === 1 ? 'y' : 'ies'}</p>
                      </div>
                    </div>

                    {/* Activity timeline */}
                    <div className="ml-5 border-l-2 border-gray-200 pl-5 space-y-3">
                      {dayActivities.map((activity) => {
                        const typeConfig = TYPE_CONFIG[activity.type];
                        const isHappening = isCurrentActivity(activity.date, activity.startTime, activity.endTime);

                        return (
                          <Card
                            key={activity.id}
                            className={`border-0 shadow-md cursor-pointer hover:shadow-lg transition-all ${
                              past ? 'opacity-60' : ''
                            } ${isHappening ? 'ring-2 ring-portal-400' : ''}`}
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowDetailDialog(true);
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="text-xs font-mono text-gray-500 min-w-[44px] pt-0.5">
                                  {activity.startTime || '--:--'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-sm font-medium ${past ? 'text-gray-500' : 'text-gray-900'}`}>
                                      {typeConfig.icon} {activity.title}
                                    </span>
                                    <Badge className={`${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} border text-[10px] px-1.5 py-0 rounded-md`}>
                                      {typeConfig.label}
                                    </Badge>
                                    {isHappening && (
                                      <Badge className="bg-portal-100 text-portal-700 border-portal-300 border text-[10px] px-1.5 py-0 rounded-md flex items-center gap-1">
                                        <Radio className="h-2.5 w-2.5 animate-pulse" /> Happening Now
                                      </Badge>
                                    )}
                                    {!activity.isPublished && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md text-gray-400">Draft</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    {activity.startTime && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {activity.startTime}{activity.endTime ? ` - ${activity.endTime}` : ''}
                                      </span>
                                    )}
                                    {activity.className && (
                                      <span>{activity.className}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── All Activities Tab ── */}
        <TabsContent value="all">
          {/* Filters */}
          <Card className="border-0 shadow-md mb-4">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[130px] h-8 text-xs rounded-xl">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.icon} {cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[130px] h-8 text-xs rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPublished} onValueChange={setFilterPublished}>
                  <SelectTrigger className="w-[120px] h-8 text-xs rounded-xl">
                    <SelectValue placeholder="Published" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Published</SelectItem>
                    <SelectItem value="false">Draft</SelectItem>
                  </SelectContent>
                </Select>
                {(filterType !== 'all' || filterStatus !== 'all' || filterPublished !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs rounded-xl text-gray-500 h-8"
                    onClick={() => { setFilterType('all'); setFilterStatus('all'); setFilterPublished('all'); }}
                  >
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Title</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs">Type</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs">Date</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs">Time</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs">Status</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500 text-xs">Published</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((a) => {
                      const typeConfig = TYPE_CONFIG[a.type];
                      const statusConfig = STATUS_CONFIG[a.status];

                      return (
                        <tr
                          key={a.id}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => { setSelectedActivity(a); setShowDetailDialog(true); }}
                        >
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium text-gray-900">{typeConfig.icon} {a.title}</p>
                            {a.location && <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5"><MapPin className="h-2.5 w-2.5" />{a.location}</p>}
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={`${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} border text-[10px] px-1.5 py-0 rounded-md`}>
                              {typeConfig.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-xs text-gray-600">{formatDateShort(a.date)}</td>
                          <td className="py-3 px-2 text-xs text-gray-600 font-mono">{a.startTime || '-'}</td>
                          <td className="py-3 px-2">
                            <Badge className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border text-[10px] px-1.5 py-0 rounded-md`}>
                              {a.status === 'ONGOING' && <Radio className="h-2.5 w-2.5 mr-0.5 animate-pulse inline" />}
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-center">
                            {a.isPublished ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => openEdit(a)} title="Edit">
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setDeleteTarget(a); setShowDeleteDialog(true); }} title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {activities.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500">
                          <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="font-medium">No Activities Found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Create Activity Dialog ── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-portal-600" />
              Create Activity
            </DialogTitle>
            <DialogDescription>Schedule a new classroom activity</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-medium">Title <span className="text-red-500">*</span></Label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Finger Painting"
                  className="rounded-xl"
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Type <span className="text-red-500">*</span></Label>
                <Select value={createForm.type} onValueChange={(v) => setCreateForm((p) => ({ ...p, type: v as ActivityType }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.icon} {cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Start Time <span className="text-red-500">*</span></Label>
                <Input
                  type="time"
                  value={createForm.startTime}
                  onChange={(e) => setCreateForm((p) => ({ ...p, startTime: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">End Time <span className="text-red-500">*</span></Label>
                <Input
                  type="time"
                  value={createForm.endTime}
                  onChange={(e) => setCreateForm((p) => ({ ...p, endTime: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Location</Label>
                <Input
                  value={createForm.location}
                  onChange={(e) => setCreateForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Art Room"
                  className="rounded-xl"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-medium">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the activity..."
                  className="min-h-[80px] rounded-xl text-sm resize-none"
                />
              </div>

              {/* Materials */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Materials Needed</Label>
                <Textarea
                  value={createForm.materials}
                  onChange={(e) => setCreateForm((p) => ({ ...p, materials: e.target.value }))}
                  placeholder="e.g. Washable paints, chart paper..."
                  className="min-h-[70px] rounded-xl text-sm resize-none"
                />
              </div>

              {/* Learning Outcomes */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Learning Outcomes</Label>
                <Textarea
                  value={createForm.learningOutcomes}
                  onChange={(e) => setCreateForm((p) => ({ ...p, learningOutcomes: e.target.value }))}
                  placeholder="e.g. Fine motor skills, color recognition..."
                  className="min-h-[70px] rounded-xl text-sm resize-none"
                />
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <Label className="text-xs font-medium">Publish to Parents</Label>
                <p className="text-[10px] text-gray-500">Parents will be notified when published</p>
              </div>
              <Switch
                checked={createForm.isPublished}
                onCheckedChange={(checked) => setCreateForm((p) => ({ ...p, isPublished: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              className="bg-portal-600 hover:bg-portal-700 rounded-xl"
              onClick={handleCreate}
              disabled={creating || !createForm.title || !createForm.type || !createForm.date}
            >
              {creating ? 'Creating...' : 'Create Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Activity Detail Dialog ── */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedActivity && (() => {
            const typeConfig = TYPE_CONFIG[selectedActivity.type];
            const statusConfig = STATUS_CONFIG[selectedActivity.status];

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} border text-xs px-2.5 py-1 rounded-md font-medium`}>
                      {typeConfig.icon} {typeConfig.label}
                    </Badge>
                    <Badge className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border text-xs px-2.5 py-1 rounded-md font-medium`}>
                      {selectedActivity.status === 'ONGOING' && <Radio className="h-3 w-3 mr-1 animate-pulse inline" />}
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <DialogTitle className="text-lg">{typeConfig.icon} {selectedActivity.title}</DialogTitle>
                  <DialogDescription>
                    {selectedActivity.className} | {formatDate(selectedActivity.date)}
                    {selectedActivity.startTime && ` | ${selectedActivity.startTime}${selectedActivity.endTime ? ` - ${selectedActivity.endTime}` : ''}`}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Location */}
                  {selectedActivity.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {selectedActivity.location}
                    </div>
                  )}

                  {/* Description */}
                  {selectedActivity.description && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <h4 className="text-xs font-semibold text-gray-700 mb-1.5">📝 Description</h4>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedActivity.description}</p>
                    </div>
                  )}

                  {/* Learning Outcomes */}
                  {selectedActivity.learningOutcomes && (
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1.5">🎯 Learning Outcomes</h4>
                      <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">{selectedActivity.learningOutcomes}</p>
                    </div>
                  )}

                  {/* Materials */}
                  {selectedActivity.materials && (
                    <div className="bg-amber-50 p-4 rounded-xl">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1.5">📦 Materials Needed</h4>
                      <p className="text-sm text-amber-700 leading-relaxed whitespace-pre-wrap">{selectedActivity.materials}</p>
                    </div>
                  )}

                  {/* Parent Visibility */}
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Parent Visibility
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${selectedActivity.isPublished ? 'text-portal-600' : 'text-gray-500'}`}>
                        {selectedActivity.isPublished ? (
                          <><CheckCircle2 className="h-4 w-4 inline mr-1" /> Published ✅</>
                        ) : (
                          <><XCircle className="h-4 w-4 inline mr-1" /> Not Published ❌</>
                        )}
                      </span>
                      <Switch
                        checked={selectedActivity.isPublished}
                        onCheckedChange={() => handleTogglePublish(selectedActivity)}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setShowDetailDialog(false)}>Close</Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => { setShowDetailDialog(false); openEdit(selectedActivity); }}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => { setDeleteTarget(selectedActivity); setShowDeleteDialog(true); }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Edit Activity Dialog ── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Edit Activity
            </DialogTitle>
            <DialogDescription>Update the activity details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-medium">Title</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Type</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm((p) => ({ ...p, type: v as ActivityType }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.icon} {cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v as ActivityStatus }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Date</Label>
                <Input type="date" value={editForm.date} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Start Time</Label>
                <Input type="time" value={editForm.startTime} onChange={(e) => setEditForm((p) => ({ ...p, startTime: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">End Time</Label>
                <Input type="time" value={editForm.endTime} onChange={(e) => setEditForm((p) => ({ ...p, endTime: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Location</Label>
                <Input value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className="min-h-[80px] rounded-xl text-sm resize-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Materials</Label>
                <Textarea value={editForm.materials} onChange={(e) => setEditForm((p) => ({ ...p, materials: e.target.value }))} className="min-h-[60px] rounded-xl text-sm resize-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Learning Outcomes</Label>
                <Textarea value={editForm.learningOutcomes} onChange={(e) => setEditForm((p) => ({ ...p, learningOutcomes: e.target.value }))} className="min-h-[60px] rounded-xl text-sm resize-none" />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button className="bg-portal-600 hover:bg-portal-700 rounded-xl" onClick={handleEdit} disabled={editing}>
              {editing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Activity
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
              {deleteTarget?.isPublished && (
                <span className="block mt-1 text-amber-600 font-medium">This activity is published and visible to parents.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Default export wrapped in Suspense ──
export default function ActivitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      }
    >
      <ActivitiesContent />
    </Suspense>
  );
}
