'use client';

// ============================================================
// PreOne — Parent Growth & Development Page (Enhanced)
// Shows comprehensive growth tracking for the selected child:
// - Page Header with child switcher & period selector
// - Growth Radar Chart (6-dim, child vs class average)
// - Score Breakdown Table (difference + status badges)
// - Growth Trend Chart (line chart, all dimensions + overall)
// - Milestones Section (grouped by category, progress bar)
// - AI Insights Section
// ============================================================

import React, { useMemo, useState, Suspense } from 'react';
import {
  TrendingUp, RefreshCw, AlertCircle, ChevronDown,
  Target, Sparkles, Brain, CheckCircle2, Circle,
  ArrowUp, ArrowDown, ArrowRight, Lightbulb, Info,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { useParentAuth } from '@/lib/parent-auth';
import {
  useParentGrowth,
  type EnhancedGrowthResponse,
} from '@/hooks/use-parent';
import { PORTAL_THEMES, GROWTH_COLORS, CHART_PALETTE } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.parent;

// ============================================================
// CONSTANTS
// ============================================================

const DIMENSIONS = [
  { key: 'creativity', label: 'Creativity', color: GROWTH_COLORS.creativity.hex, bgLight: GROWTH_COLORS.creativity.bg, textColor: GROWTH_COLORS.creativity.text },
  { key: 'communication', label: 'Communication', color: GROWTH_COLORS.communication.hex, bgLight: GROWTH_COLORS.communication.bg, textColor: GROWTH_COLORS.communication.text },
  { key: 'social', label: 'Social', color: GROWTH_COLORS.social.hex, bgLight: GROWTH_COLORS.social.bg, textColor: GROWTH_COLORS.social.text },
  { key: 'confidence', label: 'Confidence', color: CHART_PALETTE.series[3], bgLight: 'bg-amber-100', textColor: 'text-amber-600' },
  { key: 'cognitive', label: 'Cognitive', color: GROWTH_COLORS.cognitive.hex, bgLight: GROWTH_COLORS.cognitive.bg, textColor: GROWTH_COLORS.cognitive.text },
  { key: 'physical', label: 'Physical', color: GROWTH_COLORS.physical.hex, bgLight: GROWTH_COLORS.physical.bg, textColor: GROWTH_COLORS.physical.text },
] as const;

const PERIODS = [
  { key: 'Q1', label: 'Q1' },
  { key: 'Q2', label: 'Q2' },
  { key: 'Q3', label: 'Q3' },
  { key: 'Q4', label: 'Q4' },
  { key: 'ANNUAL', label: 'Annual' },
] as const;

const CHILD_RADAR_COLOR = CHART_PALETTE.series[1];
const CLASS_AVG_COLOR = CHART_PALETTE.axisLight;

const CATEGORY_ICONS: Record<string, string> = {
  Physical: '🏃',
  Cognitive: '🧠',
  Social: '🤝',
  Language: '💬',
};

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(score: number): { label: string; className: string } {
  if (score > 90) return { label: 'Outstanding', className: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (score > 80) return { label: 'Excellent', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (score > 70) return { label: 'Above Average', className: 'bg-sky-100 text-sky-800 border-sky-200' };
  if (score >= 50) return { label: 'Average', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  if (score >= 40) return { label: 'Below Average', className: 'bg-orange-100 text-orange-800 border-orange-200' };
  return { label: 'Needs Attention', className: 'bg-red-100 text-red-800 border-red-200' };
}

function getDifferenceIcon(diff: number) {
  if (diff > 0) return <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />;
  if (diff < 0) return <ArrowDown className="h-3.5 w-3.5 text-red-500" />;
  return <ArrowRight className="h-3.5 w-3.5 text-gray-400" />;
}

function getDifferenceColor(diff: number): string {
  if (diff > 0) return 'text-emerald-600';
  if (diff < 0) return 'text-red-500';
  return 'text-gray-400';
}

function getSeverityStyle(severity: string | null): { bg: string; border: string; icon: string } {
  switch (severity) {
    case 'high':
      return { bg: 'bg-red-50', border: 'border-red-200', icon: '🔴' };
    case 'medium':
      return { bg: 'bg-amber-50', border: 'border-amber-200', icon: '🟡' };
    case 'low':
      return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '🟢' };
    default:
      return { bg: 'bg-sky-50', border: 'border-sky-200', icon: '💡' };
  }
}

// ============================================================
// PERIOD SELECTOR
// ============================================================

function PeriodSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (period: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => onSelect(p.key)}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            selected === p.key
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// GROWTH RADAR CHART
// ============================================================

function GrowthRadarChart({
  scores,
  classAverage,
}: {
  scores: Record<string, number>;
  classAverage: Record<string, number>;
}) {
  const radarData = useMemo(() => {
    return DIMENSIONS.map((dim) => ({
      dimension: dim.label,
      child: scores[dim.key] ?? 0,
      classAvg: classAverage[dim.key] ?? 0,
      fullMark: 100,
    }));
  }, [scores, classAverage]);

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-sky-600" />
          Growth Dimensions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] sm:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
              <PolarGrid stroke={CHART_PALETTE.grid} />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 11, fill: CHART_PALETTE.axis }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: CHART_PALETTE.axisLight }}
                tickCount={6}
              />
              <Radar
                name="Your Child"
                dataKey="child"
                stroke={CHILD_RADAR_COLOR}
                fill={CHILD_RADAR_COLOR}
                fillOpacity={0.15}
                strokeWidth={2.5}
              />
              <Radar
                name="Class Average"
                dataKey="classAvg"
                stroke={CLASS_AVG_COLOR}
                fill={CLASS_AVG_COLOR}
                fillOpacity={0.05}
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                formatter={(value: string) => (
                  <span className={value === 'Your Child' ? 'text-sky-700 font-medium' : 'text-gray-500'}>
                    {value}
                  </span>
                )}
              />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: `1px solid ${CHART_PALETTE.grid}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  const label = name === 'child' ? 'Your Child' : 'Class Average';
                  return [`${value}`, label];
                }}
                labelFormatter={(label: string) => `${label}`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// SCORE BREAKDOWN TABLE
// ============================================================

function ScoreBreakdownTable({
  scores,
  classAverage,
}: {
  scores: Record<string, number>;
  classAverage: Record<string, number>;
}) {
  const rows = useMemo(() => {
    return DIMENSIONS.map((dim) => {
      const childScore = scores[dim.key] ?? 0;
      const avgScore = classAverage[dim.key] ?? 0;
      const diff = childScore - avgScore;
      const status = getStatusBadge(childScore);
      return { dim, childScore, avgScore, diff, status };
    });
  }, [scores, classAverage]);

  // Overall row
  const overallScore = scores['overall'] ?? 0;
  const overallAvg = classAverage['overall'] ?? 0;
  const overallDiff = overallScore - overallAvg;
  const overallStatus = getStatusBadge(overallScore);

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4 text-sky-600" />
          Score Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-2 px-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Dimension</TableHead>
                <TableHead className="text-xs font-semibold text-center">Your Child</TableHead>
                <TableHead className="text-xs font-semibold text-center">Class Avg</TableHead>
                <TableHead className="text-xs font-semibold text-center">Difference</TableHead>
                <TableHead className="text-xs font-semibold text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ dim, childScore, avgScore, diff, status }) => (
                <TableRow key={dim.key} className="hover:bg-gray-50/50">
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full`} style={{ backgroundColor: dim.color }} />
                      <span className="text-sm font-medium">{dim.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <span className="text-sm font-bold">{childScore}</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <span className="text-sm text-muted-foreground">{avgScore}</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getDifferenceIcon(diff)}
                      <span className={`text-sm font-medium ${getDifferenceColor(diff)}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${status.className}`}>
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {/* Overall row */}
              <TableRow className="hover:bg-sky-50/50 border-t-2 border-sky-100">
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <span className="text-sm font-bold">Overall</span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 text-center">
                  <span className="text-sm font-bold text-sky-700">{overallScore}</span>
                </TableCell>
                <TableCell className="py-2.5 text-center">
                  <span className="text-sm text-muted-foreground">{overallAvg}</span>
                </TableCell>
                <TableCell className="py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getDifferenceIcon(overallDiff)}
                    <span className={`text-sm font-medium ${getDifferenceColor(overallDiff)}`}>
                      {overallDiff > 0 ? '+' : ''}{overallDiff}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 text-center">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${overallStatus.className}`}>
                    {overallStatus.label}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// GROWTH TREND CHART
