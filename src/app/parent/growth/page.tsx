'use client';

// ============================================================
// PreOne — Parent Growth & Development Page
// Shows growth scores, achievements, and milestones for the
// selected child:
// - Latest score card with circular progress + dimension bars
// - Radar chart for 6 growth dimensions
// - Progress over time bar chart (multiple periods)
// - Achievements section with trophy/star theming
// - Milestones list grouped by category with status badges
// ============================================================

import React, { useMemo, Suspense } from 'react';
import {
  TrendingUp, RefreshCw, AlertCircle, ChevronDown,
  Trophy, Star, Target, Award, Milestone, Sparkles,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { useParentAuth } from '@/lib/parent-auth';
import {
  useParentGrowth,
  type GrowthScoreData, type AchievementData, type MilestoneData,
} from '@/hooks/use-parent';

// ============================================================
// CONSTANTS
// ============================================================

const DIMENSIONS = [
  { key: 'creativity', label: 'Creativity', color: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-100', chartColor: '#a855f7' },
  { key: 'communication', label: 'Communication', color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-100', chartColor: '#3b82f6' },
  { key: 'social', label: 'Social', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-100', chartColor: '#10b981' },
  { key: 'confidence', label: 'Confidence', color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-100', chartColor: '#f59e0b' },
  { key: 'cognitive', label: 'Cognitive', color: 'bg-sky-500', textColor: 'text-sky-600', bgLight: 'bg-sky-100', chartColor: '#0ea5e9' },
  { key: 'physical', label: 'Physical', color: 'bg-rose-500', textColor: 'text-rose-600', bgLight: 'bg-rose-100', chartColor: '#f43f5e' },
] as const;

const MILESTONE_STATUS_STYLES: Record<string, { bg: string; icon: string }> = {
  ACHIEVED: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✅' },
  PENDING: { bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: '⏳' },
};

const DEFAULT_ACHIEVEMENT_ICON = '🏆';

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

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 75) return 'text-sky-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreRingColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 75) return '#0ea5e9';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getMilestoneStatusStyle(status: string) {
  return MILESTONE_STATUS_STYLES[status] || { bg: 'bg-gray-100 text-gray-500 border-gray-200', icon: '•' };
}

// ============================================================
// CIRCULAR PROGRESS INDICATOR
// ============================================================

function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = getScoreRingColor(value);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getScoreColor(value)}`}>{value}</span>
        <span className="text-[10px] text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

// ============================================================
// LATEST SCORE CARD
// ============================================================

function LatestScoreCard({ score }: { score: GrowthScoreData }) {
  return (
    <Card className="rounded-3xl overflow-hidden">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-500 p-5 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 opacity-90" />
              <h2 className="text-lg font-bold">Latest Assessment</h2>
            </div>
            <p className="text-sm opacity-90">
              {score.period}
              {score.createdAt && (
                <span className="opacity-75"> — Evaluated on {formatDate(score.createdAt)}</span>
              )}
            </p>
          </div>
          {score.overall !== null && (
            <CircularProgress value={score.overall} size={100} strokeWidth={7} />
          )}
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Dimension Scores Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DIMENSIONS.map((dim) => {
            const rawValue = score[dim.key as keyof GrowthScoreData];
            const value = typeof rawValue === 'number' ? rawValue : 0;
            const percentage = (value / 10) * 100;

            return (
              <div key={dim.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{dim.label}</span>
                  <span className={`text-sm font-bold ${dim.textColor}`}>{value}/10</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dim.color} transition-all duration-700 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Comments */}
        {score.comments && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Teacher&apos;s Comments
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {score.comments}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// RADAR CHART
// ============================================================

function GrowthRadarChart({ score }: { score: GrowthScoreData }) {
  const radarData = useMemo(() => {
    return DIMENSIONS.map((dim) => ({
      dimension: dim.label,
      value: typeof score[dim.key as keyof GrowthScoreData] === 'number'
        ? score[dim.key as keyof GrowthScoreData] as number
        : 0,
      fullMark: 10,
    }));
  }, [score]);

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-sky-600" />
          Growth Dimensions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 10]}
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                tickCount={6}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}/10`, 'Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// PROGRESS OVER TIME BAR CHART
// ============================================================

function ProgressOverTimeChart({ scores }: { scores: GrowthScoreData[] }) {
  const chartData = useMemo(() => {
    return scores
      .filter((s) => s.overall !== null)
      .map((s) => ({
        period: s.period,
        overall: s.overall as number,
      }));
  }, [scores]);

  if (chartData.length < 2) {
    return null;
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sky-600" />
          Progress Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickFormatter={(v: number) => `${v}`}
              />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}/100`, 'Overall Score']}
              />
              <Bar
                dataKey="overall"
                fill="#0ea5e9"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ACHIEVEMENTS SECTION
// ============================================================

function AchievementsSection({ achievements }: { achievements: AchievementData[] }) {
  if (achievements.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-sky-600" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-2">
            <Trophy className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No achievements yet</p>
            <p className="text-xs text-muted-foreground">
              Achievements will appear as your child reaches new milestones
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-sky-600" />
          Achievements
          <Badge variant="outline" className="text-[10px] ml-1">
            {achievements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ACHIEVEMENT CARD
// ============================================================

function AchievementCard({ achievement }: { achievement: AchievementData }) {
  const iconDisplay = achievement.icon || DEFAULT_ACHIEVEMENT_ICON;

  return (
    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-yellow-50/50 border border-amber-100 hover:shadow-md transition-shadow">
      {/* Decorative star */}
      <Star className="absolute top-2 right-2 h-4 w-4 text-amber-300 fill-amber-300 opacity-40" />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg">
          {iconDisplay}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold truncate">{achievement.title}</p>
          {achievement.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {achievement.description}
            </p>
          )}
          {achievement.date && (
            <p className="text-[10px] text-muted-foreground">
              {formatDate(achievement.date)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MILESTONES SECTION
// ============================================================

function MilestonesSection({ milestones }: { milestones: MilestoneData[] }) {
  // Group milestones by category
  const groupedMilestones = useMemo(() => {
    const groups: Record<string, MilestoneData[]> = {};
    for (const m of milestones) {
      const category = m.milestoneCategory || 'Uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push(m);
    }
    return groups;
  }, [milestones]);

  if (milestones.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Milestone className="h-4 w-4 text-sky-600" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-2">
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

  const categoryOrder = Object.keys(groupedMilestones).sort();

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Milestone className="h-4 w-4 text-sky-600" />
            Milestones
            <Badge variant="outline" className="text-[10px] ml-1">
              {milestones.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {Object.entries(MILESTONE_STATUS_STYLES).map(([status, style]) => (
              <span key={status} className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span>{style.icon}</span> {status}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {categoryOrder.map((category) => (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-lg bg-sky-100 flex items-center justify-center">
                <Award className="h-3.5 w-3.5 text-sky-600" />
              </div>
              <h3 className="text-sm font-semibold">{category}</h3>
              <Badge variant="outline" className="text-[10px]">
                {groupedMilestones[category].length}
              </Badge>
            </div>

            {/* Milestone items */}
            <div className="space-y-2 ml-8">
              {groupedMilestones[category].map((milestone) => (
                <MilestoneItem key={milestone.id} milestone={milestone} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================
// MILESTONE ITEM
// ============================================================

function MilestoneItem({ milestone }: { milestone: MilestoneData }) {
  const statusStyle = getMilestoneStatusStyle(milestone.status);

  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">
            {milestone.milestoneName || 'Unnamed Milestone'}
          </p>
          <Badge className={`${statusStyle.bg} text-[10px] border`}>
            {statusStyle.icon} {milestone.status}
          </Badge>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {milestone.milestoneAgeGroup && (
            <span className="text-[10px] text-muted-foreground">
              Age Group: {milestone.milestoneAgeGroup}
            </span>
          )}
          {milestone.achievedDate && (
            <span className="text-[10px] text-muted-foreground">
              Achieved: {formatDate(milestone.achievedDate)}
            </span>
          )}
        </div>

        {milestone.notes && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {milestone.notes}
          </p>
        )}
      </div>
    </div>
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
      {/* Latest score card skeleton */}
      <Skeleton className="h-80 rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
      {/* Achievements skeleton */}
      <Skeleton className="h-64 rounded-3xl" />
      {/* Milestones skeleton */}
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

// ============================================================
// MAIN PAGE CONTENT
// ============================================================

function GrowthPageContent() {
  const { selectedChildId, selectedChild, children, selectChild } = useParentAuth();

  // Fetch growth data
  const { data, isLoading, isError, error, refetch } = useParentGrowth(selectedChildId);

  const childName = `${selectedChild?.firstName || ''} ${selectedChild?.lastName || ''}`.trim() || 'Child';

  // Loading state
  if (isLoading && !data) {
    return <GrowthLoadingSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">
          {error?.message || 'Failed to load growth data'}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const growthScores = data?.growthScores || [];
  const achievements = data?.achievements || [];
  const milestones = data?.milestones || [];

  // Get the latest score (first in the array, assuming sorted desc)
  const latestScore = growthScores.length > 0 ? growthScores[0] : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* No Growth Data Empty State */}
      {!latestScore && achievements.length === 0 && milestones.length === 0 ? (
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
      ) : (
        <>
          {/* Latest Score Card */}
          {latestScore ? (
            <LatestScoreCard score={latestScore} />
          ) : (
            <Card className="rounded-3xl">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <Target className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No growth assessments recorded yet</p>
                <p className="text-xs text-muted-foreground">
                  Assessment scores will appear once evaluations are completed
                </p>
              </CardContent>
            </Card>
          )}

          {/* Charts Row */}
          {latestScore && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <GrowthRadarChart score={latestScore} />

              {/* Progress Over Time or placeholder */}
              {growthScores.length >= 2 ? (
                <ProgressOverTimeChart scores={growthScores} />
              ) : (
                <Card className="rounded-3xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-sky-600" />
                      Progress Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 space-y-2">
                      <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Not enough data yet</p>
                      <p className="text-xs text-muted-foreground">
                        Progress trends will appear after multiple assessments are completed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Achievements Section */}
          <AchievementsSection achievements={achievements} />

          {/* Milestones Section */}
          <MilestonesSection milestones={milestones} />
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
