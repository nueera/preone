'use client';

// ============================================================
// PreOne — Parent Daily Updates Page
// Shows daily updates for the selected child:
// - Today's summary card (mood, meals, sleep, water, highlights)
// - Detailed sections for meals, sleep, and activity
// - Recent updates list (last 10) with expandable details
// - Date picker (today / yesterday / custom)
// ============================================================

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import {
  ChevronDown, ChevronLeft, ChevronRight,
  RefreshCw, AlertCircle, Sun, Moon,
  Utensils, BedDouble, Droplets, Sparkles,
  CalendarDays, Smile, Frown, Meh, Zap,
  Baby, ClipboardList,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { useParentAuth } from '@/lib/parent-auth';
import {
  useParentDailyUpdates,
  type DailyUpdateData,
} from '@/hooks/use-parent';

// ============================================================
// CONSTANTS
// ============================================================

const MOOD_EMOJI: Record<string, string> = {
  HAPPY: '😊',
  SAD: '😢',
  TIRED: '😴',
  EXCITED: '🤩',
  CALM: '😌',
  FUSSY: '😤',
  NEUTRAL: '😐',
};

const MOOD_LABEL: Record<string, string> = {
  HAPPY: 'Happy',
  SAD: 'Sad',
  TIRED: 'Tired',
  EXCITED: 'Excited',
  CALM: 'Calm',
  FUSSY: 'Fussy',
  NEUTRAL: 'Neutral',
};

const MEAL_STATUS_ICON: Record<string, string> = {
  EATEN: '✅',
  PARTIAL: '🍽️',
  SKIPPED: '❌',
  NOT_PROVIDED: '—',
};

const MEAL_STATUS_LABEL: Record<string, string> = {
  EATEN: 'Eaten',
  PARTIAL: 'Partial',
  SKIPPED: 'Skipped',
  NOT_PROVIDED: 'Not Provided',
};

const SLEEP_QUALITY_ICON: Record<string, string> = {
  GOOD: '🟢',
  FAIR: '🟡',
  POOR: '🔴',
};

const SLEEP_QUALITY_LABEL: Record<string, string> = {
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
};

const SLEEP_QUALITY_COLOR: Record<string, string> = {
  GOOD: 'bg-emerald-500',
  FAIR: 'bg-amber-500',
  POOR: 'bg-red-500',
};

const MAX_WATER_GLASSES = 8;

// ============================================================
// HELPERS
// ============================================================

function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateKey(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isToday(dateStr: string): boolean {
  return formatDateKey(dateStr) === getTodayKey();
}

function getMoodEmoji(mood: string | null): string {
  if (!mood) return '—';
  return MOOD_EMOJI[mood] ?? '—';
}

function getMoodLabel(mood: string | null): string {
  if (!mood) return 'Not Recorded';
  return MOOD_LABEL[mood] ?? mood;
}

function getMealIcon(status: string | null): string {
  if (!status) return '—';
  return MEAL_STATUS_ICON[status] ?? '—';
}

function getMealLabel(status: string | null): string {
  if (!status) return 'Not Recorded';
  return MEAL_STATUS_LABEL[status] ?? status;
}

function getSleepIcon(quality: string | null): string {
  if (!quality) return '—';
  return SLEEP_QUALITY_ICON[quality] ?? '—';
}

function getSleepLabel(quality: string | null): string {
  if (!quality) return 'Not Recorded';
  return SLEEP_QUALITY_LABEL[quality] ?? quality;
}

function getRelativeDateLabel(dateStr: string): string {
  const key = formatDateKey(dateStr);
  if (key === getTodayKey()) return 'Today';
  if (key === getYesterdayKey()) return 'Yesterday';
  return formatDateShort(dateStr);
}

function getMealStatusBadge(status: string | null) {
  if (!status || status === 'NOT_PROVIDED') {
    return <Badge variant="outline" className="text-[10px]">— Not Provided</Badge>;
  }
  switch (status) {
    case 'EATEN':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">✅ Eaten</Badge>;
    case 'PARTIAL':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">🍽️ Partial</Badge>;
    case 'SKIPPED':
      return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">❌ Skipped</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

// ============================================================
// WATER GLASSES VISUAL INDICATOR
// ============================================================

function WaterGlassesIndicator({ count }: { count: number }) {
  const clamped = Math.min(Math.max(count, 0), MAX_WATER_GLASSES);
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: MAX_WATER_GLASSES }).map((_, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  i < clamped
                    ? 'bg-sky-100 text-sky-600 border border-sky-300'
                    : 'bg-gray-100 text-gray-300 border border-gray-200'
                }`}
              >
                <Droplets className="h-3.5 w-3.5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Glass {i + 1} {i < clamped ? '✓' : '—'}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

// ============================================================
// SLEEP QUALITY BAR
// ============================================================

function SleepQualityBar({ quality }: { quality: string | null }) {
  if (!quality) {
    return (
      <div className="space-y-1">
        <div className="h-2.5 w-full rounded-full bg-gray-100" />
        <p className="text-xs text-muted-foreground">Not recorded</p>
      </div>
    );
  }

  const pct = quality === 'GOOD' ? 100 : quality === 'FAIR' ? 60 : 25;
  const colorClass = SLEEP_QUALITY_COLOR[quality] ?? 'bg-gray-300';

  return (
    <div className="space-y-1">
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {getSleepIcon(quality)} {getSleepLabel(quality)} sleep quality
      </p>
    </div>
  );
}

// ============================================================
// TODAY'S SUMMARY CARD
// ============================================================

function TodaySummaryCard({ update }: { update: DailyUpdateData }) {
  return (
    <Card className="rounded-3xl bg-gradient-to-br from-sky-500 to-blue-500 text-white border-0 overflow-hidden relative">
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
      <CardContent className="p-5 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="h-5 w-5 text-yellow-200" />
          <h2 className="text-base font-semibold">Today&apos;s Summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Mood */}
          <div className="space-y-1">
            <p className="text-xs text-sky-100 font-medium">Mood</p>
            <div className="flex items-center gap-2">
              <span className="text-lg" title="Morning">{getMoodEmoji(update.moodMorning)}</span>
              <span className="text-sky-200 text-xs">AM</span>
              <span className="text-sky-300">/</span>
              <span className="text-lg" title="Afternoon">{getMoodEmoji(update.moodAfternoon)}</span>
              <span className="text-sky-200 text-xs">PM</span>
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-1">
            <p className="text-xs text-sky-100 font-medium">Meals</p>
            <div className="flex items-center gap-2 text-sm">
              <span title="Breakfast">{update.breakfast ? getMealIcon(update.breakfast) : '—'}</span>
              <span title="Lunch">{update.lunch ? getMealIcon(update.lunch) : '—'}</span>
              <span title="Snacks">{update.snacks ? getMealIcon(update.snacks) : '—'}</span>
              <span className="text-sky-200 text-xs">B/L/S</span>
            </div>
          </div>

          {/* Sleep */}
          <div className="space-y-1">
            <p className="text-xs text-sky-100 font-medium">Sleep</p>
            <p className="text-sm">
              {update.sleepStart && update.sleepEnd
                ? `${update.sleepStart} – ${update.sleepEnd}`
                : 'Not recorded'}
              {update.sleepQuality && (
                <span className="ml-1.5">{getSleepIcon(update.sleepQuality)}</span>
              )}
            </p>
          </div>

          {/* Water */}
          <div className="space-y-1">
            <p className="text-xs text-sky-100 font-medium">Water</p>
            <p className="text-sm font-medium">
              {update.waterGlasses} / {MAX_WATER_GLASSES} glasses
            </p>
          </div>

          {/* Highlights */}
          {update.highlights && (
            <div className="col-span-2 space-y-1">
              <p className="text-xs text-sky-100 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Highlights
              </p>
              <p className="text-sm leading-snug line-clamp-2">{update.highlights}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MEALS CARD
// ============================================================

function MealsCard({ update }: { update: DailyUpdateData }) {
  const meals = [
    {
      label: 'Breakfast',
      icon: '🌅',
      status: update.breakfast,
      menu: update.breakfastMenu,
    },
    {
      label: 'Lunch',
      icon: '☀️',
      status: update.lunch,
      menu: update.lunchMenu,
    },
    {
      label: 'Snacks',
      icon: '🍪',
      status: update.snacks,
      menu: update.snacksMenu,
    },
  ];

  const hasAnyData = meals.some((m) => m.status);

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Utensils className="h-4 w-4 text-sky-600" />
          Meals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAnyData ? (
          <div className="space-y-4">
            {meals.map((meal) => (
              <div key={meal.label}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meal.icon}</span>
                    <span className="text-sm font-medium">{meal.label}</span>
                  </div>
                  {getMealStatusBadge(meal.status)}
                </div>
                {meal.menu && (
                  <p className="text-xs text-muted-foreground mt-1 ml-7">
                    Menu: {meal.menu}
                  </p>
                )}
                {meal.label !== 'Snacks' && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <Utensils className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No meal data recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// SLEEP CARD
// ============================================================

function SleepCard({ update }: { update: DailyUpdateData }) {
  const hasData = update.sleepStart || update.sleepEnd || update.sleepQuality;

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-indigo-500" />
          Sleep
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {/* Time range */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
                <Moon className="h-4 w-4 text-indigo-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Sleep Start</p>
                  <p className="text-sm font-semibold text-indigo-700">
                    {update.sleepStart ?? '—'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
                <Sun className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Wake Up</p>
                  <p className="text-sm font-semibold text-amber-700">
                    {update.sleepEnd ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quality bar */}
            <SleepQualityBar quality={update.sleepQuality} />
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <BedDouble className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No sleep data recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// ACTIVITY CARD
// ============================================================

function ActivityCard({ update }: { update: DailyUpdateData }) {
  const hasWater = update.waterGlasses > 0;
  const hasPotty = update.pottyCount > 0;
  const hasHighlights = !!update.highlights;
  const hasAnyData = hasWater || hasPotty || hasHighlights;

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Activity & Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAnyData ? (
          <div className="space-y-5">
            {/* Water Intake */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-medium">Water Intake</span>
                </div>
                <span className="text-sm font-semibold text-sky-600">
                  {update.waterGlasses} / {MAX_WATER_GLASSES}
                </span>
              </div>
              <WaterGlassesIndicator count={update.waterGlasses} />
            </div>

            <Separator />

            {/* Potty */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Baby className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Potty / Diaper</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-purple-600">
                  {update.pottyCount} {update.pottyCount === 1 ? 'time' : 'times'}
                </span>
                {update.pottyType && (
                  <Badge variant="outline" className="text-[10px]">
                    {update.pottyType}
                  </Badge>
                )}
              </div>
            </div>

            {/* Highlights */}
            {hasHighlights && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Highlights</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                    {update.highlights}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <Zap className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No activity data recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// EXPANDED UPDATE DETAIL (in Dialog)
// ============================================================

function UpdateDetailDialog({
  update,
  open,
  onClose,
}: {
  update: DailyUpdateData | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!update) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-sky-500" />
            {getRelativeDateLabel(update.date)} — {formatDateShort(update.date)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {/* Mood */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Smile className="h-4 w-4 text-sky-500" /> Mood
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sky-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Morning</p>
                <p className="text-2xl">{getMoodEmoji(update.moodMorning)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getMoodLabel(update.moodMorning)}
                </p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Afternoon</p>
                <p className="text-2xl">{getMoodEmoji(update.moodAfternoon)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getMoodLabel(update.moodAfternoon)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Meals */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-sky-500" /> Meals
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Breakfast', status: update.breakfast, menu: update.breakfastMenu, icon: '🌅' },
                { label: 'Lunch', status: update.lunch, menu: update.lunchMenu, icon: '☀️' },
                { label: 'Snacks', status: update.snacks, menu: update.snacksMenu, icon: '🍪' },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span>{m.icon}</span>
                    <span className="text-xs font-medium">{m.label}</span>
                    {m.menu && (
                      <span className="text-xs text-muted-foreground">({m.menu})</span>
                    )}
                  </div>
                  {getMealStatusBadge(m.status)}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Sleep */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-indigo-500" /> Sleep
            </h4>
            <div className="bg-indigo-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Start</span>
                <span className="font-medium">{update.sleepStart ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">End</span>
                <span className="font-medium">{update.sleepEnd ?? '—'}</span>
              </div>
              <SleepQualityBar quality={update.sleepQuality} />
            </div>
          </div>

          <Separator />

          {/* Activity */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" /> Activity
            </h4>
            <div className="bg-sky-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Water Intake</span>
                <span className="text-sm font-semibold text-sky-600">
                  {update.waterGlasses} / {MAX_WATER_GLASSES}
                </span>
              </div>
              <WaterGlassesIndicator count={update.waterGlasses} />
            </div>
            <div className="bg-purple-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Potty / Diaper</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-purple-600">
                  {update.pottyCount} {update.pottyCount === 1 ? 'time' : 'times'}
                </span>
                {update.pottyType && (
                  <Badge variant="outline" className="text-[10px]">{update.pottyType}</Badge>
                )}
              </div>
            </div>
            {update.highlights && (
              <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Highlights
                </p>
                <p className="text-sm leading-relaxed">{update.highlights}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// RECENT UPDATES LIST
// ============================================================

function RecentUpdatesList({ updates }: { updates: DailyUpdateData[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogUpdate, setDialogUpdate] = useState<DailyUpdateData | null>(null);

  // Exclude today's update from the list (it's shown in the summary)
  const todayKey = getTodayKey();
  const pastUpdates = updates.filter((u) => formatDateKey(u.date) !== todayKey);

  if (pastUpdates.length === 0) {
    return null;
  }

  const displayUpdates = pastUpdates.slice(0, 10);

  return (
    <>
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-sky-600" />
            Recent Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displayUpdates.map((update) => {
              const isExpanded = expandedId === update.id;
              const dayLabel = getRelativeDateLabel(update.date);
              const isYesterday = formatDateKey(update.date) === getYesterdayKey();

              return (
                <div
                  key={update.id}
                  className={`rounded-2xl border transition-all cursor-pointer ${
                    isYesterday
                      ? 'bg-sky-50/50 border-sky-200 hover:border-sky-300'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : update.id)}
                >
                  {/* Collapsed row */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[48px]">
                        <p className="text-xs font-bold text-sky-600">{dayLabel}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateShort(update.date)}
                        </p>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div className="flex items-center gap-2">
                        <span title="Morning Mood">{getMoodEmoji(update.moodMorning)}</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span title="Afternoon Mood">{getMoodEmoji(update.moodAfternoon)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {update.highlights && (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-700">
                          <Sparkles className="h-3 w-3 mr-0.5" /> Highlights
                        </Badge>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded inline details */}
                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-3">
                      <Separator />
                      {/* Quick stats row */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-xl py-2">
                          <p className="text-[10px] text-muted-foreground">Meals</p>
                          <p className="text-xs font-medium mt-0.5">
                            {update.breakfast ? getMealIcon(update.breakfast) : '—'}{' '}
                            {update.lunch ? getMealIcon(update.lunch) : '—'}{' '}
                            {update.snacks ? getMealIcon(update.snacks) : '—'}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl py-2">
                          <p className="text-[10px] text-muted-foreground">Sleep</p>
                          <p className="text-xs font-medium mt-0.5">
                            {update.sleepQuality ? getSleepIcon(update.sleepQuality) : '—'}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl py-2">
                          <p className="text-[10px] text-muted-foreground">Water</p>
                          <p className="text-xs font-medium mt-0.5">
                            💧 {update.waterGlasses}/{MAX_WATER_GLASSES}
                          </p>
                        </div>
                      </div>
                      {update.highlights && (
                        <p className="text-xs text-muted-foreground bg-amber-50/50 rounded-xl p-2 border border-amber-100">
                          {update.highlights}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-xl text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDialogUpdate(update);
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

      {/* Detail Dialog */}
      <UpdateDetailDialog
        update={dialogUpdate}
        open={!!dialogUpdate}
        onClose={() => setDialogUpdate(null)}
      />
    </>
  );
}

// ============================================================
// DATE PICKER DROPDOWN
// ============================================================

function DatePickerDropdown({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();

  const label =
    selectedDate === todayKey
      ? 'Today'
      : selectedDate === yesterdayKey
        ? 'Yesterday'
        : formatDateShort(selectedDate);

  const handleCustomDate = useCallback(() => {
    if (!customDate) return;
    // Convert HTML date input (yyyy-mm-dd) to our key format
    onSelect(customDate);
    setOpen(false);
  }, [customDate, onSelect]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 font-medium">
          <CalendarDays className="h-4 w-4" />
          {label}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Select</DropdownMenuLabel>
        <DropdownMenuItem
          className={selectedDate === todayKey ? 'bg-sky-50' : ''}
          onClick={() => {
            onSelect(todayKey);
            setOpen(false);
          }}
        >
          Today
        </DropdownMenuItem>
        <DropdownMenuItem
          className={selectedDate === yesterdayKey ? 'bg-sky-50' : ''}
          onClick={() => {
            onSelect(yesterdayKey);
            setOpen(false);
          }}
        >
          Yesterday
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Custom Date</DropdownMenuLabel>
        <div className="px-2 py-1.5 space-y-2">
          <Input
            type="date"
            value={customDate}
            max={todayKey}
            onChange={(e) => setCustomDate(e.target.value)}
            className="text-xs rounded-xl"
          />
          <Button
            size="sm"
            className="w-full rounded-xl text-xs"
            disabled={!customDate}
            onClick={handleCustomDate}
          >
            Go to Date
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function DailyUpdatesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>

      {/* Today Summary */}
      <Skeleton className="h-52 rounded-3xl" />

      {/* Detail cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-56 rounded-3xl" />
      </div>

      {/* Recent list */}
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({ childName }: { childName: string }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-20 h-20 rounded-full bg-sky-50 flex items-center justify-center">
          <Sun className="h-10 w-10 text-sky-400" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">No Updates Yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Daily updates for {childName} will appear here once the teacher publishes them.
            Check back later today!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MAIN PAGE CONTENT (inner — inside Suspense)
// ============================================================

function DailyUpdatesContent() {
  const { selectedChildId, selectedChild, children, selectChild } = useParentAuth();

  // Selected date for detailed view, defaults to today
  const [selectedDate, setSelectedDate] = useState(getTodayKey());

  // Fetch daily updates
  const { data, isLoading, isError, error, refetch } = useParentDailyUpdates(
    selectedChildId,
    selectedDate
  );

  const childName = `${selectedChild?.firstName || ''} ${selectedChild?.lastName || ''}`.trim() || 'Child';

  // Find today's update
  const updates = data?.updates || [];
  const todayUpdate = useMemo(
    () => updates.find((u) => isToday(u.date)) ?? null,
    [updates]
  );

  // Find the selected date's update (for detailed sections)
  const selectedDateUpdate = useMemo(
    () => updates.find((u) => formatDateKey(u.date) === selectedDate) ?? null,
    [updates, selectedDate]
  );

  // Loading state
  if (isLoading && !data) {
    return <DailyUpdatesLoadingSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">
          {error?.message || 'Failed to load daily updates'}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (updates.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
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

        <EmptyState childName={childName} />
      </div>
    );
  }

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
          {/* Date Picker */}
          <DatePickerDropdown
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />

          {/* Child Switcher (if multiple children) */}
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
      {/* TODAY'S SUMMARY CARD (gradient, shown only if today's data)   */}
      {/* ============================================================ */}
      {todayUpdate && (
        <TodaySummaryCard update={todayUpdate} />
      )}

      {/* ============================================================ */}
      {/* DETAILED SECTIONS (for selected date)                         */}
      {/* ============================================================ */}
      {selectedDateUpdate ? (
        <>
          {/* Date indicator for non-today views */}
          {!isToday(selectedDateUpdate.date) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                Showing updates for <strong>{getRelativeDateLabel(selectedDateUpdate.date)}</strong> — {formatDateShort(selectedDateUpdate.date)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MealsCard update={selectedDateUpdate} />
            <SleepCard update={selectedDateUpdate} />
            <ActivityCard update={selectedDateUpdate} />
          </div>
        </>
      ) : (
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              No update available for {getRelativeDateLabel(selectedDate)}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              The teacher hasn&apos;t published an update for this date yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* RECENT UPDATES LIST                                           */}
      {/* ============================================================ */}
      <RecentUpdatesList updates={updates} />
    </div>
  );
}

// ============================================================
// MAIN PAGE EXPORT (with Suspense)
// ============================================================

export default function DailyUpdatesPage() {
  return (
    <Suspense fallback={<DailyUpdatesLoadingSkeleton />}>
      <DailyUpdatesContent />
    </Suspense>
  );
}
