'use client';

// ============================================================
// PreOne — Parent Observations Page
// Shows teacher observations for the selected child:
// - Stats cards (total, unacknowledged, by category)
// - Category & priority filter bar
// - Timeline-style observation cards with acknowledge action
// - Empty state when no observations exist
// ============================================================

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import {
  Eye, AlertCircle, Camera, RefreshCw, ChevronDown,
  CheckCircle2, Clock, Filter, MessageSquare,
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
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { useParentAuth } from '@/lib/parent-auth';
import {
  useParentObservations,
  type ObservationData,
} from '@/hooks/use-parent';

// ============================================================
// CONSTANTS & CONFIG
// ============================================================

const CATEGORIES = ['BEHAVIORAL', 'ACADEMIC', 'SOCIAL', 'EMOTIONAL', 'PHYSICAL', 'COGNITIVE'] as const;
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CONCERN'] as const;

const CATEGORY_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  BEHAVIORAL: { label: 'Behavioral', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  ACADEMIC:   { label: 'Academic',   bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  SOCIAL:     { label: 'Social',     bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  EMOTIONAL:  { label: 'Emotional',  bg: 'bg-rose-100',   text: 'text-rose-700',   dot: 'bg-rose-500' },
  PHYSICAL:   { label: 'Physical',   bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  COGNITIVE:  { label: 'Cognitive',  bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-500' },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  LOW:     { label: 'Low',     bg: 'bg-gray-100',  text: 'text-gray-600' },
  NORMAL:  { label: 'Normal',  bg: 'bg-blue-100',  text: 'text-blue-600' },
  HIGH:    { label: 'High',    bg: 'bg-amber-100', text: 'text-amber-600' },
  CONCERN: { label: 'Concern', bg: 'bg-red-100',   text: 'text-red-600' },
};

const PIE_COLORS: Record<string, string> = {
  BEHAVIORAL: '#a855f7',
  ACADEMIC:   '#3b82f6',
  SOCIAL:     '#10b981',
  EMOTIONAL:  '#f43f5e',
  PHYSICAL:   '#f59e0b',
  COGNITIVE:  '#0ea5e9',
};

// ============================================================
// HELPERS
// ============================================================

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

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || { label: category, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
}

function getPriorityConfig(priority: string) {
  return PRIORITY_CONFIG[priority] || { label: priority, bg: 'bg-gray-100', text: 'text-gray-600' };
}

// ============================================================
// CATEGORY PIE CHART
// ============================================================

function CategoryPieChart({ categories }: { categories: Record<string, number> }) {
  const data = Object.entries(categories)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name: getCategoryConfig(key).label,
      value: count,
      key,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-28 w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={48}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={PIE_COLORS[entry.key] || '#94a3b8'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 min-w-0">
        {data.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2 text-xs">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: PIE_COLORS[entry.key] || '#94a3b8' }}
            />
            <span className="text-muted-foreground truncate">{entry.name}</span>
            <span className="font-semibold ml-auto">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// STATS CARDS ROW
// ============================================================

function StatsCards({
  total,
  unacknowledged,
  categories,
}: {
  total: number;
  unacknowledged: number;
  categories: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Observations */}
      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-sky-100">
              <Eye className="h-4 w-4 text-sky-600" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{total}</span>
          </div>
          <p className="text-xs text-muted-foreground">Total Observations</p>
        </CardContent>
      </Card>

      {/* Unacknowledged */}
      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-amber-100">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-amber-600">{unacknowledged}</span>
          </div>
          <p className="text-xs text-muted-foreground">Pending Acknowledgment</p>
        </CardContent>
      </Card>

      {/* By Category */}
      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">By Category</p>
          </div>
          <CategoryPieChart categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// OBSERVATION TIMELINE CARD
// ============================================================

function ObservationCard({
  observation,
  onAcknowledge,
}: {
  observation: ObservationData;
  onAcknowledge: (id: string) => void;
}) {
  const catConfig = getCategoryConfig(observation.category);
  const priConfig = getPriorityConfig(observation.priority);

  return (
    <div className="flex gap-4 group">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div className={`h-3 w-3 rounded-full ${catConfig.dot} ring-2 ring-white shadow-sm`} />
        <div className="w-px flex-1 bg-gray-200 mt-1 group-last:bg-transparent" />
      </div>

      {/* Card content */}
      <Card className="rounded-3xl flex-1 mb-3 transition-shadow hover:shadow-md">
        <CardContent className="p-4 space-y-3">
          {/* Top row: date, badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">
                {formatDate(observation.createdAt)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatTime(observation.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className={`${catConfig.bg} ${catConfig.text} text-[10px] border-0 font-medium`}>
                {catConfig.label}
              </Badge>
              <Badge className={`${priConfig.bg} ${priConfig.text} text-[10px] border-0 font-medium`}>
                {priConfig.label}
              </Badge>
              {observation.media && (
                <Badge className="bg-gray-100 text-gray-600 text-[10px] border-0 gap-1">
                  <Camera className="h-3 w-3" />
                  Media
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-sm leading-relaxed">{observation.content}</p>

          {/* Acknowledgment status + action */}
          <Separator />
          <div className="flex items-center justify-between">
            {observation.parentAck ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Acknowledged
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  Pending
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 text-white border-0 hover:from-sky-600 hover:to-blue-600"
                  onClick={() => onAcknowledge(observation.id)}
                >
                  Acknowledge
                </Button>
              </div>
            )}

            {observation.parentComment && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-[50%]">
                <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                <span className="truncate">{observation.parentComment}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function ObservationsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>

      {/* Filter bar skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Timeline skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center shrink-0 pt-1">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="w-px h-16 mt-1" />
            </div>
            <Skeleton className="h-36 flex-1 rounded-3xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ERROR STATE
// ============================================================

function ObservationsErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle className="h-12 w-12 text-red-400" />
      <p className="text-red-500 text-sm">{message}</p>
      <Button onClick={onRetry} variant="outline" className="rounded-xl">
        <RefreshCw className="h-4 w-4 mr-2" /> Retry
      </Button>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function ObservationsEmptyState({ childName }: { childName: string }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="h-16 w-16 rounded-full bg-sky-50 flex items-center justify-center">
          <Eye className="h-8 w-8 text-sky-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-medium text-muted-foreground">No observations yet</p>
          <p className="text-xs text-muted-foreground">
            Teacher observations for {childName} will appear here as they are recorded.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MAIN PAGE CONTENT (inside Suspense)
// ============================================================

function ObservationsPageContent() {
  const { selectedChildId, selectedChild, children, selectChild } = useParentAuth();
  const { data, isLoading, isError, error, refetch } = useParentObservations(selectedChildId);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Local ack state (UI-only, no API)
  const [ackedIds, setAckedIds] = useState<Set<string>>(new Set());

  const handleAcknowledge = useCallback((id: string) => {
    setAckedIds((prev) => new Set(prev).add(id));
  }, []);

  const childName = selectedChild
    ? `${selectedChild.firstName} ${selectedChild.lastName}`
    : 'Child';

  // Derived data
  const observations = useMemo(() => {
    if (!data?.observations) return [];
    return data.observations.map((obs) => ({
      ...obs,
      parentAck: ackedIds.has(obs.id) ? true : obs.parentAck,
    }));
  }, [data?.observations, ackedIds]);

  const total = data?.total ?? 0;
  const categories = data?.categories ?? {};

  const unacknowledged = useMemo(
    () => observations.filter((o) => !o.parentAck).length,
    [observations]
  );

  // Filtered observations
  const filtered = useMemo(() => {
    return observations.filter((obs) => {
      if (categoryFilter !== 'ALL' && obs.category !== categoryFilter) return false;
      if (priorityFilter !== 'ALL' && obs.priority !== priorityFilter) return false;
      return true;
    });
  }, [observations, categoryFilter, priorityFilter]);

  // ── Loading state ──
  if (isLoading && !data) {
    return <ObservationsLoadingSkeleton />;
  }

  // ── Error state ──
  if (isError) {
    return (
      <ObservationsErrorState
        message={error?.message || 'Failed to load observations'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Observations</h1>
          <p className="text-sm text-muted-foreground">
            Teacher observations for {childName}
            {selectedChild?.className && (
              <span className="text-muted-foreground"> — {selectedChild.className}</span>
            )}
          </p>
        </div>

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

      {/* ── Stats Cards ── */}
      <StatsCards
        total={total}
        unacknowledged={unacknowledged}
        categories={categories}
      />

      {/* ── Filter Bar ── */}
      {observations.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters:
          </div>

          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1">
                {categoryFilter === 'ALL' ? 'All Categories' : getCategoryConfig(categoryFilter).label}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className={categoryFilter === 'ALL' ? 'bg-sky-50' : ''}
                onClick={() => setCategoryFilter('ALL')}
              >
                All Categories
              </DropdownMenuItem>
              {CATEGORIES.map((cat) => {
                const config = getCategoryConfig(cat);
                return (
                  <DropdownMenuItem
                    key={cat}
                    className={categoryFilter === cat ? 'bg-sky-50' : ''}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    <div className={`h-2 w-2 rounded-full ${config.dot} mr-2`} />
                    {config.label}
                    {categories[cat] ? (
                      <span className="ml-auto text-muted-foreground text-[10px]">{categories[cat]}</span>
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1">
                {priorityFilter === 'ALL' ? 'All Priorities' : getPriorityConfig(priorityFilter).label}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className={priorityFilter === 'ALL' ? 'bg-sky-50' : ''}
                onClick={() => setPriorityFilter('ALL')}
              >
                All Priorities
              </DropdownMenuItem>
              {PRIORITIES.map((pri) => {
                const config = getPriorityConfig(pri);
                return (
                  <DropdownMenuItem
                    key={pri}
                    className={priorityFilter === pri ? 'bg-sky-50' : ''}
                    onClick={() => setPriorityFilter(pri)}
                  >
                    <Badge className={`${config.bg} ${config.text} text-[9px] border-0 mr-2`}>
                      {config.label}
                    </Badge>
                    {pri}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active filter count + clear */}
          {(categoryFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg text-xs text-sky-600 hover:text-sky-700"
              onClick={() => {
                setCategoryFilter('ALL');
                setPriorityFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* ── Observations Timeline ── */}
      {observations.length === 0 ? (
        <ObservationsEmptyState childName={childName} />
      ) : filtered.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Filter className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No observations match the selected filters</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
              onClick={() => {
                setCategoryFilter('ALL');
                setPriorityFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          {filtered.map((obs) => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              onAcknowledge={handleAcknowledge}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE EXPORT (with Suspense boundary)
// ============================================================

export default function ObservationsPage() {
  return (
    <Suspense fallback={<ObservationsLoadingSkeleton />}>
      <ObservationsPageContent />
    </Suspense>
  );
}
