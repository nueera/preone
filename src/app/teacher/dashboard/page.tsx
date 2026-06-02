'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCheck, CalendarDays, Eye, Calendar, Clock, CheckCircle2,
  Sun, Activity, TrendingUp, Palette, CheckSquare, MessageSquare,
  ArrowRight, Loader2, RefreshCw, Zap,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { PORTAL_THEMES, ACTIVITY_COLORS, ATTENDANCE_COLORS, CHART_PALETTE } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.teacher;

// ============================================================
// TYPES
// ============================================================
interface TeacherData {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  specialization: string | null;
}

interface AssignedClass {
  id: string;
  name: string;
  capacity: number;
  roomNo: string | null;
  program: { id: string; name: string };
  branch: { id: string; name: string };
  studentCount: number;
}

interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  subject: string;
  type: string;
}

interface ActivityItem {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
}

interface DashboardData {
  teacher: TeacherData;
  assignedClass: AssignedClass | null;
  stats: {
    presentToday: number;
    totalStudents: number;
    activitiesToday: number;
    pendingObservations: number;
    leavesRemaining: Record<string, number>;
  };
  todaySchedule: ScheduleItem[];
  attendance: {
    marked: boolean;
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  recentActivities: ActivityItem[];
  pendingItems: {
    dailyUpdatesPending: number;
    observationsToShare: number;
    leavesPending: number;
  };
}

// ============================================================
// HELPERS
// ============================================================
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

const ACTIVITY_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  ART: { label: 'Art', color: `${ACTIVITY_COLORS.ART?.bg || 'bg-pink-100'} ${ACTIVITY_COLORS.ART?.text || 'text-pink-700'}` },
  MUSIC: { label: 'Music', color: `${ACTIVITY_COLORS.MUSIC?.bg || 'bg-purple-100'} ${ACTIVITY_COLORS.MUSIC?.text || 'text-purple-700'}` },
  DANCE: { label: 'Dance', color: `${ACTIVITY_COLORS.DANCE?.bg || 'bg-orange-100'} ${ACTIVITY_COLORS.DANCE?.text || 'text-orange-700'}` },
  SPORTS: { label: 'Sports', color: `${ACTIVITY_COLORS.SPORTS?.bg || 'bg-green-100'} ${ACTIVITY_COLORS.SPORTS?.text || 'text-green-700'}` },
  ACADEMIC: { label: 'Academic', color: `${ACTIVITY_COLORS.OTHER?.bg || 'bg-blue-100'} ${ACTIVITY_COLORS.OTHER?.text || 'text-blue-700'}` },
  OUTDOOR: { label: 'Outdoor', color: `${ACTIVITY_COLORS.OUTDOOR?.bg || 'bg-teal-100'} ${ACTIVITY_COLORS.OUTDOOR?.text || 'text-teal-700'}` },
  INDOOR: { label: 'Indoor', color: `${ACTIVITY_COLORS.INDOOR?.bg || 'bg-indigo-100'} ${ACTIVITY_COLORS.INDOOR?.text || 'text-indigo-700'}` },
  CRAFT: { label: 'Craft', color: `${ACTIVITY_COLORS.CRAFT?.bg || 'bg-yellow-100'} ${ACTIVITY_COLORS.CRAFT?.text || 'text-yellow-700'}` },
  SCHEDULE: { label: 'Schedule', color: `${theme.selectedClass}` },
};

const SCHEDULE_ICONS: Record<string, string> = {
  'Morning Circle': '🎒',
  'Language': '📚',
  'Literacy': '📚',
  'Snack': '🍎',
  'Art': '🎨',
  'Craft': '🎨',
  'Outdoor': '🏃',
  'Play': '🧩',
  'Music': '🎵',
  'Movement': '🎵',
  'Lunch': '🍱',
  'Nap': '😴',
  'Story': '📖',
  'Dispersal': '👋',
  'General': '📋',
};

