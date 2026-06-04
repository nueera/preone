'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCheck, CalendarDays, Eye, Calendar, Clock, CheckCircle2,
  Sun, Activity, TrendingUp, Palette, CheckSquare, MessageSquare,
  ArrowRight, Loader2, RefreshCw, Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PreOneCard } from '@/components/ui/preone-card';
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/page-transition';
import { AiCompanion } from '@/components/cosmic/AiCompanion';
import { getTimeOfDay, TIME_THEME_CONFIG } from '@/lib/theme/cosmic-theme';
import { ACTIVITY_COLORS, ATTENDANCE_COLORS, CHART_PALETTE } from '@/lib/theme-tokens';

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
  const timeOfDay = getTimeOfDay();
  return TIME_THEME_CONFIG[timeOfDay].greeting;
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
  INDOOR: { label: 'Indoor', color: 'bg-sky-100 text-sky-700' },
  CRAFT: { label: 'Craft', color: `${ACTIVITY_COLORS.CRAFT?.bg || 'bg-yellow-100'} ${ACTIVITY_COLORS.CRAFT?.text || 'text-yellow-700'}` },
  SCHEDULE: { label: 'Schedule', color: 'bg-emerald-50 text-emerald-700' },
};

const SCHEDULE_ICONS: Record<string, string> = {
  'Morning Circle': '\uD83C\uDF92',
  'Language': '\uD83D\uDCDA',
  'Literacy': '\uD83D\uDCDA',
  'Snack': '\uD83C\uDF4E',
  'Art': '\uD83C\uDFA8',
  'Craft': '\uD83C\uDFA8',
  'Outdoor': '\uD83C\uDFC3',
  'Play': '\uD83E\uDDE9',
  'Music': '\uD83C\uDFB5',
  'Movement': '\uD83C\uDFB5',
  'Lunch': '\uD83C\uDF71',
  'Nap': '\uD83D\uDE34',
  'Story': '\uD83D\uDCD6',
  'Dispersal': '\uD83D\uDC4B',
  'General': '\uD83D\uDCCB',
};

