'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  Save,
  Send,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Sun,
  ClipboardList,
  FileEdit,
  Eye,
  LayoutGrid,
  List,
  Droplets,
  Moon,
  Smile,
  Coffee,
  Baby,
  Highlighter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PORTAL_THEMES, MOOD_COLORS as THEME_MOOD_COLORS, MEAL_COLORS as THEME_MEAL_COLORS, HEALTH_COLORS } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.teacher;

// ── Types ──
type MealStatus = 'Eaten' | 'Partial' | 'Not Eaten';
type SleepQuality = 'Good' | 'Fair' | 'Poor';
type MoodType = 'Happy' | 'Sad' | 'Angry' | 'Calm' | 'Excited' | 'Tired' | 'Sick' | 'Fussy';
type PottyType = 'Dry' | 'Wet' | 'Soiled';
type UpdateStatus = 'DRAFT' | 'PUBLISHED' | 'NOT_STARTED';

interface StudentUpdate {
  id: string | null;
  studentId: string;
  studentName: string;
  studentPhoto: string | null;
  rollNumber: string | null;
  breakfast: MealStatus | null;
  breakfastMenu: string | null;
  lunch: MealStatus | null;
  lunchMenu: string | null;
  snacks: MealStatus | null;
  snacksMenu: string | null;
  sleepStart: string | null;
  sleepEnd: string | null;
  sleepQuality: SleepQuality | null;
  moodMorning: MoodType | null;
  moodAfternoon: MoodType | null;
  pottyCount: number;
  pottyType: PottyType | null;
  waterGlasses: number;
  highlights: string | null;
  status: UpdateStatus;
  publishedAt: string | null;
}

interface DailyUpdatesData {
  date: string;
  classId: string;
  className: string;
  updates: StudentUpdate[];
  summary: {
    total: number;
    published: number;
    draft: number;
    notStarted: number;
  };
}

// ── Form State Interface ──
interface FormData {
  breakfast: MealStatus | null;
  breakfastMenu: string;
  lunch: MealStatus | null;
  lunchMenu: string;
  snacks: MealStatus | null;
  snacksMenu: string;
  sleepStart: string;
  sleepEnd: string;
  sleepQuality: SleepQuality | null;
  moodMorning: MoodType | null;
  moodAfternoon: MoodType | null;
  pottyCount: number;
  pottyType: PottyType | null;
  waterGlasses: number;
  highlights: string;
}

const EMPTY_FORM: FormData = {
  breakfast: null,
  breakfastMenu: '',
  lunch: null,
  lunchMenu: '',
  snacks: null,
  snacksMenu: '',
  sleepStart: '',
  sleepEnd: '',
  sleepQuality: null,
  moodMorning: null,
  moodAfternoon: null,
  pottyCount: 0,
  pottyType: null,
  waterGlasses: 0,
  highlights: '',
};

// ── Helpers ──
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
}

function calculateDuration(start: string, end: string): string | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  // Handle overnight sleep (e.g., 22:00 → 06:00)
  if (endMins <= startMins) endMins += 24 * 60;
  const diff = endMins - startMins;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