function getScheduleIcon(subject: string): string {
  for (const [key, icon] of Object.entries(SCHEDULE_ICONS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '📋';
}

function isCurrentTimeSlot(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function isPastTimeSlot(endTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [eh, em] = endTime.split(':').map(Number);
  const endMinutes = eh * 60 + em;
  return currentMinutes > endMinutes;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TeacherDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch('/api/teacher/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
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
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Loading state ──
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
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
        <p className="text-red-500 text-sm">{error}</p>
        <Button onClick={fetchDashboard} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { teacher, assignedClass, stats, todaySchedule, attendance, recentActivities, pendingItems } = data;
  const greeting = getGreeting();
  const attendanceRate = attendance.total > 0
    ? Math.round((attendance.present / attendance.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* ── Welcome Section ── */}
      <Card className={`rounded-3xl border-0 bg-gradient-to-r ${theme.btnGradientClass} text-white shadow-lg`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {greeting}, {teacher.firstName}! 👋
              </h1>
              <p className="text-white/80 mt-1">
                {assignedClass
                  ? `Class: ${assignedClass.name} | ${assignedClass.studentCount} Students | ${assignedClass.program.name}`
                  : 'No class assigned yet'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Present Today',
            value: stats.presentToday,
            total: stats.totalStudents,
            icon: UserCheck,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
          },
          {
            label: 'Activities Today',
            value: stats.activitiesToday,
            total: null,
            icon: CalendarDays,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
          },
          {
            label: 'Pending Observations',
            value: stats.pendingObservations,
            total: null,
            icon: Eye,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
          },
          {
            label: 'Leaves Remaining',
            value: Object.values(stats.leavesRemaining || {}).reduce((a: number, b: number) => a + b, 0),
            total: null,
            icon: Calendar,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
          },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-3xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight">
                {stat.value}
                {stat.total !== null && (
                  <span className="text-sm font-normal text-muted-foreground">/{stat.total}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Schedule + Attendance Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-portal-600" />
                Today&apos;s Schedule
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {todaySchedule.length} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {todaySchedule.length > 0 ? (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {todaySchedule.map((item, idx) => {
                  const isCurrent = isCurrentTimeSlot(item.startTime, item.endTime);
                  const isPast = isPastTimeSlot(item.endTime);
                  return (
                    <div
                      key={item.id || idx}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                        isCurrent
                          ? `${theme.selectedClass} border border-emerald-200 shadow-sm`
                          : isPast
                          ? 'opacity-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg shrink-0">{getScheduleIcon(item.subject)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-portal-700' : ''}`}>
                          {item.subject}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatTime(item.startTime)} — {formatTime(item.endTime)}
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge className="bg-portal-600 text-white text-[9px] shrink-0">Now</Badge>
                      )}
                      {ACTIVITY_TYPE_CONFIG[item.type] && item.type !== 'SCHEDULE' && (
                        <Badge variant="outline" className={`text-[9px] shrink-0 ${ACTIVITY_TYPE_CONFIG[item.type]?.color}`}>
                          {ACTIVITY_TYPE_CONFIG[item.type]?.label}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No schedule for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Quick View */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-portal-600" />
                Attendance Quick View
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {attendance.marked ? (
              <div className="space-y-4">
                {/* Circle visualization */}
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke={CHART_PALETTE.gridLight} strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="50" fill="none" stroke={ATTENDANCE_COLORS.PRESENT.hex} strokeWidth="10"
                        strokeDasharray={`${(attendance.present / Math.max(attendance.total, 1)) * 314} 314`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{attendanceRate}%</span>
                      <span className="text-[10px] text-muted-foreground">Present</span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`text-center p-2 ${ATTENDANCE_COLORS.PRESENT.bg} rounded-xl`}>
                    <p className={`text-lg font-bold ${ATTENDANCE_COLORS.PRESENT.text}`}>{attendance.present}</p>
                    <p className="text-[10px] text-emerald-700">Present</p>
                  </div>
                  <div className={`text-center p-2 ${ATTENDANCE_COLORS.ABSENT.bg} rounded-xl`}>
                    <p className={`text-lg font-bold ${ATTENDANCE_COLORS.ABSENT.text}`}>{attendance.absent}</p>
                    <p className="text-[10px] text-red-700">Absent</p>
                  </div>
                  <div className={`text-center p-2 ${ATTENDANCE_COLORS.LATE.bg} rounded-xl`}>
                    <p className={`text-lg font-bold ${ATTENDANCE_COLORS.LATE.text}`}>{attendance.late}</p>
                    <p className="text-[10px] text-amber-700">Late</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-portal-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Attendance marked today</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                  <CheckSquare className="h-8 w-8 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground">Attendance not yet marked</p>
                <Button
                  onClick={() => router.push('/teacher/attendance')}
                  className={`bg-gradient-to-r ${theme.btnGradientClass} text-white rounded-xl hover:${theme.btnGradientHoverClass}`}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Mark Attendance Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Activities Feed ── */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-portal-600" />
              Recent Activities
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-portal-600 hover:text-portal-700 rounded-xl"
              onClick={() => router.push('/teacher/activities')}
            >
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-2">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString('en-IN', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] shrink-0 ${ACTIVITY_TYPE_CONFIG[activity.type]?.color || 'bg-gray-100 text-gray-700'}`}
                  >
                    {ACTIVITY_TYPE_CONFIG[activity.type]?.label || activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Mark Attendance', icon: CheckSquare, href: '/teacher/attendance', color: `${theme.btnGradientClass}` },
          { label: 'Daily Update', icon: Sun, href: '/teacher/daily-updates', color: `from-amber-500 to-orange-500` },
          { label: 'Add Observation', icon: Eye, href: '/teacher/observations', color: `from-blue-500 to-indigo-500` },
          { label: 'Create Activity', icon: Palette, href: '/teacher/activities', color: `from-pink-500 to-rose-500` },
          { label: 'Update Growth', icon: TrendingUp, href: '/teacher/growth', color: `from-violet-500 to-purple-500` },
          { label: 'Apply Leave', icon: Calendar, href: '/teacher/schedule', color: `from-teal-500 to-cyan-500` },
        ].map((action) => (
          <Card
            key={action.label}
            className="rounded-3xl cursor-pointer hover:shadow-md transition-all group"
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

      {/* ── Pending Items Alert ── */}
      {(pendingItems.dailyUpdatesPending > 0 || pendingItems.observationsToShare > 0 || pendingItems.leavesPending > 0) && (
        <Card className="rounded-3xl border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-800 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Pending Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {pendingItems.dailyUpdatesPending > 0 && (
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 cursor-pointer hover:bg-amber-100" onClick={() => router.push('/teacher/daily-updates')}>
                  {pendingItems.dailyUpdatesPending} Daily Updates Pending
                </Badge>
              )}
              {pendingItems.observationsToShare > 0 && (
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 cursor-pointer hover:bg-blue-100" onClick={() => router.push('/teacher/observations')}>
                  {pendingItems.observationsToShare} Observations to Share
                </Badge>
              )}
              {pendingItems.leavesPending > 0 && (
                <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 cursor-pointer hover:bg-purple-100" onClick={() => router.push('/teacher/schedule')}>
                  {pendingItems.leavesPending} Leaves Pending Approval
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