function getScheduleIcon(subject: string): string {
  for (const [key, icon] of Object.entries(SCHEDULE_ICONS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '\uD83D\uDCCB';
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
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 rounded-3xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-3xl" />
          </div>
        </div>
      </PageTransition>
    );
  }

  // ── Error state ──
  if (error && !data) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-sm" style={{ color: 'var(--preone-coral)' }}>{error}</p>
          <button onClick={fetchDashboard} className="preone-btn-secondary inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </PageTransition>
    );
  }

  if (!data) return null;

  const { teacher, assignedClass, stats, todaySchedule, attendance, recentActivities, pendingItems } = data;
  const greeting = getGreeting();
  const timeOfDay = getTimeOfDay();
  const timeConfig = TIME_THEME_CONFIG[timeOfDay];
  const attendanceRate = attendance.total > 0
    ? Math.round((attendance.present / attendance.total) * 100)
    : 0;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* ── Welcome Hero Section ── */}
        <StaggerItem>
          <PreOneCard variant="hero">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {timeConfig.icon} {greeting}, {teacher.firstName}!
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

            {/* Quick action buttons inside hero */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => router.push('/teacher/attendance')}
                className="preone-btn-primary inline-flex items-center gap-2 text-sm py-2 px-4"
              >
                <CheckSquare className="h-4 w-4" />
                Mark Attendance
              </button>
              <button
                onClick={() => router.push('/teacher/daily-updates')}
                className="preone-btn-secondary inline-flex items-center gap-2 text-sm py-2 px-4 !border-white/30 !text-white hover:!bg-white/10"
              >
                <Sun className="h-4 w-4" />
                Daily Update
              </button>
              <button
                onClick={() => router.push('/teacher/observations')}
                className="preone-btn-ghost inline-flex items-center gap-2 text-sm py-2 px-4 !text-white/80 hover:!text-white hover:!bg-white/10"
              >
                <Eye className="h-4 w-4" />
                Add Observation
              </button>
            </div>
          </PreOneCard>
        </StaggerItem>

        {/* ── Quick Stats Row ── */}
        <StaggerItem>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Present Today',
                value: stats.presentToday,
                total: stats.totalStudents,
                icon: UserCheck,
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                label: 'Activities Today',
                value: stats.activitiesToday,
                total: null,
                icon: CalendarDays,
                iconBg: 'bg-sky-100 dark:bg-sky-900/30',
                iconColor: 'text-sky-600 dark:text-sky-400',
              },
              {
                label: 'Pending Observations',
                value: stats.pendingObservations,
                total: null,
                icon: Eye,
                iconBg: 'bg-orange-100 dark:bg-orange-900/30',
                iconColor: 'text-orange-600 dark:text-orange-400',
              },
              {
                label: 'Leaves Remaining',
                value: Object.values(stats.leavesRemaining || {}).reduce((a: number, b: number) => a + b, 0),
                total: null,
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
              },
            ].map((stat) => (
              <PreOneCard key={stat.label} variant="default" hover>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${stat.iconBg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {stat.value}
                  {stat.total !== null && (
                    <span className="text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>/ {stat.total}</span>
                  )}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
              </PreOneCard>
            ))}
          </div>
        </StaggerItem>

        {/* ── Schedule + Attendance + AI Companion Row ── */}
        <StaggerItem>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Today's Schedule — 2/3 width */}
            <PreOneCard variant="strip" className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Clock className="h-4 w-4" style={{ color: 'var(--preone-blue)' }} />
                  Today&apos;s Schedule
                </h3>
                <Badge variant="outline" className="text-[10px]">
                  {todaySchedule.length} items
                </Badge>
              </div>
              {todaySchedule.length > 0 ? (
                <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                  {todaySchedule.map((item, idx) => {
                    const isCurrent = isCurrentTimeSlot(item.startTime, item.endTime);
                    const isPast = isPastTimeSlot(item.endTime);
                    return (
                      <div
                        key={item.id || idx}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                          isCurrent
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 shadow-sm'
                            : isPast
                            ? 'opacity-50'
                            : 'hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <span className="text-lg shrink-0">{getScheduleIcon(item.subject)}</span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
                            style={!isCurrent ? { color: 'var(--text-primary)' } : undefined}
                          >
                            {item.subject}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {formatTime(item.startTime)} — {formatTime(item.endTime)}
                          </p>
                        </div>
                        {isCurrent && (
                          <Badge className="text-[9px] shrink-0 text-white" style={{ background: 'var(--preone-primary)' }}>Now</Badge>
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
                  <Clock className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No schedule for today</p>
                </div>
              )}
            </PreOneCard>

            {/* Right sidebar: Attendance + AI Companion — 1/3 width */}
            <div className="space-y-4">
              {/* Attendance Quick View */}
              <PreOneCard variant="default">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <CheckSquare className="h-4 w-4" style={{ color: 'var(--preone-blue)' }} />
                    Attendance
                  </h3>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {attendance.marked ? (
                  <div className="space-y-4">
                    {/* Circle visualization */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-28 h-28">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke={CHART_PALETTE.gridLight} strokeWidth="10" />
                          <circle
                            cx="60" cy="60" r="50" fill="none" stroke={ATTENDANCE_COLORS.PRESENT.hex} strokeWidth="10"
                            strokeDasharray={`${(attendance.present / Math.max(attendance.total, 1)) * 314} 314`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{attendanceRate}%</span>
                          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Present</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`text-center p-2 ${ATTENDANCE_COLORS.PRESENT.bg} rounded-xl`}>
                        <p className={`text-lg font-bold ${ATTENDANCE_COLORS.PRESENT.text}`}>{attendance.present}</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Present</p>
                      </div>
                      <div className={`text-center p-2 ${ATTENDANCE_COLORS.ABSENT.bg} rounded-xl`}>
                        <p className={`text-lg font-bold ${ATTENDANCE_COLORS.ABSENT.text}`}>{attendance.absent}</p>
                        <p className="text-[10px] text-red-700 dark:text-red-400">Absent</p>
                      </div>
                      <div className={`text-center p-2 ${ATTENDANCE_COLORS.LATE.bg} rounded-xl`}>
                        <p className={`text-lg font-bold ${ATTENDANCE_COLORS.LATE.text}`}>{attendance.late}</p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400">Late</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--preone-primary)' }}>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Attendance marked today</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                      style={{ background: 'var(--preone-orange)', opacity: 0.15 }}
                    >
                      <CheckSquare className="h-7 w-7" style={{ color: 'var(--preone-orange)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Attendance not yet marked</p>
                    <button
                      onClick={() => router.push('/teacher/attendance')}
                      className="preone-btn-primary inline-flex items-center gap-2 text-sm"
                    >
                      <Zap className="h-4 w-4" />
                      Mark Attendance Now
                    </button>
                  </div>
                )}
              </PreOneCard>

              {/* AI Companion */}
              <PreOneCard variant="glass" className="flex items-center justify-center py-6">
                <AiCompanion role="teacher" />
              </PreOneCard>
            </div>
          </div>
        </StaggerItem>

        {/* ── Student Constellation Grid (Quick Actions) ── */}
        <StaggerItem>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[
              { label: 'Mark Attendance', icon: CheckSquare, href: '/teacher/attendance', gradient: 'from-emerald-500 to-teal-500' },
              { label: 'Daily Update', icon: Sun, href: '/teacher/daily-updates', gradient: 'from-amber-500 to-orange-500' },
              { label: 'Add Observation', icon: Eye, href: '/teacher/observations', gradient: 'from-sky-500 to-blue-500' },
              { label: 'Create Activity', icon: Palette, href: '/teacher/activities', gradient: 'from-pink-500 to-rose-500' },
              { label: 'Update Growth', icon: TrendingUp, href: '/teacher/growth', gradient: 'from-violet-500 to-purple-500' },
              { label: 'Apply Leave', icon: Calendar, href: '/teacher/schedule', gradient: 'from-teal-500 to-cyan-500' },
            ].map((action) => (
              <PreOneCard
                key={action.label}
                variant="default"
                hover
                onClick={() => router.push(action.href)}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${action.gradient} shadow-sm`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                </div>
              </PreOneCard>
            ))}
          </div>
        </StaggerItem>

        {/* ── Recent Activities Feed + Pending Items ── */}
        <StaggerItem>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Activities — 2/3 width */}
            <PreOneCard variant="default" className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Activity className="h-4 w-4" style={{ color: 'var(--preone-primary)' }} />
                  Recent Activities
                </h3>
                <button
                  className="preone-btn-ghost inline-flex items-center gap-1 text-xs py-1 px-3"
                  onClick={() => router.push('/teacher/activities')}
                  style={{ color: 'var(--preone-primary)' }}
                >
                  View All <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              {recentActivities.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{activity.title}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {new Date(activity.date).toLocaleDateString('en-IN', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] shrink-0 ${ACTIVITY_TYPE_CONFIG[activity.type]?.color || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                      >
                        {ACTIVITY_TYPE_CONFIG[activity.type]?.label || activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>No recent activities</p>
              )}
            </PreOneCard>

            {/* Pending Items — 1/3 width */}
            {(pendingItems.dailyUpdatesPending > 0 || pendingItems.observationsToShare > 0 || pendingItems.leavesPending > 0) ? (
              <PreOneCard variant="achievement">
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--preone-orange)' }}>
                  <Zap className="h-4 w-4" />
                  Pending Items
                </h3>
                <div className="flex flex-col gap-2">
                  {pendingItems.dailyUpdatesPending > 0 && (
                    <button
                      className="preone-btn-ghost text-left text-xs w-full justify-start py-2"
                      onClick={() => router.push('/teacher/daily-updates')}
                      style={{ color: 'var(--preone-orange)' }}
                    >
                      <Badge variant="outline" className="text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30">
                        {pendingItems.dailyUpdatesPending} Daily Updates Pending
                      </Badge>
                    </button>
                  )}
                  {pendingItems.observationsToShare > 0 && (
                    <button
                      className="preone-btn-ghost text-left text-xs w-full justify-start py-2"
                      onClick={() => router.push('/teacher/observations')}
                    >
                      <Badge variant="outline" className="text-xs border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-400 cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-900/30">
                        {pendingItems.observationsToShare} Observations to Share
                      </Badge>
                    </button>
                  )}
                  {pendingItems.leavesPending > 0 && (
                    <button
                      className="preone-btn-ghost text-left text-xs w-full justify-start py-2"
                      onClick={() => router.push('/teacher/schedule')}
                    >
                      <Badge variant="outline" className="text-xs border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30">
                        {pendingItems.leavesPending} Leaves Pending Approval
                      </Badge>
                    </button>
                  )}
                </div>
              </PreOneCard>
            ) : (
              <PreOneCard variant="glass" className="flex items-center justify-center">
                <div className="text-center py-4">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>All caught up!</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>No pending items right now</p>
                </div>
              </PreOneCard>
            )}
          </div>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
