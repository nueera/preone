'use client';

import React, { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CalendarDays,
  Clock,
  AlertTriangle,
  Plus,
  XCircle,
  CheckCircle2,
  Clock4,
  Ban,
  ChevronLeft,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// ── Types ──
interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  subject: string | null;
  classId: string | null;
}

interface ScheduleData {
  teacher: { id: string; firstName: string; lastName: string };
  schedule: ScheduleEntry[];
  todaySchedule: { id: string; startTime: string; endTime: string; subject: string | null }[];
  hasSchedule: boolean;
  weeklyGrid?: any[];
  workingDays?: number[];
  allTimeSlots?: string[];
}

interface LeaveRecord {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

interface LeaveBalanceItem {
  total: number;
  used: number;
  remaining: number;
  label: string;
}

interface LeavesData {
  leaves: LeaveRecord[];
  balance: Record<string, LeaveBalanceItem>;
  teacher: { id: string; name: string };
  summary: {
    totalLeaves: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
    cancelledCount: number;
    totalDaysUsed: number;
    totalDaysPending: number;
  };
}

// ── Subject Color Config ──
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; emoji: string }> = {
  circle:    { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200',  emoji: '🎒' },
  morning:   { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200',  emoji: '🎒' },
  language:  { bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200',     emoji: '📚' },
  lang:      { bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200',     emoji: '📚' },
  literacy:  { bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200',     emoji: '📚' },
  math:      { bg: 'bg-purple-50',   text: 'text-purple-700',   border: 'border-purple-200',   emoji: '🧮' },
  art:       { bg: 'bg-pink-50',     text: 'text-pink-700',     border: 'border-pink-200',     emoji: '🎨' },
  music:     { bg: 'bg-indigo-50',   text: 'text-indigo-700',   border: 'border-indigo-200',   emoji: '🎵' },
  outdoor:   { bg: 'bg-green-50',    text: 'text-green-700',    border: 'border-green-200',    emoji: '🏃' },
  craft:     { bg: 'bg-yellow-50',   text: 'text-yellow-700',   border: 'border-yellow-200',   emoji: '🧶' },
  dance:     { bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-200',   emoji: '🎭' },
  story:     { bg: 'bg-teal-50',     text: 'text-teal-700',     border: 'border-teal-200',     emoji: '📖' },
  break:     { bg: 'bg-gray-50',     text: 'text-gray-600',     border: 'border-gray-200',     emoji: '🍎' },
  snack:     { bg: 'bg-gray-50',     text: 'text-gray-600',     border: 'border-gray-200',     emoji: '🍎' },
  lunch:     { bg: 'bg-gray-50',     text: 'text-gray-600',     border: 'border-gray-200',     emoji: '🍱' },
  nap:       { bg: 'bg-gray-50',     text: 'text-gray-600',     border: 'border-gray-200',     emoji: '😴' },
  free:      { bg: 'bg-slate-50',    text: 'text-slate-600',    border: 'border-slate-200',    emoji: '🧩' },
  end:       { bg: 'bg-slate-50',    text: 'text-slate-600',    border: 'border-slate-200',    emoji: '👋' },
};

function getSubjectConfig(subject: string | null): { bg: string; text: string; border: string; emoji: string } {
  if (!subject) return { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-100', emoji: '' };
  const lower = subject.toLowerCase();
  for (const [key, config] of Object.entries(SUBJECT_COLORS)) {
    if (lower.includes(key)) return config;
  }
  return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', emoji: '📘' };
}

// ── Leave Config ──
const LEAVE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CASUAL:      { label: 'Casual Leave',   color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-300' },
  SICK:        { label: 'Sick Leave',     color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-300' },
  EARNED:      { label: 'Earned Leave',   color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300' },
  MATERNITY:   { label: 'Maternity Leave', color: 'text-pink-700',  bg: 'bg-pink-100',    border: 'border-pink-300' },
  PATERNITY:   { label: 'Paternity Leave', color: 'text-purple-700', bg: 'bg-purple-100',  border: 'border-purple-300' },
  WITHOUT_PAY: { label: 'Without Pay',    color: 'text-gray-700',    bg: 'bg-gray-100',    border: 'border-gray-300' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  PENDING:   { label: 'Pending',   color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock4 },
  APPROVED:  { label: 'Approved',  color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  REJECTED:  { label: 'Rejected',  color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-600', bg: 'bg-gray-100', icon: Ban },
};

const BALANCE_COLORS: Record<string, { bar: string; bg: string; text: string; accent: string }> = {
  casual:  { bar: 'bg-blue-500',  bg: 'bg-blue-50',  text: 'text-blue-700',  accent: 'text-blue-600' },
  sick:    { bar: 'bg-red-500',   bg: 'bg-red-50',   text: 'text-red-700',   accent: 'text-red-600' },
  earned:  { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', accent: 'text-emerald-600' },
};

// ── Helpers ──
function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * ScheduleContent — Inner component
 */
function ScheduleContent() {
  const router = useRouter();

  // ── State ──
  const [activeTab, setActiveTab] = useState('schedule');

  // Schedule state
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);

  // Leaves state
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leavesError, setLeavesError] = useState<string | null>(null);
  const [leavesData, setLeavesData] = useState<LeavesData | null>(null);

  // Apply leave dialog
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    contactDuringLeave: '',
  });
  const [applying, setApplying] = useState(false);

  // Cancel leave dialog
  const [cancelTarget, setCancelTarget] = useState<LeaveRecord | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // ── Fetch schedule ──
  const fetchSchedule = useCallback(async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) { router.push('/login'); return; }

    try {
      setScheduleLoading(true);
      setScheduleError(null);

      const res = await fetch('/api/teacher/schedule', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load schedule');
      const json = await res.json();
      setScheduleData(json);
    } catch (err: any) {
      setScheduleError(err.message || 'Something went wrong');
    } finally {
      setScheduleLoading(false);
    }
  }, [router]);

  // ── Fetch leaves ──
  const fetchLeaves = useCallback(async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setLeavesLoading(true);
      setLeavesError(null);

      const res = await fetch('/api/teacher/leaves', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load leaves');
      const json = await res.json();
      setLeavesData(json);
    } catch (err: any) {
      setLeavesError(err.message || 'Something went wrong');
    } finally {
      setLeavesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Load leaves when tab switches
  useEffect(() => {
    if (activeTab === 'leaves' && !leavesData) {
      fetchLeaves();
    }
  }, [activeTab, leavesData, fetchLeaves]);

  // ── Apply leave ──
  const handleApplyLeave = async () => {
    if (!applyForm.leaveType || !applyForm.startDate || !applyForm.endDate || applyForm.reason.trim().length < 10) {
      toast.error('Please fill in all required fields');
      return;
    }

    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    if (end < start) {
      toast.error('End date must be on or after start date');
      return;
    }

    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setApplying(true);
      const res = await fetch('/api/teacher/leaves', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applyForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to apply');
      }

      toast.success('Leave application submitted');
      setShowApplyDialog(false);
      setApplyForm({ leaveType: '', startDate: '', endDate: '', reason: '', contactDuringLeave: '' });
      await fetchLeaves();
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply for leave');
    } finally {
      setApplying(false);
    }
  };

  // ── Cancel leave ──
  const handleCancelLeave = async () => {
    if (!cancelTarget) return;
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setCancelling(true);
      const res = await fetch(`/api/teacher/leaves/${cancelTarget.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to cancel');
      }

      toast.success('Leave request cancelled');
      setCancelTarget(null);
      await fetchLeaves();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel leave');
    } finally {
      setCancelling(false);
    }
  };

  // ── Computed: schedule grid ──
  const scheduleGrid = useMemo(() => {
    if (!scheduleData?.schedule || scheduleData.schedule.length === 0) return null;

    // Group by day
    const byDay: Record<number, ScheduleEntry[]> = {};
    for (const entry of scheduleData.schedule) {
      if (!byDay[entry.dayOfWeek]) byDay[entry.dayOfWeek] = [];
      byDay[entry.dayOfWeek].push(entry);
    }

    // Get all unique time slots across all days, sorted
    const allStartTimes = [...new Set(scheduleData.schedule.map((s) => s.startTime))].sort();

    // Get all working days (1=Mon through 6=Sat, skip 0=Sun typically)
    const workingDays = Object.keys(byDay).map(Number).sort((a, b) => a - b);

    return { byDay, allStartTimes, workingDays };
  }, [scheduleData]);

  // ── Computed: apply leave days count ──
  const appliedDays = useMemo(() => {
    if (!applyForm.startDate || !applyForm.endDate) return 0;
    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    if (end < start) return 0;
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }, [applyForm.startDate, applyForm.endDate]);

  // ── Computed: leave balance warning ──
  const balanceWarning = useMemo(() => {
    if (!leavesData || !applyForm.leaveType || appliedDays === 0) return null;
    const balKey = applyForm.leaveType.toLowerCase();
    const bal = leavesData.balance[balKey];
    if (!bal) return null;
    if (bal.total === 0) return `This leave will be without pay.`;
    if (appliedDays > bal.remaining) {
      return `You only have ${bal.remaining} day${bal.remaining !== 1 ? 's' : ''} remaining. This leave will be without pay for ${appliedDays - bal.remaining} extra day${appliedDays - bal.remaining > 1 ? 's' : ''}.`;
    }
    return `This will use ${appliedDays} day${appliedDays > 1 ? 's' : ''} from your ${bal.label} balance (${bal.remaining} remaining).`;
  }, [leavesData, applyForm.leaveType, appliedDays]);

  // ── Loading ──
  if (scheduleLoading && !scheduleData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (scheduleError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Schedule</h3>
        <p className="text-gray-500 mb-4">{scheduleError}</p>
        <Button onClick={fetchSchedule} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">Retry</Button>
      </div>
    );
  }

  const today = new Date().getDay();

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Schedule & Leave
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {scheduleData?.teacher ? `${scheduleData.teacher.firstName} ${scheduleData.teacher.lastName}` : 'Teacher'}
              </p>
            </div>
            {activeTab === 'leaves' && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm"
                onClick={() => setShowApplyDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Apply Leave
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Main Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 rounded-xl">
          <TabsTrigger value="schedule" className="rounded-lg text-xs">
            <CalendarDays className="h-3.5 w-3.5 mr-1" /> Weekly Schedule
          </TabsTrigger>
          <TabsTrigger value="leaves" className="rounded-lg text-xs">
            <Clock className="h-3.5 w-3.5 mr-1" /> My Leaves
          </TabsTrigger>
        </TabsList>

        {/* ────────────────────────────────────────────────────────────
            WEEKLY SCHEDULE TAB
        ──────────────────────────────────────────────────────────── */}
        <TabsContent value="schedule" className="mt-4">
          {!scheduleData?.hasSchedule ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-16 text-center">
                <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schedule Set</h3>
                <p className="text-sm text-gray-500 mb-4">
                  No weekly schedule has been configured yet. Contact admin to set your weekly schedule.
                </p>
              </CardContent>
            </Card>
          ) : scheduleGrid ? (
            <Card className="border-0 shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="sticky left-0 bg-gray-50 z-10 py-2.5 px-3 text-left font-medium text-gray-500 w-[60px] border-b border-r border-gray-200">
                          Time
                        </th>
                        {scheduleGrid.workingDays.map((day) => (
                          <th
                            key={day}
                            className={`py-2.5 px-2 text-center font-medium border-b border-gray-200 min-w-[90px] ${
                              day === today ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500'
                            }`}
                          >
                            <div>{DAY_SHORT[day]}</div>
                            {day === today && (
                              <div className="text-[9px] font-normal text-emerald-500">Today</div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleGrid.allStartTimes.map((time, rowIdx) => {
                        const isCurrentTimeRow = (() => {
                          const now = new Date();
                          const [h, m] = time.split(':').map(Number);
                          const currentMinutes = now.getHours() * 60 + now.getMinutes();
                          const slotMinutes = h * 60 + m;
                          const nextSlot = scheduleGrid.allStartTimes[rowIdx + 1];
                          const nextMinutes = nextSlot
                            ? nextSlot.split(':').map(Number).reduce((a, b, i) => i === 0 ? b * 60 : a + b, 0)
                            : slotMinutes + 30;
                          return currentMinutes >= slotMinutes && currentMinutes < nextMinutes;
                        })();

                        return (
                          <tr
                            key={time}
                            className={`${
                              isCurrentTimeRow ? 'bg-emerald-50/50' : ''
                            } hover:bg-gray-50/50`}
                          >
                            <td
                              className={`sticky left-0 z-10 py-1.5 px-3 text-[10px] font-mono text-gray-500 border-r border-b border-gray-100 bg-white ${
                                isCurrentTimeRow ? 'bg-emerald-50' : ''
                              }`}
                            >
                              {time}
                              {isCurrentTimeRow && (
                                <div className="absolute left-0 w-full h-0.5 bg-emerald-500 -ml-3 mt-1" />
                              )}
                            </td>
                            {scheduleGrid.workingDays.map((day) => {
                              const entry = scheduleGrid.byDay[day]?.find((e) => e.startTime === time);
                              const config = getSubjectConfig(entry?.subject || null);

                              if (!entry || !entry.subject) {
                                return (
                                  <td
                                    key={`${day}-${time}`}
                                    className="py-1.5 px-1.5 border-b border-gray-50"
                                  >
                                    <div className="h-10" />
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={`${day}-${time}`}
                                  className={`py-1 px-1.5 border-b border-gray-50 ${
                                    day === today ? 'bg-emerald-50/30' : ''
                                  }`}
                                >
                                  <div
                                    className={`${config.bg} ${config.border} border rounded-lg px-2 py-1.5 text-center transition-all hover:shadow-sm`}
                                  >
                                    <div className={`${config.text} font-medium text-[11px] leading-tight`}>
                                      {config.emoji} {entry.subject}
                                    </div>
                                    <div className="text-[9px] text-gray-400 mt-0.5">
                                      {entry.startTime} - {entry.endTime}
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Today's Schedule Summary */}
          {scheduleData?.todaySchedule && scheduleData.todaySchedule.length > 0 && (
            <Card className="border-0 shadow-md mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Today&apos;s Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {scheduleData.todaySchedule.map((item, i) => {
                    const config = getSubjectConfig(item.subject);
                    return (
                      <div
                        key={i}
                        className={`${config.bg} ${config.border} border rounded-lg px-3 py-2 flex items-center gap-2`}
                      >
                        <span className="text-sm">{config.emoji}</span>
                        <div>
                          <div className={`${config.text} text-xs font-medium`}>{item.subject}</div>
                          <div className="text-[10px] text-gray-400">{item.startTime} - {item.endTime}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            MY LEAVES TAB
        ──────────────────────────────────────────────────────────── */}
        <TabsContent value="leaves" className="space-y-6 mt-4">
          {leavesLoading && !leavesData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          ) : leavesError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Leaves</h3>
              <p className="text-gray-500 mb-4">{leavesError}</p>
              <Button onClick={fetchLeaves} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">Retry</Button>
            </div>
          ) : leavesData ? (
            <>
              {/* Leave Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['casual', 'sick', 'earned'] as const).map((type) => {
                  const bal = leavesData.balance[type];
                  if (!bal) return null;
                  const colors = BALANCE_COLORS[type];
                  const percentage = bal.total > 0 ? Math.round((bal.remaining / bal.total) * 100) : 0;

                  return (
                    <Card key={type} className={`border-0 shadow-md ${colors.bg}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`text-sm font-semibold ${colors.text}`}>
                            {bal.label}
                          </div>
                          <Badge className={`${colors.bg} ${colors.text} border-0 text-xs`}>
                            {bal.remaining} left
                          </Badge>
                        </div>
                        <div className={`text-2xl font-bold ${colors.accent} mb-1`}>
                          {bal.remaining} <span className="text-sm font-normal text-gray-500">/ {bal.total}</span>
                        </div>
                        <Progress
                          value={percentage}
                          className={`h-2 ${colors.bg}`}
                        />
                        <div className="text-[10px] text-gray-500 mt-1.5">
                          {bal.used} day{bal.used !== 1 ? 's' : ''} used this year
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Applied Leaves Table */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      Leave History
                    </CardTitle>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs h-8"
                      onClick={() => setShowApplyDialog(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Apply Leave
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {leavesData.leaves.length === 0 ? (
                    <div className="py-12 text-center">
                      <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No Leave History</h3>
                      <p className="text-xs text-gray-500 mb-4">You haven&apos;t applied for any leaves yet</p>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs"
                        onClick={() => setShowApplyDialog(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Apply Leave
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2.5 px-3 font-medium text-gray-600">Type</th>
                            <th className="text-left py-2.5 px-3 font-medium text-gray-600">From</th>
                            <th className="text-left py-2.5 px-3 font-medium text-gray-600">To</th>
                            <th className="text-center py-2.5 px-3 font-medium text-gray-600">Days</th>
                            <th className="text-left py-2.5 px-3 font-medium text-gray-600">Reason</th>
                            <th className="text-center py-2.5 px-3 font-medium text-gray-600">Status</th>
                            <th className="text-center py-2.5 px-3 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leavesData.leaves.map((leave) => {
                            const typeConfig = LEAVE_TYPE_CONFIG[leave.leaveType] || LEAVE_TYPE_CONFIG.WITHOUT_PAY;
                            const statusConfig = STATUS_CONFIG[leave.status];
                            const StatusIcon = statusConfig.icon;

                            return (
                              <tr key={leave.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="py-2.5 px-3">
                                  <Badge className={`${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} border text-[10px] px-2 py-0.5`}>
                                    {typeConfig.label}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-gray-700">{formatShortDate(leave.startDate)}</td>
                                <td className="py-2.5 px-3 text-gray-700">{formatShortDate(leave.endDate)}</td>
                                <td className="py-2.5 px-3 text-center font-semibold text-gray-700">{leave.days}</td>
                                <td className="py-2.5 px-3 text-gray-600 max-w-[200px] truncate">{leave.reason}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0 text-[10px] px-2 py-0.5`}>
                                    <StatusIcon className="h-3 w-3 mr-0.5 inline" />
                                    {statusConfig.label}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {leave.status === 'PENDING' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-[10px] h-7 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                                      onClick={() => setCancelTarget(leave)}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Summary */}
                  {leavesData.leaves.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Total: <strong className="text-gray-700">{leavesData.summary.totalLeaves}</strong></span>
                      <span>Approved: <strong className="text-emerald-600">{leavesData.summary.approvedCount}</strong></span>
                      <span>Pending: <strong className="text-amber-600">{leavesData.summary.pendingCount}</strong></span>
                      <span>Rejected: <strong className="text-red-600">{leavesData.summary.rejectedCount}</strong></span>
                      <span>Days Used: <strong className="text-gray-700">{leavesData.summary.totalDaysUsed}</strong></span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* ────────────────────────────────────────────────────────────
          APPLY LEAVE DIALOG
      ──────────────────────────────────────────────────────────── */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Apply for Leave
            </DialogTitle>
            <DialogDescription>
              Submit a leave request for approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Leave Type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Leave Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={applyForm.leaveType}
                onValueChange={(v) => setApplyForm((prev) => ({ ...prev, leaveType: v }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select leave type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAVE_TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={applyForm.startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setApplyForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={applyForm.endDate}
                  min={applyForm.startDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setApplyForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Days Count */}
            {appliedDays > 0 && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-700">
                  <strong>{appliedDays}</strong> day{appliedDays > 1 ? 's' : ''} of leave
                </div>
                {balanceWarning && (
                  <div className={`text-xs mt-1 ${balanceWarning.includes('without pay') ? 'text-amber-600' : 'text-gray-500'}`}>
                    {balanceWarning.includes('without pay') && '⚠️ '}{balanceWarning}
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={applyForm.reason}
                onChange={(e) => setApplyForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Describe the reason for your leave (minimum 10 characters)..."
                className="min-h-[80px] rounded-xl text-sm resize-none"
              />
              <p className="text-[10px] text-gray-400 text-right">
                {applyForm.reason.length} characters (minimum 10)
              </p>
            </div>

            {/* Contact During Leave */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Contact During Leave</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="tel"
                  value={applyForm.contactDuringLeave}
                  onChange={(e) => setApplyForm((prev) => ({ ...prev, contactDuringLeave: e.target.value }))}
                  placeholder="Emergency contact number during leave"
                  className="pl-8 rounded-xl text-xs"
                />
              </div>
              <p className="text-[10px] text-gray-400">Optional — for emergency contact during your leave</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowApplyDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              onClick={handleApplyLeave}
              disabled={applying || !applyForm.leaveType || !applyForm.startDate || !applyForm.endDate || applyForm.reason.trim().length < 10}
            >
              {applying ? 'Submitting...' : 'Submit Leave Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────
          CANCEL LEAVE CONFIRMATION
      ──────────────────────────────────────────────────────────── */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              Cancel Leave Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave request?
            </DialogDescription>
          </DialogHeader>

          {cancelTarget && (
            <div className="p-3 bg-red-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium">{LEAVE_TYPE_CONFIG[cancelTarget.leaveType]?.label || cancelTarget.leaveType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium">{formatShortDate(cancelTarget.startDate)} — {formatShortDate(cancelTarget.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Days</span>
                <span className="font-medium">{cancelTarget.days}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setCancelTarget(null)}
            >
              Keep Request
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleCancelLeave}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page export with Suspense boundary ──
export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <ScheduleContent />
    </Suspense>
  );
}