// ── Mood Config ──
const MOOD_CONFIG: Record<MoodType, { emoji: string; color: string; bg: string; border: string }> = {
  Happy:   { emoji: THEME_MOOD_COLORS.HAPPY.emoji, color: THEME_MOOD_COLORS.HAPPY.text, bg: THEME_MOOD_COLORS.HAPPY.bg, border: 'border-green-300' },
  Sad:     { emoji: THEME_MOOD_COLORS.SAD.emoji, color: THEME_MOOD_COLORS.SAD.text, bg: THEME_MOOD_COLORS.SAD.bg, border: 'border-blue-300' },
  Angry:   { emoji: '😡', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
  Calm:    { emoji: THEME_MOOD_COLORS.CALM.emoji, color: THEME_MOOD_COLORS.CALM.text, bg: THEME_MOOD_COLORS.CALM.bg, border: 'border-teal-300' },
  Excited: { emoji: THEME_MOOD_COLORS.EXCITED.emoji, color: THEME_MOOD_COLORS.EXCITED.text, bg: THEME_MOOD_COLORS.EXCITED.bg, border: 'border-purple-300' },
  Tired:   { emoji: '😴', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  Sick:    { emoji: '🤒', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300' },
  Fussy:   { emoji: '😩', color: 'text-pink-700', bg: 'bg-pink-100', border: 'border-pink-300' },
};

const MOOD_OPTIONS: MoodType[] = ['Happy', 'Sad', 'Angry', 'Calm', 'Excited', 'Tired', 'Sick', 'Fussy'];

const MEAL_COLORS: Record<MealStatus, { bg: string; text: string; border: string; activeBg: string }> = {
  'Eaten':     { bg: THEME_MEAL_COLORS.EATEN.bg, text: THEME_MEAL_COLORS.EATEN.text, border: 'border-portal-300', activeBg: 'bg-portal-600' },
  'Partial':   { bg: THEME_MEAL_COLORS.PARTIAL.bg, text: THEME_MEAL_COLORS.PARTIAL.text, border: 'border-amber-300', activeBg: 'bg-amber-500' },
  'Not Eaten': { bg: THEME_MEAL_COLORS.NOT_EATEN.bg, text: THEME_MEAL_COLORS.NOT_EATEN.text, border: 'border-red-300', activeBg: 'bg-red-500' },
};

const SLEEP_COLORS: Record<SleepQuality, { bg: string; text: string; border: string; activeBg: string }> = {
  Good: { bg: HEALTH_COLORS.GOOD.bg, text: HEALTH_COLORS.GOOD.text, border: 'border-portal-300', activeBg: 'bg-portal-600' },
  Fair: { bg: HEALTH_COLORS.FAIR.bg, text: HEALTH_COLORS.FAIR.text, border: 'border-amber-300', activeBg: 'bg-amber-500' },
  Poor: { bg: HEALTH_COLORS.POOR.bg, text: HEALTH_COLORS.POOR.text, border: 'border-red-300', activeBg: 'bg-red-500' },
};

const POTTY_TYPE_COLORS: Record<PottyType, { bg: string; text: string; border: string; activeBg: string; icon: string }> = {
  Dry:    { bg: 'bg-portal-50', text: 'text-portal-700', border: 'border-portal-300', activeBg: 'bg-portal-600', icon: '✅' },
  Wet:    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', activeBg: 'bg-amber-500', icon: '⚠️' },
  Soiled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', activeBg: 'bg-red-500', icon: '❌' },
};

/**
 * DailyUpdatesContent — Inner component that uses useSearchParams
 */
function DailyUpdatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudent = searchParams.get('student');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date state
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  // Data state
  const [data, setData] = useState<DailyUpdatesData | null>(null);

  // Selected student for form
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(preselectedStudent);

  // Form state
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM });

  // View mode
  const [viewMode, setViewMode] = useState<'detail' | 'list'>('detail');

  // ── Fetch daily updates data ──
  const fetchData = useCallback(async (date: string) => {
    const token = localStorage.getItem('preone_token');
    if (!token) { router.push('/login'); return; }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/teacher/daily-updates?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load daily updates');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  // When data loads and we have a preselected student, auto-select them
  useEffect(() => {
    if (preselectedStudent && data) {
      setSelectedStudentId(preselectedStudent);
    }
  }, [preselectedStudent, data]);

  // Load form data when student is selected
  useEffect(() => {
    if (!selectedStudentId || !data) {
      setFormData({ ...EMPTY_FORM });
      return;
    }

    const studentUpdate = data.updates.find((u) => u.studentId === selectedStudentId);
    if (studentUpdate && studentUpdate.id) {
      setFormData({
        breakfast: studentUpdate.breakfast || null,
        breakfastMenu: studentUpdate.breakfastMenu || '',
        lunch: studentUpdate.lunch || null,
        lunchMenu: studentUpdate.lunchMenu || '',
        snacks: studentUpdate.snacks || null,
        snacksMenu: studentUpdate.snacksMenu || '',
        sleepStart: studentUpdate.sleepStart || '',
        sleepEnd: studentUpdate.sleepEnd || '',
        sleepQuality: studentUpdate.sleepQuality || null,
        moodMorning: studentUpdate.moodMorning || null,
        moodAfternoon: studentUpdate.moodAfternoon || null,
        pottyCount: studentUpdate.pottyCount || 0,
        pottyType: studentUpdate.pottyType || null,
        waterGlasses: studentUpdate.waterGlasses || 0,
        highlights: studentUpdate.highlights || '',
      });
    } else {
      setFormData({ ...EMPTY_FORM });
    }
  }, [selectedStudentId, data]);

  // ── Date navigation ──
  const goToPrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDate(d));
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const next = formatDate(d);
    if (next <= today) setSelectedDate(next);
  };

  const isToday = selectedDate === today;

  // ── Get currently selected student update ──
  const currentUpdate = data?.updates.find((u) => u.studentId === selectedStudentId);

  // ── Save handler ──
  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    const token = localStorage.getItem('preone_token');
    if (!token || !selectedStudentId) return;

    try {
      setSaving(true);
      const res = await fetch('/api/teacher/daily-updates', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          date: selectedDate,
          ...formData,
          status,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(status === 'PUBLISHED'
        ? 'Update published! Parents will be notified.'
        : 'Draft saved successfully'
      );
      await fetchData(selectedDate);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Publish/Unpublish handler ──
  const handleTogglePublish = async () => {
    const token = localStorage.getItem('preone_token');
    if (!token || !currentUpdate?.id) return;

    try {
      setSaving(true);
      const endpoint = currentUpdate.status === 'PUBLISHED'
        ? `/api/teacher/daily-updates/${currentUpdate.id}/unpublish`
        : `/api/teacher/daily-updates/${currentUpdate.id}/publish`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      toast.success(currentUpdate.status === 'PUBLISHED'
        ? 'Update unpublished'
        : 'Update published! Parents will be notified.'
      );
      await fetchData(selectedDate);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Bulk publish all drafts ──
  const handleBulkPublish = async () => {
    const token = localStorage.getItem('preone_token');
    if (!token || !data) return;

    const drafts = data.updates.filter((u) => u.status === 'DRAFT' && u.id);
    if (drafts.length === 0) {
      toast.info('No drafts to publish');
      return;
    }

    try {
      setSaving(true);
      let published = 0;
      for (const draft of drafts) {
        const res = await fetch(`/api/teacher/daily-updates/${draft.id}/publish`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) published++;
      }
      toast.success(`${published} updates published! Parents will be notified.`);
      await fetchData(selectedDate);
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  // ── Form update helpers ──
  const updateForm = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ── Compact status indicator for list view ──
  const getFoodIcon = (status: MealStatus | null) => {
    if (status === 'Eaten') return <span className="text-emerald-500" title="Eaten">🟢</span>;
    if (status === 'Partial') return <span className="text-amber-500" title="Partial">🟡</span>;
    if (status === 'Not Eaten') return <span className="text-red-500" title="Not Eaten">🔴</span>;
    return <span className="text-gray-300" title="Not recorded">⬜</span>;
  };

  const getMoodEmoji = (mood: MoodType | null) => {
    if (!mood) return <span className="text-gray-300">⬜</span>;
    return <span title={mood}>{MOOD_CONFIG[mood].emoji}</span>;
  };

  // ── Loading state ──
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Daily Updates</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button
          onClick={() => fetchData(selectedDate)}
          className="bg-portal-600 hover:bg-portal-700 rounded-xl text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-500" />
                Daily Updates
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {data.className} | {data.summary.total} Students
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Date navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={goToPrevDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="w-36 h-8 text-sm rounded-xl"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={goToNextDay}
                  disabled={isToday}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Status badge */}
              <Badge
                variant="outline"
                className="px-3 py-1 text-xs rounded-xl border-portal-200 bg-portal-50 text-portal-700"
              >
                {data.summary.published} published / {data.summary.total} total
              </Badge>

              {/* View toggle */}
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('detail')}
                  className={`p-1.5 transition-colors ${viewMode === 'detail' ? 'bg-portal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setViewMode('list'); setSelectedStudentId(null); }}
                  className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-portal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1 text-portal-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> {data.summary.published} Published
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <FileEdit className="h-3.5 w-3.5" /> {data.summary.draft} Draft
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <ClipboardList className="h-3.5 w-3.5" /> {data.summary.notStarted} Not Started
            </span>
            {data.summary.draft > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto text-xs rounded-xl border-portal-200 text-portal-700 hover:bg-portal-50 h-7"
                onClick={handleBulkPublish}
                disabled={saving}
              >
                <Send className="h-3 w-3 mr-1" /> Publish All Drafts
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Detail View (Student Selector + Form) ── */}
      {viewMode === 'detail' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Student selector */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Students ({data.updates.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                {data.updates.map((update) => (
                  <StudentCard
                    key={update.studentId}
                    update={update}
                    isSelected={selectedStudentId === update.studentId}
                    onClick={() => setSelectedStudentId(update.studentId)}
                  />
                ))}
                {data.updates.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No students found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Update Form */}
          <div className="lg:col-span-2 space-y-4">
            {selectedStudentId ? (
              <>
                {/* Student header */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg -ml-1"
                          onClick={() => setSelectedStudentId(null)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Avatar className="h-10 w-10">
                          {currentUpdate?.studentPhoto ? (
                            <AvatarImage src={currentUpdate.studentPhoto} alt={currentUpdate.studentName || ''} />
                          ) : (
                            <AvatarFallback className="bg-portal-50 text-portal-700 text-sm font-semibold">
                              {getInitials(currentUpdate?.studentName || '??')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{currentUpdate?.studentName}</p>
                          <p className="text-xs text-gray-500">
                            Roll: {currentUpdate?.rollNumber || '-'} | {formatDateDisplay(selectedDate)}
                          </p>
                        </div>
                      </div>
                      <div>
                        {currentUpdate?.status === 'PUBLISHED' && (
                          <Badge className="bg-portal-100 text-portal-700 border-portal-200 text-xs rounded-xl">
                            ✅ Published
                          </Badge>
                        )}
                        {currentUpdate?.status === 'DRAFT' && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs rounded-xl">
                            📝 Draft
                          </Badge>
                        )}
                        {currentUpdate?.status === 'NOT_STARTED' && (
                          <Badge variant="outline" className="text-gray-500 text-xs rounded-xl">
                            ⬜ Not Started
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 1: Food Tracking */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-orange-500" />
                      Food Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Breakfast */}
                    <MealRow
                      label="🍳 Breakfast"
                      status={formData.breakfast}
                      menu={formData.breakfastMenu}
                      onStatusChange={(v) => updateForm('breakfast', v)}
                      onMenuChange={(v) => updateForm('breakfastMenu', v)}
                      menuPlaceholder="e.g. Poha + Milk"
                    />
                    {/* Lunch */}
                    <MealRow
                      label="🍱 Lunch"
                      status={formData.lunch}
                      menu={formData.lunchMenu}
                      onStatusChange={(v) => updateForm('lunch', v)}
                      onMenuChange={(v) => updateForm('lunchMenu', v)}
                      menuPlaceholder="e.g. Rice + Dal + Sabzi"
                    />
                    {/* Snacks */}
                    <MealRow
                      label="🍪 Snacks"
                      status={formData.snacks}
                      menu={formData.snacksMenu}
                      onStatusChange={(v) => updateForm('snacks', v)}
                      onMenuChange={(v) => updateForm('snacksMenu', v)}
                      menuPlaceholder="e.g. Fruit + Biscuit"
                    />
                  </CardContent>
                </Card>

                {/* Section 2: Sleep Tracking */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Sleep
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Start Time</label>
                        <Input
                          type="time"
                          value={formData.sleepStart}
                          onChange={(e) => updateForm('sleepStart', e.target.value)}
                          className="w-32 h-9 text-sm rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">End Time</label>
                        <Input
                          type="time"
                          value={formData.sleepEnd}
                          onChange={(e) => updateForm('sleepEnd', e.target.value)}
                          className="w-32 h-9 text-sm rounded-xl"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        {calculateDuration(formData.sleepStart, formData.sleepEnd) && (
                          <div className="px-3 py-2 bg-indigo-50 rounded-xl text-sm text-indigo-700 font-medium">
                            😴 {calculateDuration(formData.sleepStart, formData.sleepEnd)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Quality</label>
                      <div className="flex items-center gap-2">
                        {(['Good', 'Fair', 'Poor'] as SleepQuality[]).map((q) => {
                          const colors = SLEEP_COLORS[q];
                          const isActive = formData.sleepQuality === q;
                          return (
                            <button
                              key={q}
                              onClick={() => updateForm('sleepQuality', isActive ? null : q)}
                              className={`
                                px-4 py-2 rounded-xl text-xs font-medium transition-all border
                                ${isActive
                                  ? `${colors.activeBg} text-white border-transparent shadow-sm`
                                  : `${colors.bg} ${colors.text} ${colors.border} hover:shadow-sm`
                                }
                              `}
                            >
                              {q === 'Good' ? 'Good ✅' : q === 'Fair' ? 'Fair ⚠️' : 'Poor ❌'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 3: Mood Tracking */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Smile className="h-4 w-4 text-pink-500" />
                      Mood
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Morning Mood */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">😊 Morning Mood</label>
                        <div className="flex flex-wrap gap-1.5">
                          {MOOD_OPTIONS.map((mood) => {
                            const config = MOOD_CONFIG[mood];
                            const isActive = formData.moodMorning === mood;
                            return (
                              <button
                                key={mood}
                                onClick={() => updateForm('moodMorning', isActive ? null : mood)}
                                className={`
                                  flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                                  transition-all border
                                  ${isActive
                                    ? `${config.bg} ${config.border} ring-1 ring-offset-1 ring-current ${config.color}`
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                  }
                                `}
                              >
                                <span>{config.emoji}</span>
                                <span>{mood}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Afternoon Mood */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">😊 Afternoon Mood</label>
                        <div className="flex flex-wrap gap-1.5">
                          {MOOD_OPTIONS.map((mood) => {
                            const config = MOOD_CONFIG[mood];
                            const isActive = formData.moodAfternoon === mood;
                            return (
                              <button
                                key={mood}
                                onClick={() => updateForm('moodAfternoon', isActive ? null : mood)}
                                className={`
                                  flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                                  transition-all border
                                  ${isActive
                                    ? `${config.bg} ${config.border} ring-1 ring-offset-1 ring-current ${config.color}`
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                  }
                                `}
                              >
                                <span>{config.emoji}</span>
                                <span>{mood}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 4: Potty/Diaper */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Baby className="h-4 w-4 text-sky-500" />
                      Potty / Diaper
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">Count</label>
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((count) => {
                          const isActive = formData.pottyCount === count;
                          const label = count === 5 ? '5+' : String(count);
                          return (
                            <button
                              key={count}
                              onClick={() => updateForm('pottyCount', count)}
                              className={`
                                w-10 h-10 rounded-xl text-xs font-semibold transition-all border
                                ${isActive
                                  ? 'bg-sky-600 text-white border-transparent shadow-sm'
                                  : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                                }
                              `}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">Type</label>
                      <div className="flex items-center gap-2">
                        {(['Dry', 'Wet', 'Soiled'] as PottyType[]).map((t) => {
                          const colors = POTTY_TYPE_COLORS[t];
                          const isActive = formData.pottyType === t;
                          return (
                            <button
                              key={t}
                              onClick={() => updateForm('pottyType', isActive ? null : t)}
                              className={`
                                px-4 py-2 rounded-xl text-xs font-medium transition-all border
                                ${isActive
                                  ? `${colors.activeBg} text-white border-transparent shadow-sm`
                                  : `${colors.bg} ${colors.text} ${colors.border} hover:shadow-sm`
                                }
                              `}
                            >
                              {t} {colors.icon}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 5: Water Intake */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      Water Intake
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((glass) => {
                        const isActive = formData.waterGlasses === glass;
                        const isFilled = glass <= formData.waterGlasses;
                        return (
                          <button
                            key={glass}
                            onClick={() => updateForm('waterGlasses', isActive ? 0 : glass)}
                            className={`
                              w-10 h-10 rounded-xl text-xs font-semibold transition-all border
                              ${isActive
                                ? 'bg-blue-600 text-white border-transparent shadow-sm'
                                : isFilled
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-blue-50'
                              }
                            `}
                          >
                            {glass === 8 ? '8+' : glass}
                          </button>
                        );
                      })}
                    </div>
                    {/* Visual indicator */}
                    <div className="flex items-center gap-1 text-2xl">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <span key={i} className={i < formData.waterGlasses ? 'opacity-100' : 'opacity-20'}>
                          💧
                        </span>
                      ))}
                      <span className="ml-2 text-sm text-gray-600 font-medium">
                        {formData.waterGlasses} / 8 glasses
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 6: Highlights & Notes */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Highlighter className="h-4 w-4 text-amber-500" />
                      Daily Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.highlights}
                      onChange={(e) => updateForm('highlights', e.target.value)}
                      placeholder={"• Raj participated in group singing today\n• Anvi shared her toys during playtime\n• Arjun learned to count to 10!"}
                      className="min-h-[120px] rounded-xl text-sm resize-none"
                    />
                  </CardContent>
                </Card>

                {/* ── Sticky Action Bar ── */}
                <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200 -mx-6 px-6 py-3 flex items-center justify-between gap-3 rounded-b-xl">
                  <div className="text-xs text-gray-500">
                    {currentUpdate?.status === 'PUBLISHED' && 'Published update — edits will be saved'}
                    {currentUpdate?.status === 'DRAFT' && 'Draft — not visible to parents yet'}
                    {currentUpdate?.status === 'NOT_STARTED' && 'New update'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl text-xs"
                      onClick={() => handleSave('DRAFT')}
                      disabled={saving}
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {saving ? 'Saving...' : 'Save as Draft'}
                    </Button>
                    {currentUpdate?.status === 'PUBLISHED' ? (
                      <>
                        <Button
                          variant="outline"
                          className="rounded-xl text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                          onClick={handleTogglePublish}
                          disabled={saving}
                        >
                          Unpublish
                        </Button>
                        <Button
                          className="bg-portal-600 hover:bg-portal-700 rounded-xl text-xs text-white"
                          onClick={() => handleSave('PUBLISHED')}
                          disabled={saving}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Update & Republish
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="bg-portal-600 hover:bg-portal-700 rounded-xl text-xs text-white"
                        onClick={() => handleSave('PUBLISHED')}
                        disabled={saving}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Publish to Parents
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* No student selected — show prompt */
              <Card className="border-0 shadow-md">
                <CardContent className="py-16 text-center">
                  <Sun className="h-12 w-12 text-amber-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a Student</h3>
                  <p className="text-sm text-gray-500">Choose a student from the list to fill their daily update</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── List View (Table with compact indicators) ── */}
      {viewMode === 'list' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Student</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500 text-xs">🍳 Food</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500 text-xs">😴 Sleep</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500 text-xs">😊 Mood</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500 text-xs">🚽 Potty</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500 text-xs">💧 Water</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500 text-xs">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.updates.map((update) => {
                    const sleepDuration = update.sleepStart && update.sleepEnd
                      ? calculateDuration(update.sleepStart, update.sleepEnd)
                      : null;

                    return (
                      <tr
                        key={update.studentId}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedStudentId(update.studentId);
                          setViewMode('detail');
                        }}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              {update.studentPhoto ? (
                                <AvatarImage src={update.studentPhoto} alt={update.studentName} />
                              ) : (
                                <AvatarFallback className="bg-portal-50 text-portal-700 text-[10px] font-semibold">
                                  {getInitials(update.studentName)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{update.studentName}</p>
                              <p className="text-[10px] text-gray-400">Roll: {update.rollNumber || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {getFoodIcon(update.breakfast)}
                            {getFoodIcon(update.lunch)}
                            {getFoodIcon(update.snacks)}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-xs text-gray-600">
                          {sleepDuration || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getMoodEmoji(update.moodMorning)}
                            {getMoodEmoji(update.moodAfternoon)}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-xs">
                          {update.pottyCount > 0 ? (
                            <span className="text-gray-700">{update.pottyCount}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center text-xs">
                          {update.waterGlasses > 0 ? (
                            <span className="text-blue-600 font-medium">{update.waterGlasses}💧</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {update.status === 'PUBLISHED' && (
                            <Badge className="bg-portal-100 text-portal-700 text-[10px] px-1.5 py-0.5 rounded-md">
                              ✅
                            </Badge>
                          )}
                          {update.status === 'DRAFT' && (
                            <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-md">
                              📝
                            </Badge>
                          )}
                          {update.status === 'NOT_STARTED' && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 rounded-md text-gray-400">
                              ⬜
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs rounded-lg text-portal-600 hover:text-portal-700 hover:bg-portal-50 h-7"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {update.status === 'NOT_STARTED' ? 'Fill' : 'View'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {data.updates.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-medium">No Students Found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Default export wrapped in Suspense for useSearchParams ──
export default function DailyUpdatesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      }
    >
      <DailyUpdatesContent />
    </Suspense>
  );
}

// ── Student Card (sidebar selector) ──
function StudentCard({
  update,
  isSelected,
  onClick,
}: {
  update: StudentUpdate;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left
        ${isSelected
          ? 'bg-portal-50 border border-portal-200 shadow-sm'
          : 'hover:bg-gray-50 border border-transparent'
        }
      `}
    >
      <Avatar className="h-9 w-9 shrink-0">
        {update.studentPhoto ? (
          <AvatarImage src={update.studentPhoto} alt={update.studentName} />
        ) : (
          <AvatarFallback className="bg-portal-50 text-portal-700 text-xs font-semibold">
            {getInitials(update.studentName)}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? 'text-portal-900' : 'text-gray-900'}`}>
          {update.studentName}
        </p>
        <p className="text-[10px] text-gray-400">Roll: {update.rollNumber || '-'}</p>
      </div>
      <div className="shrink-0">
        {update.status === 'PUBLISHED' && (
          <span className="text-xs" title="Published">✅</span>
        )}
        {update.status === 'DRAFT' && (
          <span className="text-xs" title="Draft">📝</span>
        )}
        {update.status === 'NOT_STARTED' && (
          <span className="text-xs" title="Not Started">⬜</span>
        )}
      </div>
    </button>
  );
}

// ── Meal Row Component ──
function MealRow({
  label,
  status,
  menu,
  onStatusChange,
  onMenuChange,
  menuPlaceholder,
}: {
  label: string;
  status: MealStatus | null;
  menu: string;
  onStatusChange: (status: MealStatus | null) => void;
  onMenuChange: (value: string) => void;
  menuPlaceholder: string;
}) {
  const mealStatuses: MealStatus[] = ['Eaten', 'Partial', 'Not Eaten'];

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-sm font-medium text-gray-700 w-28 shrink-0">{label}</span>
        <div className="flex items-center gap-1.5">
          {mealStatuses.map((s) => {
            const colors = MEAL_COLORS[s];
            const isActive = status === s;
            return (
              <button
                key={s}
                onClick={() => onStatusChange(isActive ? null : s)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                  ${isActive
                    ? `${colors.activeBg} text-white border-transparent shadow-sm`
                    : `${colors.bg} ${colors.text} ${colors.border} hover:shadow-sm`
                  }
                `}
              >
                {s}
              </button>
            );
          })}
        </div>
        <Input
          value={menu}
          onChange={(e) => onMenuChange(e.target.value)}
          placeholder={menuPlaceholder}
          className="flex-1 h-8 text-xs rounded-xl"
        />
      </div>
    </div>
  );
}
