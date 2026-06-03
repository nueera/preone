'use client';

// ============================================================
// PreOne — Parent Dashboard Page (Living Universe Design)
// Shows: emotion-first hero, timeline, growth galaxy,
// fee status, announcements, AI companion
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, IndianRupee, TrendingUp, Eye, Sun, Moon,
  Utensils, BedDouble, Droplets, Smile, Meh, Frown, Zap,
  Calendar, Bell, ArrowRight, RefreshCw, AlertCircle,
  Baby, MessageSquare, CreditCard, BarChart3,
  Megaphone, Loader2, ChevronDown, Star, Camera,
  Palette, MessageCircle,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useParentAuth } from '@/lib/parent-auth';
import { parentFetch } from '@/lib/parent-api';
import { PORTAL_THEMES, CHART_PALETTE } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.parent;

// ── Living Universe imports ──
import { StudentPlanet } from '@/components/cosmic/StudentPlanet';
import { AiCompanion } from '@/components/cosmic/AiCompanion';
import { EmotionalTimeline, type TimelineMoment } from '@/components/cosmic/EmotionalTimeline';
import { AchievementGalaxy } from '@/components/cosmic/AchievementGalaxy';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { PreOneButton } from '@/components/ui/preone-button';
import {
  getGreeting,
  getTimeEmoji,
  getDayAdjective,
  getDayAdjectiveEmoji,
  getDayMessage,
  getAiInsight,
} from '@/lib/time-theme';

// ============================================================
// TYPES (kept from original)
// ============================================================

interface TodayUpdate {
  id: string;
  breakfast: string | null;
  breakfastMenu: string | null;
  lunch: string | null;
  lunchMenu: string | null;
  snacks: string | null;
  snacksMenu: string | null;
  sleepStart: string | null;
  sleepEnd: string | null;
  sleepQuality: string | null;
  moodMorning: string | null;
  moodAfternoon: string | null;
  pottyCount: number;
  pottyType: string | null;
  waterGlasses: number;
  highlights: string | null;
  publishedAt: string | null;
}

interface DashboardData {
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    relation: string;
  };
  selectedChild: {
    id: string;
    firstName: string;
    lastName: string;
    photo: string | null;
    rollNumber: string | null;
    className: string | null;
    programName: string | null;
    status: string;
  } | null;
  todayUpdate: TodayUpdate | null;
  stats: {
    attendanceRate: number;
    feesDue: number;
    feesPaid: number;
    feesOverdue: number;
    growthOverall: number;
    unacknowledgedObservations: number;
  };
  nextFeeDue: {
    amount: number;
    dueDate: string;
    invoiceNo: string;
  } | null;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    type: string;
    priority: string;
    publishedAt: string | null;
  }>;
  growthSnapshot: {
    period: string;
    creativity: number;
    communication: number;
    social: number;
    confidence: number;
    cognitive: number;
    physical: number;
    overall: number;
  } | null;
  otherChildren: Array<{
    id: string;
    firstName: string;
    lastName: string;
    className: string | null;
    photo: string | null;
  }>;
}

// ============================================================
// HELPERS (kept from original)
// ============================================================

