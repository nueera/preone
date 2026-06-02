'use client';

// ============================================================
// PreOne — Parent Daily Updates Page (Enhanced)
// Shows daily updates for the selected child with:
// - Date navigation (prev/next day + Today)
// - Today's Update Card (large, beautiful, detailed)
// - No update yet state with last update info
// - Previous updates list (collapsible, latest first)
// - Weekly Summary tab with aggregated stats
// - Multi-child comparison (if multiple children)
// Only shows PUBLISHED updates — never DRAFT
// ============================================================

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import {
  ChevronDown, ChevronLeft, ChevronRight,
  RefreshCw, AlertCircle, Sun, Moon,
  Utensils, BedDouble, Droplets, Sparkles,
  CalendarDays, Smile, Baby, Clock, ArrowRight,
  BarChart3, Users,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { useParentAuth } from '@/lib/parent-auth';
import {
  useParentDailyUpdate,
  useParentDailyUpdatesHistory,
  type DailyUpdateData,
  type DailyUpdatesHistoryResponse,
} from '@/hooks/use-parent';

// ============================================================
// CONSTANTS
// ============================================================

const MOOD_EMOJI: Record<string, string> = {
  HAPPY: '😊', SAD: '😢', TIRED: '😴', EXCITED: '🤩',
  CALM: '😌', FUSSY: '😤', NEUTRAL: '😐',
};

const MOOD_LABEL: Record<string, string> = {
  HAPPY: 'Happy', SAD: 'Sad', TIRED: 'Tired', EXCITED: 'Excited',
  CALM: 'Calm', FUSSY: 'Fussy', NEUTRAL: 'Neutral',
};

const MOOD_COLOR: Record<string, string> = {
  HAPPY: 'text-emerald-600', SAD: 'text-red-600', TIRED: 'text-amber-600',
  EXCITED: 'text-purple-600', CALM: 'text-blue-600', FUSSY: 'text-orange-600',
  NEUTRAL: 'text-gray-600',
};

const MEAL_STATUS_ICON: Record<string, string> = {
  EATEN: '✅', PARTIAL: '⚠️', SKIPPED: '❌', NOT_PROVIDED: '—',
};

const MEAL_STATUS_LABEL: Record<string, string> = {
  EATEN: 'Eaten', PARTIAL: 'Partial', SKIPPED: 'Skipped', NOT_PROVIDED: 'Not Provided',
};

const MEAL_STATUS_COLOR: Record<string, string> = {
  EATEN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PARTIAL: 'bg-amber-100 text-amber-700 border-amber-200',
  SKIPPED: 'bg-red-100 text-red-700 border-red-200',
  NOT_PROVIDED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const SLEEP_QUALITY_ICON: Record<string, string> = { GOOD: '🟢', FAIR: '🟡', POOR: '🔴' };
const SLEEP_QUALITY_LABEL: Record<string, string> = { GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor' };
const SLEEP_QUALITY_BAR: Record<string, string> = { GOOD: 'bg-emerald-500', FAIR: 'bg-amber-500', POOR: 'bg-red-500' };
const SLEEP_QUALITY_PCT: Record<string, number> = { GOOD: 100, FAIR: 60, POOR: 25 };

const MAX_WATER = 8;

// ============================================================
// HELPERS
// ============================================================

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return dateStr; }
}

function fmtDateLong(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey(): string { return dateKey(new Date()); }

function parseDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function relativeLabel(dateStr: string): string {
  const key2 = dateKey(new Date(dateStr));
  if (key2 === todayKey()) return 'Today';
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  if (key2 === dateKey(yd)) return 'Yesterday';
  return fmtDate(dateStr);
}

function moodEmoji(m: string | null): string { return m ? (MOOD_EMOJI[m] ?? '—') : '—'; }
function moodLabel(m: string | null): string { return m ? (MOOD_LABEL[m] ?? m) : 'Not Recorded'; }

function fmtTime12(time24: string | null): string {
  if (!time24) return '—';
  try {
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch { return time24; }
}

function fmtPublishedAt(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

// ============================================================
// WATER GLASSES INDICATOR
// ============================================================

function WaterGlasses({ count }: { count: number }) {
  const c = Math.min(Math.max(count, 0), MAX_WATER);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: MAX_WATER }).map((_, i) => (
        <TooltipProvider key={i} delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${
                  i < c
                    ? 'bg-sky-100 text-sky-600 border border-sky-300'
                    : 'bg-gray-100 text-gray-300 border border-gray-200'
                }`}
              >
                💧
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Glass {i + 1} {i < c ? '✓' : '—'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

// ============================================================
// SLEEP QUALITY BAR
// ============================================================

function SleepBar({ quality }: { quality: string | null }) {
  if (!quality) return <p className="text-xs text-muted-foreground">Not recorded</p>;
  return (
    <div className="space-y-1">
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${SLEEP_QUALITY_BAR[quality] ?? 'bg-gray-300'}`}
          style={{ width: `${SLEEP_QUALITY_PCT[quality] ?? 0}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {SLEEP_QUALITY_ICON[quality]} {SLEEP_QUALITY_LABEL[quality]} quality
      </p>
    </div>
  );
}

// ============================================================
// MEAL STATUS BADGE
// ============================================================

function MealBadge({ status }: { status: string | null }) {
  if (!status || status === 'NOT_PROVIDED')
    return <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px]">— Not Provided</Badge>;
  return (
    <Badge className={`${MEAL_STATUS_COLOR[status] ?? ''} text-[10px] border`}>
      {MEAL_STATUS_ICON[status]} {MEAL_STATUS_LABEL[status]}
    </Badge>
  );
}

// ============================================================
// TODAY'S UPDATE CARD (Main attraction — large, beautiful)
// ============================================================

function TodayUpdateCard({ update, childName }: { update: DailyUpdateData; childName: string }) {
  return (
    <Card className="rounded-3xl bg-gradient-to-br from-sky-500 to-blue-500 text-white border-0 overflow-hidden relative">
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5" />

      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-200" />
            <h2 className="text-lg font-semibold">
              Daily Update — {fmtDate(update.date)}
            </h2>
          </div>
        </div>

        {update.publishedAt && (
          <p className="text-xs text-sky-100 mb-4">
            Published at {fmtPublishedAt(update.publishedAt)}
            {update.teacherName && <> by {update.teacherName}</>}
          </p>
        )}

        {/* Sections */}
        <div className="space-y-5">

          {/* 🍳 BREAKFAST */}
          <div className="bg-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">🍳 BREAKFAST</span>
              <span className="text-xs">
                {update.breakfast ? `${MEAL_STATUS_ICON[update.breakfast] ?? ''} ${MEAL_STATUS_LABEL[update.breakfast] ?? update.breakfast}` : '—'}
              </span>
            </div>
            {update.breakfastMenu && (
              <p className="text-xs text-sky-100">Menu: {update.breakfastMenu}</p>
            )}
          </div>

          {/* 🍱 LUNCH */}
          <div className="bg-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">🍱 LUNCH</span>
              <span className="text-xs">
                {update.lunch ? `${MEAL_STATUS_ICON[update.lunch] ?? ''} ${MEAL_STATUS_LABEL[update.lunch] ?? update.lunch}` : '—'}
              </span>
            </div>
            {update.lunchMenu && (
              <p className="text-xs text-sky-100">Menu: {update.lunchMenu}</p>
            )}
          </div>

          {/* 🍪 SNACKS */}
          <div className="bg-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">🍪 SNACKS</span>
              <span className="text-xs">
                {update.snacks ? `${MEAL_STATUS_ICON[update.snacks] ?? ''} ${MEAL_STATUS_LABEL[update.snacks] ?? update.snacks}` : '—'}
              </span>
            </div>
            {update.snacksMenu && (
              <p className="text-xs text-sky-100">Menu: {update.snacksMenu}</p>
            )}
          </div>

          {/* 😴 SLEEP */}
          <div className="bg-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">😴 SLEEP</span>
            </div>
            <p className="text-xs">
              {update.sleepStart && update.sleepEnd
                ? `${fmtTime12(update.sleepStart)} → ${fmtTime12(update.sleepEnd)}${update.sleepDuration ? ` (${update.sleepDuration})` : ''}`
                : 'Not recorded'}
            </p>
            {update.sleepQuality && (
              <p className="text-xs mt-1">
                Quality: {SLEEP_QUALITY_LABEL[update.sleepQuality]} {SLEEP_QUALITY_ICON[update.sleepQuality]}
              </p>
            )}
          </div>

          {/* 😊 MOOD */}
          <div className="bg-white/10 rounded-2xl p-3.5">
            <span className="text-sm font-semibold">😊 MOOD</span>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="text-center">
                <p className="text-[10px] text-sky-100 mb-0.5">Morning</p>
                <p className="text-2xl">{moodEmoji(update.moodMorning)}</p>
                <p className="text-[10px] text-sky-100">{moodLabel(update.moodMorning)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-sky-100 mb-0.5">Afternoon</p>
                <p className="text-2xl">{moodEmoji(update.moodAfternoon)}</p>
                <p className="text-[10px] text-sky-100">{moodLabel(update.moodAfternoon)}</p>
              </div>
            </div>
          </div>

          {/* 🚽 POTTY/DIAPER */}
          <div className="bg-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">🚽 POTTY/DIAPER</span>
              <span className="text-xs">
                Count: {update.pottyCount}
                {update.pottyType && <> | Type: {update.pottyType} ✅</>}
              </span>
            </div>
          </div>

          {/* 💧 WATER INTAKE */}
          <div className="bg-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">💧 WATER INTAKE</span>
              <span className="text-xs font-medium">{update.waterGlasses} glasses</span>
            </div>
            <div className="flex items-center gap-0.5 flex-wrap">
              {Array.from({ length: MAX_WATER }).map((_, i) => (
                <span key={i} className={i < update.waterGlasses ? 'text-base' : 'text-base opacity-30'}>
                  💧
                </span>
              ))}
            </div>
          </div>

          {/* 📝 HIGHLIGHTS */}
          {update.highlights && (
            <div className="bg-white/15 rounded-2xl p-4 border border-white/20">
              <span className="text-sm font-semibold">📝 HIGHLIGHTS</span>
              <p className="text-sm mt-2 leading-relaxed italic">
                &ldquo;{update.highlights}&rdquo;
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// NO UPDATE YET CARD
// ============================================================

function NoUpdateCard({ date, latestUpdateDate, onGoToLastUpdate }: {
  date: string;
  latestUpdateDate: string | null;
  onGoToLastUpdate: (date: string) => void;
}) {
  const isTodayDate = date === todayKey();

  return (
    <Card className="rounded-3xl border-dashed border-2 border-sky-200 bg-sky-50/30">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">
            {isTodayDate
              ? "⏳ Today's update hasn't been published yet."
              : `No update published for ${fmtDate(date)}`}
          </h3>
          {isTodayDate && (
            <p className="text-sm text-muted-foreground">
              Check back later! Teachers usually publish updates by 3:00 PM.
            </p>
          )}
        </div>
        {latestUpdateDate && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-muted-foreground">
              📅 Last update: {fmtDate(latestUpdateDate)} ({relativeLabel(latestUpdateDate)})
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => onGoToLastUpdate(latestUpdateDate)}
            >
              View Last Update <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// PREVIOUS UPDATES LIST (collapsible)
// ============================================================

function PreviousUpdatesList({ updates, onSelectDate }: {
  updates: DailyUpdateData[];
  onSelectDate: (date: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const today = todayKey();

  // Exclude today from the list
  const pastUpdates = updates.filter((u) => u.date !== today);

  if (pastUpdates.length === 0) return null;

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-sky-600" />
          Previous Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pastUpdates.map((u) => {
            const isExpanded = expandedId === u.id;
            return (
              <div
                key={u.id}
                className={`rounded-2xl border transition-all cursor-pointer ${
                  isExpanded ? 'border-sky-200 bg-sky-50/30' : 'border-gray-100 hover:border-gray-200'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : u.id)}
              >
                {/* Collapsed row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[52px]">
                      <p className="text-xs font-bold text-sky-600">{relativeLabel(u.date)}</p>
                      <p className="text-[10px] text-muted-foreground">{fmtDate(u.date)}</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="flex items-center gap-1.5">
                      <span title="Breakfast">{u.breakfast ? MEAL_STATUS_ICON[u.breakfast] ?? '—' : '—'}</span>
                      <span title="Lunch">{u.lunch ? MEAL_STATUS_ICON[u.lunch] ?? '—' : '—'}</span>
                      <span title="Snacks">{u.snacks ? MEAL_STATUS_ICON[u.snacks] ?? '—' : '—'}</span>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="flex items-center gap-1">
                      <span title="Morning">{moodEmoji(u.moodMorning)}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span title="Afternoon">{moodEmoji(u.moodAfternoon)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.highlights && (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-700">
                        <Sparkles className="h-3 w-3 mr-0.5" /> Highlights
                      </Badge>
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded inline details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    <Separator />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">Breakfast</p>
                        <p className="text-xs font-medium mt-0.5">
                          {u.breakfast ? `${MEAL_STATUS_ICON[u.breakfast]} ${MEAL_STATUS_LABEL[u.breakfast]}` : '—'}
                        </p>
                        {u.breakfastMenu && <p className="text-[10px] text-muted-foreground">{u.breakfastMenu}</p>}
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">Lunch</p>
                        <p className="text-xs font-medium mt-0.5">
                          {u.lunch ? `${MEAL_STATUS_ICON[u.lunch]} ${MEAL_STATUS_LABEL[u.lunch]}` : '—'}
                        </p>
                        {u.lunchMenu && <p className="text-[10px] text-muted-foreground">{u.lunchMenu}</p>}
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">Sleep</p>
                        <p className="text-xs font-medium mt-0.5">
                          {u.sleepQuality ? `${SLEEP_QUALITY_ICON[u.sleepQuality]} ${SLEEP_QUALITY_LABEL[u.sleepQuality]}` : '—'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">Water</p>
                        <p className="text-xs font-medium mt-0.5">💧 {u.waterGlasses}/{MAX_WATER}</p>
                      </div>
                    </div>

                    {/* Mood row */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Morning</p>
                        <p className="text-lg">{moodEmoji(u.moodMorning)} <span className="text-xs text-muted-foreground">{moodLabel(u.moodMorning)}</span></p>
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Afternoon</p>
                        <p className="text-lg">{moodEmoji(u.moodAfternoon)} <span className="text-xs text-muted-foreground">{moodLabel(u.moodAfternoon)}</span></p>
                      </div>
                    </div>

                    {u.highlights && (
                      <p className="text-xs text-muted-foreground bg-amber-50/50 rounded-xl p-2.5 border border-amber-100">
                        📝 {u.highlights}
                      </p>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDate(u.date);
                      }}
                    >
                      View Full Details
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// WEEKLY SUMMARY TAB
// ============================================================

function WeeklySummary({ data }: { data: DailyUpdatesHistoryResponse }) {
  const { summary } = data;
  const s = summary;

  // Find the dominant mood
  const dominantMood = Object.entries(s.moodCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* Period header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-sky-600" />
        <h2 className="text-lg font-bold">
          This Month&apos;s Summary ({fmtDate(data.updates[data.updates.length - 1]?.date || '')} — {fmtDate(data.updates[0]?.date || '')})
        </h2>
      </div>

      {s.totalDays === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No updates this month yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Food Intake */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Utensils className="h-4 w-4 text-sky-600" /> Food Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Breakfast', ...s.food.breakfast },
                  { label: 'Lunch', ...s.food.lunch },
                  { label: 'Snacks', ...s.food.snacks },
                ].map((meal) => (
                  <div key={meal.label} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{meal.label}:</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span>Eaten {meal.eaten}/{meal.total} days</span>
                      {meal.eaten === meal.total ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">✅</Badge>
                      ) : meal.partial > 0 ? (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px]">⚠️ {meal.partial} partial</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-[10px]">❌</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mood Trend */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Smile className="h-4 w-4 text-sky-600" /> Mood Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Day-by-day mood row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {s.moodTrend.map((d) => (
                    <div key={d.date} className="text-center min-w-[40px]">
                      <p className="text-[9px] text-muted-foreground">
                        {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }).charAt(0)}
                        {new Date(d.date).getDate()}
                      </p>
                      <div className="flex items-center gap-0.5 justify-center">
                        <span className="text-xs">{moodEmoji(d.moodMorning)}</span>
                        <span className="text-xs">{moodEmoji(d.moodAfternoon)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {dominantMood && (
                  <p className="text-sm text-muted-foreground">
                    Mostly {moodLabel(dominantMood[0])}! {MOOD_EMOJI[dominantMood[0]]}
                    {['HAPPY', 'EXCITED', 'CALM'].includes(dominantMood[0]) ? ' ✅' : ''}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sleep + Water averages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BedDouble className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium">Sleep Average</span>
                </div>
                <p className="text-2xl font-bold text-indigo-600">
                  {s.sleepAvgHours} hours/day
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.sleepAvgHours >= 1.5 ? 'Good' : s.sleepAvgHours >= 1 ? 'Fair' : 'Low'} average
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-medium">Water Average</span>
                </div>
                <p className="text-2xl font-bold text-sky-600">
                  {s.waterAvgGlasses} glasses/day
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.waterAvgGlasses >= 6 ? 'Great' : s.waterAvgGlasses >= 4 ? 'Good' : 'Needs improvement'} intake
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Highlights collection */}
          {s.highlights.length > 0 && (
            <Card className="rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {s.highlights.slice(0, 5).map((h, i) => (
                    <div key={i} className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                      <p className="text-[10px] text-muted-foreground mb-1">{fmtDate(h.date)}</p>
                      <p className="text-xs leading-relaxed">&ldquo;{h.text}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// MULTI-CHILD COMPARISON (if parent has multiple children)
// ============================================================

function ChildComparison({ childIds, childNames, selectedDate }: {
  childIds: string[];
  childNames: Record<string, string>;
  selectedDate: string;
}) {
  // Fetch update for each child
  // We'll use a simple approach: fetch via the existing hook isn't practical for multiple,
  // so we'll show a placeholder with instructions
  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-sky-600" /> Compare Children
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Side-by-side comparison for {fmtDate(selectedDate)}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">Category</th>
                {childIds.map((id) => (
                  <th key={id} className="text-center py-2 px-3 text-xs font-semibold">
                    {childNames[id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs">
              {['Breakfast', 'Lunch', 'Mood (AM)', 'Mood (PM)'].map((row) => (
                <tr key={row} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-medium text-muted-foreground">{row}</td>
                  {childIds.map((id) => (
                    <td key={id} className="text-center py-2">
                      <span className="text-muted-foreground">—</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Switch between children using the child selector to view each child&apos;s update
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>
      <Skeleton className="h-96 rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

// ============================================================
// MAIN PAGE CONTENT (inside Suspense)
// ============================================================

function DailyUpdatesContent() {
  const { selectedChildId, selectedChild, children, selectChild } = useParentAuth();

  // Tab state: 'daily' | 'weekly'
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Selected date for daily view, defaults to today
  const [selectedDate, setSelectedDate] = useState(todayKey());

  // Fetch the update for the selected date
  const { data, isLoading, isError, error, refetch } = useParentDailyUpdate(
    selectedChildId,
    selectedDate
  );

  // Fetch monthly history for weekly summary + previous updates list
  const now = new Date();
  const { data: historyData } = useParentDailyUpdatesHistory(
    activeTab === 'weekly' ? selectedChildId : null,
    now.getMonth() + 1,
    now.getFullYear()
  );

  const childName = `${selectedChild?.firstName || ''} ${selectedChild?.lastName || ''}`.trim() || 'Child';

  // Date navigation
  const goToPrevDay = useCallback(() => {
    const d = parseDate(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(dateKey(d));
  }, [selectedDate]);

  const goToNextDay = useCallback(() => {
    const d = parseDate(selectedDate);
    d.setDate(d.getDate() + 1);
    if (dateKey(d) > todayKey()) return;
    setSelectedDate(dateKey(d));
  }, [selectedDate]);

  const goToToday = useCallback(() => {
    setSelectedDate(todayKey());
  }, []);

  const handleGoToLastUpdate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const isTodaySelected = selectedDate === todayKey();

  // Loading
  if (isLoading && !data) {
    return <LoadingSkeleton />;
  }

  // Error
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">{error?.message || 'Failed to load daily updates'}</p>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const update = data?.update ?? null;
  const latestUpdateDate = data?.latestUpdateDate ?? null;
  const historyUpdates = historyData?.updates ?? [];

  // Child names map for comparison
  const childNames: Record<string, string> = {};
  children.forEach((c) => {
    childNames[c.id] = `${c.firstName} ${c.lastName}`;
  });

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* PAGE HEADER                                                   */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Daily Updates</h1>
          <p className="text-sm text-muted-foreground">
            Daily updates for {childName}
            {selectedChild?.className && (
              <span className="text-muted-foreground"> — {selectedChild.className}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Switcher */}
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'daily' ? 'bg-white text-sky-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('daily')}
            >
              Daily
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'weekly' ? 'bg-white text-sky-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('weekly')}
            >
              Weekly Summary
            </button>
          </div>

          {/* Child Switcher */}
          {children.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px] bg-sky-100 text-sky-700">
                      {selectedChild?.firstName?.[0]}{selectedChild?.lastName?.[0]}
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
                    {c.firstName} {c.lastName} — {c.className || 'No class'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* DAILY TAB                                                     */}
      {/* ============================================================ */}
      {activeTab === 'daily' && (
        <>
          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={goToPrevDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant={isTodaySelected ? 'default' : 'outline'}
              size="sm"
              className="rounded-xl gap-1.5 font-medium min-w-[200px]"
              onClick={goToToday}
            >
              <CalendarDays className="h-4 w-4" />
              {isTodaySelected
                ? `Today — ${fmtDateLong(selectedDate)}`
                : `${relativeLabel(selectedDate)} — ${fmtDateLong(selectedDate)}`}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={goToNextDay}
              disabled={isTodaySelected}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Today's Update Card OR No Update Yet */}
          {update ? (
            <TodayUpdateCard update={update} childName={childName} />
          ) : (
            <NoUpdateCard
              date={selectedDate}
              latestUpdateDate={latestUpdateDate}
              onGoToLastUpdate={handleGoToLastUpdate}
            />
          )}

          {/* Detailed Cards (for the selected date's update) */}
          {update && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Meals Card */}
              <Card className="rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-sky-600" /> Meals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Breakfast', icon: '🌅', status: update.breakfast, menu: update.breakfastMenu },
                      { label: 'Lunch', icon: '☀️', status: update.lunch, menu: update.lunchMenu },
                      { label: 'Snacks', icon: '🍪', status: update.snacks, menu: update.snacksMenu },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{m.icon}</span>
                            <span className="text-sm font-medium">{m.label}</span>
                          </div>
                          <MealBadge status={m.status} />
                        </div>
                        {m.menu && (
                          <p className="text-xs text-muted-foreground mt-1 ml-7">Menu: {m.menu}</p>
                        )}
                        {m.label !== 'Snacks' && <Separator className="mt-2.5" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sleep Card */}
              <Card className="rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-indigo-500" /> Sleep
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
                        <Moon className="h-4 w-4 text-indigo-400" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Sleep Start</p>
                          <p className="text-sm font-semibold text-indigo-700">{fmtTime12(update.sleepStart)}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
                        <Sun className="h-4 w-4 text-amber-400" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Wake Up</p>
                          <p className="text-sm font-semibold text-amber-700">{fmtTime12(update.sleepEnd)}</p>
                        </div>
                      </div>
                    </div>
                    {update.sleepDuration && (
                      <p className="text-xs text-muted-foreground">
                        Duration: {update.sleepDuration}
                      </p>
                    )}
                    <SleepBar quality={update.sleepQuality} />
                  </div>
                </CardContent>
              </Card>

              {/* Activity Card */}
              <Card className="rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-sky-500" /> Activity & Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Water */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">💧 Water Intake</span>
                        <span className="text-sm font-semibold text-sky-600">{update.waterGlasses}/{MAX_WATER}</span>
                      </div>
                      <WaterGlasses count={update.waterGlasses} />
                    </div>

                    <Separator />

                    {/* Potty */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Baby className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Potty/Diaper</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-purple-600">{update.pottyCount}x</span>
                        {update.pottyType && (
                          <Badge variant="outline" className="text-[10px]">{update.pottyType}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Highlights */}
                    {update.highlights && (
                      <>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium">Highlights</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                            &ldquo;{update.highlights}&rdquo;
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Previous Updates List */}
          {historyData && historyUpdates.length > 0 && (
            <PreviousUpdatesList
              updates={historyUpdates}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setActiveTab('daily');
              }}
            />
          )}

          {/* Multi-child comparison (only if 2+ children) */}
          {children.length > 1 && (
            <ChildComparison
              childIds={children.map((c) => c.id)}
              childNames={childNames}
              selectedDate={selectedDate}
            />
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* WEEKLY SUMMARY TAB                                            */}
      {/* ============================================================ */}
      {activeTab === 'weekly' && (
        historyData ? (
          <WeeklySummary data={historyData} />
        ) : (
          <Card className="rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <BarChart3 className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading weekly summary...</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

// ============================================================
// EXPORT with Suspense boundary
// ============================================================

export default function ParentDailyUpdatesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DailyUpdatesContent />
    </Suspense>
  );
}