// ============================================================

function GrowthTrendChart({
  trend,
}: {
  trend: EnhancedGrowthResponse['trend'];
}) {
  if (!trend || trend.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sky-600" />
            Growth Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-2">
            <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No trend data available</p>
            <p className="text-xs text-muted-foreground">
              Trends will appear after multiple assessments are completed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sky-600" />
          Growth Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: CHART_PALETTE.axis }}
                axisLine={{ stroke: CHART_PALETTE.grid }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: CHART_PALETTE.axis }}
                axisLine={{ stroke: CHART_PALETTE.grid }}
              />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: `1px solid ${CHART_PALETTE.grid}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              {DIMENSIONS.map((dim) => (
                <Line
                  key={dim.key}
                  type="monotone"
                  dataKey={dim.key}
                  name={dim.label}
                  stroke={dim.color}
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: dim.color }}
                  activeDot={{ r: 5 }}
                />
              ))}
              {trend.some((t) => t.overall !== null) && (
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="Overall"
                  stroke={CHART_PALETTE.series[1]}
                  strokeWidth={3}
                  dot={{ r: 4, fill: CHART_PALETTE.series[1], stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MILESTONES SECTION
// ============================================================

function MilestonesSection({
  milestones,
}: {
  milestones: EnhancedGrowthResponse['milestones'];
}) {
  // Group by category — must be called before any early return
  const groupedMilestones = useMemo(() => {
    if (!milestones || !milestones.items || milestones.items.length === 0) return [];
    const groups: Record<string, typeof milestones.items> = {};
    for (const m of milestones.items) {
      const category = m.category || 'Uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push(m);
    }
    // Sort categories in a preferred order
    const preferredOrder = ['Physical', 'Cognitive', 'Social', 'Language', 'Uncategorized'];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const ai = preferredOrder.indexOf(a);
      const bi = preferredOrder.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    return sortedKeys.map((key) => ({ category: key, items: groups[key] }));
  }, [milestones]);

  if (!milestones || milestones.items.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-600" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-2">
            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No milestones recorded yet</p>
            <p className="text-xs text-muted-foreground">
              Milestones will appear as developmental goals are tracked
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = milestones.total > 0
    ? Math.round((milestones.achieved / milestones.total) * 100)
    : 0;

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-600" />
            Milestones
            <Badge variant="outline" className="text-[10px] ml-1">
              {milestones.ageGroup}
            </Badge>
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {milestones.achieved}/{milestones.total} achieved ({progressPercent}%)
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Grouped milestones by category */}
        {groupedMilestones.map(({ category, items }) => (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-sky-100 flex items-center justify-center text-sm">
                {CATEGORY_ICONS[category] || '📋'}
              </div>
              <h3 className="text-sm font-semibold">{category}</h3>
              <Badge variant="outline" className="text-[10px]">
                {items.filter((i) => i.status === 'ACHIEVED').length}/{items.length}
              </Badge>
            </div>

            {/* Milestone items */}
            <div className="space-y-1.5 ml-9">
              {items.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Status icon */}
                  {milestone.status === 'ACHIEVED' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${milestone.status === 'ACHIEVED' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {milestone.name}
                      </p>
                      {milestone.status === 'ACHIEVED' && milestone.achievedDate && (
                        <span className="text-[10px] text-emerald-600 font-medium">
                          {formatDate(milestone.achievedDate)}
                        </span>
                      )}
                    </div>
                    {milestone.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Progress bar at bottom */}
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Overall Progress
            </span>
            <span className="text-xs font-bold text-sky-700">
              {milestones.achieved}/{milestones.total} milestones achieved ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// AI INSIGHTS SECTION
// ============================================================

function AIInsightsSection({
  insights,
}: {
  insights: EnhancedGrowthResponse['aiInsights'];
}) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-sky-600" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights && insights.length > 0 ? (
          <>
            {insights.map((item, index) => {
              const style = getSeverityStyle(item.severity);
              const dimLabel = DIMENSIONS.find((d) => d.key === item.dimension)?.label || item.dimension;
              return (
                <div
                  key={index}
                  className={`p-3.5 rounded-xl border ${style.bg} ${style.border}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0 mt-0.5">{style.icon}</span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm leading-relaxed">{item.insight}</p>
                      {item.dimension && (
                        <p className="text-[10px] text-muted-foreground font-medium">
                          Dimension: {dimLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <Separator />
            <div className="flex items-center gap-2 py-1">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground italic">
                More personalized insights coming soon as we gather more assessment data.
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-2">
            <Brain className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No AI insights available yet</p>
            <p className="text-xs text-muted-foreground">
              AI-powered observations will appear once more assessment data is collected
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground italic">
                Personalized insights coming soon
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function GrowthLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>
      {/* Period selector skeleton */}
      <Skeleton className="h-9 w-72 rounded-xl" />
      {/* Radar chart skeleton */}
      <Skeleton className="h-[420px] rounded-3xl" />
      {/* Score breakdown skeleton */}
      <Skeleton className="h-72 rounded-3xl" />
      {/* Trend chart skeleton */}
      <Skeleton className="h-80 rounded-3xl" />
      {/* Milestones skeleton */}
      <Skeleton className="h-96 rounded-3xl" />
      {/* AI Insights skeleton */}
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}

// ============================================================
// ERROR STATE
// ============================================================

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

function EmptyState() {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-16 w-16 rounded-2xl bg-sky-100 flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-sky-600" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold">No Growth Data Yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Growth assessments, achievements, and milestones will appear here once your child&apos;s development tracking begins.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MAIN PAGE CONTENT
// ============================================================

function GrowthPageContent() {
  const { selectedChildId, selectedChild, children, selectChild } = useParentAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Q4');

  // Fetch enhanced growth data
  const { data, isLoading, isError, error, refetch } = useParentGrowth(selectedChildId, selectedPeriod);

  const childName = `${selectedChild?.firstName || ''} ${selectedChild?.lastName || ''}`.trim() || 'Child';

  // Loading state
  if (isLoading && !data) {
    return <GrowthLoadingSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <ErrorState
        message={error?.message || 'Failed to load growth data'}
        onRetry={() => refetch()}
      />
    );
  }

  const scores = data?.scores || {};
  const classAverage = data?.classAverage || {};
  const trend = data?.trend || [];
  const achievements = data?.achievements || [];
  const milestonesData = data?.milestones || { ageGroup: '', total: 0, achieved: 0, items: [] };
  const aiInsights = data?.aiInsights || [];

  // Check if we have any meaningful data at all
  const hasAnyData = Object.keys(scores).length > 0 || trend.length > 0 || achievements.length > 0 || (milestonesData.items && milestonesData.items.length > 0);

  return (
    <div className="space-y-6">
      {/* ===== Page Header ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Growth & Development</h1>
          <p className="text-sm text-muted-foreground">
            Tracking development for {childName}
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

      {/* ===== Period Selector ===== */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">Period:</span>
        <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} />
      </div>

      {/* ===== Empty State ===== */}
      {!hasAnyData ? (
        <EmptyState />
      ) : (
        <>
          {/* ===== Growth Radar Chart (Full Width — Main Visual) ===== */}
          <GrowthRadarChart scores={scores} classAverage={classAverage} />

          {/* ===== Score Breakdown Table ===== */}
          <ScoreBreakdownTable scores={scores} classAverage={classAverage} />

          {/* ===== Growth Trend Chart ===== */}
          <GrowthTrendChart trend={trend} />

          {/* ===== Milestones Section ===== */}
          <MilestonesSection milestones={milestonesData} />

          {/* ===== AI Insights Section ===== */}
          <AIInsightsSection insights={aiInsights} />
        </>
      )}
    </div>
  );
}

// ============================================================
// EXPORT — Wrapped in Suspense
// ============================================================

export default function ParentGrowthPage() {
  return (
    <Suspense fallback={<GrowthLoadingSkeleton />}>
      <GrowthPageContent />
    </Suspense>
  );
}