function formatCurrency(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getMoodEmoji(mood: string | null): string {
  if (!mood) return '😊';
  const m = mood.toLowerCase();
  if (m.includes('happy') || m.includes('great') || m.includes('excited')) return '😄';
  if (m.includes('sad') || m.includes('upset')) return '😢';
  if (m.includes('angry') || m.includes('cranky')) return '😠';
  if (m.includes('tired') || m.includes('sleepy')) return '😴';
  if (m.includes('calm') || m.includes('peaceful')) return '😌';
  return '😊';
}

function getFoodStatus(food: string | null): { emoji: string; label: string; color: string } {
  if (!food) return { emoji: '❓', label: 'Not Recorded', color: 'text-gray-500' };
  const f = food.toLowerCase();
  if (f.includes('full') || f.includes('eaten') || f.includes('completed')) {
    return { emoji: '✅', label: food, color: 'text-emerald-600' };
  }
  if (f.includes('partial') || f.includes('half')) {
    return { emoji: '🤏', label: food, color: 'text-amber-600' };
  }
  if (f.includes('refused') || f.includes('not') || f.includes('skipped')) {
    return { emoji: '❌', label: food, color: 'text-red-600' };
  }
  return { emoji: '🍽️', label: food, color: 'text-blue-600' };
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  HIGH: { label: '🔴', color: 'bg-red-50 text-red-700 border-red-200' },
  NORMAL: { label: '📋', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  LOW: { label: '🟢', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CONCERN: { label: '⚠️', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

// ============================================================
// HELPER: Build timeline moments from today's update
// ============================================================

function buildTimelineMoments(update: TodayUpdate | null): TimelineMoment[] {
  if (!update) return [];

  const moments: TimelineMoment[] = [];

  // Morning check-in
  if (update.moodMorning) {
    moments.push({
      id: 'morning-checkin',
      time: '8:30 AM',
      title: 'Morning Check-in',
      emoji: getMoodEmoji(update.moodMorning),
      description: `${update.moodMorning} morning`,
    });
  }

  // Breakfast
  if (update.breakfast) {
    const bf = getFoodStatus(update.breakfast);
    moments.push({
      id: 'breakfast',
      time: '9:30 AM',
      title: 'Breakfast Time',
      emoji: '🍳',
      description: bf.label,
    });
  }

  // Mid-morning activity
  if (update.highlights) {
    moments.push({
      id: 'mid-morning',
      time: '10:30 AM',
      title: 'Activities',
      emoji: '🎨',
      description: update.highlights.length > 60
        ? update.highlights.slice(0, 60) + '...'
        : update.highlights,
    });
  }

  // Lunch
  if (update.lunch) {
    const ln = getFoodStatus(update.lunch);
    moments.push({
      id: 'lunch',
      time: '12:30 PM',
      title: 'Lunch Time',
      emoji: '🍱',
      description: ln.label,
    });
  }

  // Nap / Sleep
  if (update.sleepStart) {
    moments.push({
      id: 'nap',
      time: update.sleepStart,
      title: 'Nap Time',
      emoji: '😴',
      description: update.sleepEnd
        ? `Slept ${update.sleepStart} – ${update.sleepEnd}`
        : 'Resting',
    });
  }

  // Snacks
  if (update.snacks) {
    const sn = getFoodStatus(update.snacks);
    moments.push({
      id: 'snacks',
      time: '3:30 PM',
      title: 'Snack Time',
      emoji: '🍪',
      description: sn.label,
    });
  }

  // Afternoon mood
  if (update.moodAfternoon) {
    moments.push({
      id: 'afternoon-mood',
      time: '4:00 PM',
      title: 'Afternoon Mood',
      emoji: getMoodEmoji(update.moodAfternoon),
      description: `${update.moodAfternoon} afternoon`,
    });
  }

  // End of day
  moments.push({
    id: 'day-end',
    time: '5:00 PM',
    title: 'Day Complete',
    emoji: '🌟',
    description: `${update.waterGlasses} water glasses today`,
  });

  return moments;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ParentDashboard() {
  const router = useRouter();
  const { parent, selectedChild, selectedChildId, children, selectChild } = useParentAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = selectedChildId
        ? `/api/parent/dashboard?childId=${selectedChildId}`
        : '/api/parent/dashboard';
      const res = await parentFetch(url);
      if (!res) return;
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to load' }));
        throw new Error(err.error || 'Failed to load dashboard');
      }
      const result = await res.json();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    if (selectedChildId) {
      fetchDashboard();
    }
  }, [selectedChildId, fetchDashboard]);

  // ── Loading state ──
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">{error}</p>
        <Button onClick={fetchDashboard} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!data || !data.selectedChild) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Baby className="h-12 w-12 text-sky-400" />
        <p className="text-muted-foreground">No children found. Contact admin for enrollment.</p>
      </div>
    );
  }

  const { selectedChild: child, todayUpdate, stats, nextFeeDue, recentAnnouncements, growthSnapshot, otherChildren } = data;
  const childName = child.firstName; // Use first name for emotional feel
  const childFullName = `${child.firstName} ${child.lastName}`;
  const greeting = getGreeting();
  const timeEmoji = getTimeEmoji();

  // ── Day adjective ──
  const dayAdjective = getDayAdjective({
    hasUpdate: !!todayUpdate,
    moodMorning: todayUpdate?.moodMorning,
    moodAfternoon: todayUpdate?.moodAfternoon,
    highlights: todayUpdate?.highlights,
    attendancePresent: true,
  });
  const dayEmoji = getDayAdjectiveEmoji(dayAdjective);
  const dayMessage = getDayMessage(childName, dayAdjective);

  // ── Timeline moments ──
  const timelineMoments = buildTimelineMoments(todayUpdate);

  // ── Skill planets for AchievementGalaxy ──
  const skillPlanets = growthSnapshot
    ? [
        { key: 'creativity', label: 'Creativity', score: growthSnapshot.creativity, emoji: '🎨' },
        { key: 'communication', label: 'Communication', score: growthSnapshot.communication, emoji: '💬' },
        { key: 'social', label: 'Social', score: growthSnapshot.social, emoji: '🤝' },
        { key: 'confidence', label: 'Confidence', score: growthSnapshot.confidence, emoji: '💪' },
        { key: 'cognitive', label: 'Cognitive', score: growthSnapshot.cognitive, emoji: '🧠' },
        { key: 'physical', label: 'Physical', score: growthSnapshot.physical, emoji: '🏃' },
      ]
    : [];

  // ── Quick card counts ──
  const artworkCount = todayUpdate?.highlights ? 1 : 0;
  const photoCount = 3; // Placeholder — would come from API
  const starCount = 145; // Placeholder — would come from API
  const messageCount = stats.unacknowledgedObservations || 0;

  // ── Fee calculation ──
  const totalFees = stats.feesDue + stats.feesPaid + stats.feesOverdue;

  // ── AI Insight ──
  const aiMessage = getAiInsight({
    childName,
    moodMorning: todayUpdate?.moodMorning,
    moodAfternoon: todayUpdate?.moodAfternoon,
    highlights: todayUpdate?.highlights,
    breakfast: todayUpdate?.breakfast,
    lunch: todayUpdate?.lunch,
    creativity: growthSnapshot?.creativity ?? null,
    communication: growthSnapshot?.communication ?? null,
    social: growthSnapshot?.social ?? null,
  });

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════
          1. WELCOME SECTION — Personal greeting with stats
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {parent?.firstName || 'Parent'}! {timeEmoji}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
            <span>{new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Star count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{starCount}</span>
          </div>

          {/* Notifications */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
            <Bell className="h-4 w-4 text-sky-500" />
            <span className="text-sm font-semibold text-sky-700 dark:text-sky-400">{messageCount}</span>
          </div>

          {/* Switch Child */}
          {children.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px] bg-sky-100 text-sky-700">
                      {child.firstName[0]}{child.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  {childName}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {children.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    className={c.id === selectedChildId ? 'bg-sky-50' : ''}
                    onClick={() => selectChild(c.id)}
                  >
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarFallback className="text-[8px] bg-sky-100 text-sky-700">
                        {c.firstName[0]}{c.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {c.firstName} {c.lastName}
                    {c.id === selectedChildId && (
                      <Badge className="ml-2 bg-sky-100 text-sky-700 text-[9px]">Active</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. HERO CARD — Emotion-first day summary
          ═══════════════════════════════════════════════════════ */}
      <PreOneCard variant="hero" className="overflow-hidden">
        <PreOneCardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Left — Emotional message + pills */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{dayMessage}</h2>
                <p className="text-sky-100 mt-1">
                  {todayUpdate ? (
                    <>
                      {childFullName} • {child.className || 'No class'}
                      {todayUpdate.moodMorning && (
                        <span className="ml-2">
                          Morning: {getMoodEmoji(todayUpdate.moodMorning)}
                          {todayUpdate.moodAfternoon && (
                            <> → {getMoodEmoji(todayUpdate.moodAfternoon)}</>
                          )}
                        </span>
                      )}
                    </>
                  ) : (
                    <>Check back later — updates usually appear by end of day 💫</>
                  )}
                </p>
              </div>

              {/* Highlight pills */}
              {todayUpdate && (
                <div className="flex flex-wrap gap-2">
                  {todayUpdate.highlights && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                      🎨 Created Artwork
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                    📸 {photoCount} New Photos
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                    ⭐ Earned {Math.max(1, Math.round(stats.growthOverall / 20))} Stars
                  </span>
                </div>
              )}

              {/* View Day Summary button */}
              {todayUpdate && (
                <PreOneButton
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:text-white hover:bg-white/20 rounded-xl"
                  onClick={() => router.push('/parent/daily-updates')}
                >
                  View Day Summary <ArrowRight className="h-4 w-4 ml-1" />
                </PreOneButton>
              )}
            </div>

            {/* Right — StudentPlanet */}
            <div className="shrink-0 hidden sm:block">
              <StudentPlanet
                name={child.firstName}
                photo={child.photo}
                mood={todayUpdate?.moodMorning}
                size="lg"
              />
            </div>
          </div>
        </PreOneCardContent>
      </PreOneCard>

      {/* ═══════════════════════════════════════════════════════
          3. EMOTIONAL TIMELINE — Instagram Stories style
          ═══════════════════════════════════════════════════════ */}
      <PreOneCard variant="default" className="rounded-3xl">
        <PreOneCardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-500" />
              Today&apos;s Story
            </h3>
            {todayUpdate && (
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                {timelineMoments.length} Moments
              </Badge>
            )}
          </div>
          <EmotionalTimeline moments={timelineMoments} />
        </PreOneCardContent>
      </PreOneCard>

      {/* ═══════════════════════════════════════════════════════
          4. QUICK CARDS ROW — Emotion cards
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PreOneCard variant="emotional" className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/parent/daily-updates')}>
          <PreOneCardContent className="p-4 flex flex-col items-center text-center gap-2">
            <span className="text-3xl">🎨</span>
            <p className="text-2xl font-bold">{artworkCount}</p>
            <p className="text-xs text-muted-foreground">Artwork</p>
          </PreOneCardContent>
        </PreOneCard>

        <PreOneCard variant="emotional" className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/parent/daily-updates')}>
          <PreOneCardContent className="p-4 flex flex-col items-center text-center gap-2">
            <span className="text-3xl">📸</span>
            <p className="text-2xl font-bold">{photoCount}</p>
            <p className="text-xs text-muted-foreground">Photos</p>
          </PreOneCardContent>
        </PreOneCard>

        <PreOneCard variant="emotional" className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/parent/growth')}>
          <PreOneCardContent className="p-4 flex flex-col items-center text-center gap-2">
            <span className="text-3xl">⭐</span>
            <p className="text-2xl font-bold">{starCount}</p>
            <p className="text-xs text-muted-foreground">Stars</p>
          </PreOneCardContent>
        </PreOneCard>

        <PreOneCard variant="emotional" className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/parent/communication')}>
          <PreOneCardContent className="p-4 flex flex-col items-center text-center gap-2">
            <span className="text-3xl">💬</span>
            <p className="text-2xl font-bold">{messageCount}</p>
            <p className="text-xs text-muted-foreground">Messages</p>
          </PreOneCardContent>
        </PreOneCard>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. GROWTH + FEE ROW — Two cards side by side
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Galaxy Card */}
        <PreOneCard variant="cosmic" className="rounded-3xl">
          <PreOneCardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Growth Galaxy — {growthSnapshot?.period || 'No Data'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
                onClick={() => router.push('/parent/growth')}
              >
                Details <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            {growthSnapshot ? (
              <AchievementGalaxy
                skills={skillPlanets}
                overallScore={growthSnapshot.overall}
              />
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No growth data yet</p>
                <p className="text-xs text-muted-foreground">Growth assessments will appear here</p>
              </div>
            )}
          </PreOneCardContent>
        </PreOneCard>

        {/* Fee Status Card */}
        <PreOneCard variant="glass" className="rounded-3xl">
          <PreOneCardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-sky-600" />
                Fee Status
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
                onClick={() => router.push('/parent/fees')}
              >
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            {totalFees > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Due</span>
                    <span className="font-bold text-lg">{formatCurrency(totalFees)}</span>
                  </div>
                  <Progress
                    value={totalFees > 0 ? (stats.feesPaid / totalFees) * 100 : 0}
                    className="h-3"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-600">Paid: {formatCurrency(stats.feesPaid)} ✅</span>
                    <span className="text-amber-600">Pending: {formatCurrency(stats.feesDue)} ⚠️</span>
                  </div>
                  {stats.feesOverdue > 0 && (
                    <p className="text-xs text-red-600">Overdue: {formatCurrency(stats.feesOverdue)} 🔴</p>
                  )}
                </div>

                {nextFeeDue && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Next Due</p>
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      {formatDate(nextFeeDue.dueDate)} — {formatCurrency(nextFeeDue.amount)}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-xs"
                    onClick={() => router.push('/parent/fees')}
                  >
                    View Details
                  </Button>
                  <PreOneButton
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => router.push('/parent/fees')}
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    Pay Now
                  </PreOneButton>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <IndianRupee className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No fees due</p>
                <p className="text-xs text-muted-foreground">All payments are up to date! 🎉</p>
              </div>
            )}
          </PreOneCardContent>
        </PreOneCard>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. ANNOUNCEMENTS — With new card styling
          ═══════════════════════════════════════════════════════ */}
      <PreOneCard variant="default" className="rounded-3xl">
        <PreOneCardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-sky-600" />
              Announcements
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
              onClick={() => router.push('/parent/communication')}
            >
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {recentAnnouncements.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentAnnouncements.map((ann) => {
                const priority = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.NORMAL;
                return (
                  <div
                    key={ann.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <span className="text-base shrink-0">{priority.label}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ann.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ann.type} • {ann.publishedAt ? formatDate(ann.publishedAt) : 'Draft'}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] shrink-0 ${priority.color}`}
                    >
                      {ann.priority}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No announcements</p>
            </div>
          )}
        </PreOneCardContent>
      </PreOneCard>

      {/* ═══════════════════════════════════════════════════════
          7. AI COMPANION — Floating at bottom right
          ═══════════════════════════════════════════════════════ */}
      <AiCompanion
        message={aiMessage}
        childName={childName}
      />
    </div>
  );
}
