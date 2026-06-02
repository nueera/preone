'use client';

// ============================================================
// PreOne — Parent Dashboard Page
// Shows: welcome, child info, today's summary, quick stats,
// fee status, announcements, growth snapshot, quick actions
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, IndianRupee, TrendingUp, Eye, Sun, Moon,
  Utensils, BedDouble, Droplets, Smile, Meh, Frown, Zap,
  Calendar, Bell, ArrowRight, RefreshCw, AlertCircle,
  Baby, MessageSquare, CreditCard, BarChart3,
  Megaphone, Loader2, ChevronDown,
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
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from 'recharts';
import { useParentAuth } from '@/lib/parent-auth';
import { parentFetch } from '@/lib/parent-api';

// ============================================================
// TYPES
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
// HELPERS
// ============================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

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
        <Skeleton className="h-24 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
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
  const childName = `${child.firstName} ${child.lastName}`;
  const greeting = getGreeting();
  const totalFees = stats.feesDue + stats.feesPaid + stats.feesOverdue;

  // Growth radar data
  const growthRadarData = growthSnapshot
    ? [
        { subject: 'Creativity', value: growthSnapshot.creativity, fullMark: 100 },
        { subject: 'Communication', value: growthSnapshot.communication, fullMark: 100 },
        { subject: 'Social', value: growthSnapshot.social, fullMark: 100 },
        { subject: 'Confidence', value: growthSnapshot.confidence, fullMark: 100 },
        { subject: 'Cognitive', value: growthSnapshot.cognitive, fullMark: 100 },
        { subject: 'Physical', value: growthSnapshot.physical, fullMark: 100 },
      ]
    : [];

  // Strongest/weakest dimensions
  const strongest = growthSnapshot
    ? Object.entries(growthSnapshot)
        .filter(([k]) => !['period', 'overall'].includes(k))
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]
    : null;
  const weakest = growthSnapshot
    ? Object.entries(growthSnapshot)
        .filter(([k]) => !['period', 'overall'].includes(k))
        .sort(([, a], [, b]) => (a as number) - (b as number))[0]
    : null;

  return (
    <div className="space-y-6">
      {/* ── Welcome Section ── */}
      <Card className="rounded-3xl border-0 bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {greeting}, {parent?.firstName || 'Parent'}! 👋
              </h1>
              <p className="text-sky-100 mt-1 flex items-center gap-2 flex-wrap">
                <span>Viewing:</span>
                <span className="font-semibold text-white">{childName}</span>
                <span className="text-sky-200">|</span>
                <span>{child.className || 'No class'}</span>
                {child.rollNumber && (
                  <>
                    <span className="text-sky-200">|</span>
                    <span>Roll No: {child.rollNumber}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Switch Child Button */}
              {children.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-sm"
                    >
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Switch Child
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
                        {c.firstName} {c.lastName} — {c.className || 'No class'}
                        {c.id === selectedChildId && (
                          <Badge className="ml-2 bg-sky-100 text-sky-700 text-[9px]">Active</Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <div className="text-right">
                <p className="text-sm text-sky-100">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Child Info Card (compact) ── */}
      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-sky-200">
              <AvatarImage src={child.photo || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white text-lg font-bold">
                {child.firstName[0]}{child.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg">{childName}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                <span>{child.className || 'No class'}</span>
                {child.rollNumber && <span>Roll: {child.rollNumber}</span>}
                {child.programName && <span>{child.programName}</span>}
                <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                  {child.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Today's Summary Card ── */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-600" />
              Today&apos;s Summary — {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </CardTitle>
            {todayUpdate && (
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Published</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {todayUpdate ? (
            <div className="space-y-3">
              {/* Attendance */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Present Today</p>
                  <p className="text-xs text-emerald-600">Attendance marked</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Mood */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Mood</p>
                  <p className="text-sm font-medium">
                    {getMoodEmoji(todayUpdate.moodMorning)} {todayUpdate.moodMorning || 'Not recorded'}
                    {todayUpdate.moodAfternoon && (
                      <span className="text-muted-foreground"> → {getMoodEmoji(todayUpdate.moodAfternoon)} {todayUpdate.moodAfternoon}</span>
                    )}
                  </p>
                </div>

                {/* Breakfast */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">🍳 Breakfast</p>
                  <p className={`text-sm font-medium ${getFoodStatus(todayUpdate.breakfast).color}`}>
                    {todayUpdate.breakfast || 'Not recorded'}
                  </p>
                </div>

                {/* Lunch */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">🍱 Lunch</p>
                  <p className={`text-sm font-medium ${getFoodStatus(todayUpdate.lunch).color}`}>
                    {todayUpdate.lunch || 'Not recorded'}
                  </p>
                </div>

                {/* Snacks */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">🍪 Snacks</p>
                  <p className={`text-sm font-medium ${getFoodStatus(todayUpdate.snacks).color}`}>
                    {todayUpdate.snacks || 'Not recorded'}
                  </p>
                </div>

                {/* Sleep */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">😴 Sleep</p>
                  <p className="text-sm font-medium">
                    {todayUpdate.sleepStart && todayUpdate.sleepEnd
                      ? `${todayUpdate.sleepStart}–${todayUpdate.sleepEnd}`
                      : 'Not recorded'}
                    {todayUpdate.sleepQuality && (
                      <span className="text-muted-foreground"> ({todayUpdate.sleepQuality})</span>
                    )}
                  </p>
                </div>

                {/* Water + Potty */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">💧 Water / 🚽 Potty</p>
                  <p className="text-sm font-medium">
                    {todayUpdate.waterGlasses} glasses / {todayUpdate.pottyCount}x
                    {todayUpdate.pottyType && ` (${todayUpdate.pottyType})`}
                  </p>
                </div>
              </div>

              {/* Highlights */}
              {todayUpdate.highlights && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                  <p className="text-xs font-medium text-sky-700 mb-1">📝 Highlights</p>
                  <p className="text-sm text-sky-800">{todayUpdate.highlights}</p>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
                onClick={() => router.push('/parent/daily-updates')}
              >
                View Full Update <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                <Sun className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Today&apos;s update hasn&apos;t been published yet.
              </p>
              <p className="text-xs text-muted-foreground">
                Check back later! Teachers usually publish updates by end of day.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Attendance Rate',
            value: `${stats.attendanceRate}%`,
            icon: CheckCircle2,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
          },
          {
            label: 'Fees Due',
            value: formatCurrency(stats.feesDue + stats.feesOverdue),
            icon: IndianRupee,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
          },
          {
            label: 'Growth Score',
            value: `${stats.growthOverall}/100`,
            icon: TrendingUp,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
          },
          {
            label: 'New Observations',
            value: stats.unacknowledgedObservations,
            icon: Eye,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
          },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-3xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Fee Status Card ── */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-sky-600" />
              Fee Status
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700 font-medium">Next Due</p>
                    <p className="text-sm text-amber-800">
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
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl hover:from-sky-600 hover:to-blue-600 text-xs"
                    onClick={() => router.push('/parent/fees')}
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    Pay Now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <IndianRupee className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No fees due</p>
                <p className="text-xs text-muted-foreground">All payments are up to date!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Recent Announcements Card ── */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-sky-600" />
                Announcements
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
                onClick={() => router.push('/parent/communication')}
              >
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-2">
                {recentAnnouncements.map((ann) => {
                  const priority = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.NORMAL;
                  return (
                    <div
                      key={ann.id}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
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
          </CardContent>
        </Card>
      </div>

      {/* ── Growth Snapshot + Quick Actions Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Snapshot */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-600" />
                Growth — {growthSnapshot?.period || 'No Data'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
                onClick={() => router.push('/parent/growth')}
              >
                View Details <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {growthSnapshot ? (
              <div className="space-y-4">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={growthRadarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 8, fill: '#9ca3af' }}
                      />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#0ea5e9"
                        fill="#0ea5e9"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{growthSnapshot.overall}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                  <p className="text-xs text-muted-foreground">Overall Score</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {strongest && (
                    <div className="p-2 bg-emerald-50 rounded-xl text-center">
                      <p className="text-[10px] text-emerald-600">Strongest</p>
                      <p className="text-sm font-medium text-emerald-700">
                        {strongest[0].charAt(0).toUpperCase() + strongest[0].slice(1)} ({strongest[1] as number}) 💪
                      </p>
                    </div>
                  )}
                  {weakest && (
                    <div className="p-2 bg-amber-50 rounded-xl text-center">
                      <p className="text-[10px] text-amber-600">Needs Work</p>
                      <p className="text-sm font-medium text-amber-700">
                        {weakest[0].charAt(0).toUpperCase() + weakest[0].slice(1)} ({weakest[1] as number}) 📢
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No growth data yet</p>
                <p className="text-xs text-muted-foreground">Growth assessments will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-sky-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "View Today's Update", icon: Sun, href: '/parent/daily-updates', color: 'from-amber-500 to-orange-500' },
                { label: 'Pay Fees', icon: IndianRupee, href: '/parent/fees', color: 'from-red-500 to-rose-500' },
                { label: 'View Growth Report', icon: BarChart3, href: '/parent/growth', color: 'from-violet-500 to-purple-500' },
                { label: 'Chat with Teacher', icon: MessageSquare, href: '/parent/communication', color: 'from-sky-500 to-blue-500' },
              ].map((action) => (
                <Card
                  key={action.label}
                  className="rounded-2xl cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => router.push(action.href)}
                >
                  <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-sm group-hover:shadow-md transition-shadow`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sibling Quick Access */}
            {otherChildren.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Other Children</p>
                <div className="space-y-2">
                  {otherChildren.map((sibling) => (
                    <div
                      key={sibling.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-sky-100 text-sky-700 text-xs">
                          {sibling.firstName[0]}{sibling.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{sibling.firstName} {sibling.lastName}</p>
                        <p className="text-xs text-muted-foreground">{sibling.className || 'No class'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
                        onClick={() => selectChild(sibling.id)}
                      >
                        Switch <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
