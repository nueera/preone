'use client';

// ============================================================
// PreOne — Parent Attendance Page
// Shows attendance history for the selected child:
// - Monthly stats cards (rate, present, absent, late)
// - Custom calendar view with color-coded days
// - Attendance trend line chart (last 6 months)
// - Expandable details table with CSV export
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, Clock, BarChart3,
  RefreshCw, AlertCircle, Download, ClipboardCheck,
  TrendingUp, Calendar as CalendarIcon,
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
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { useParentAuth } from '@/lib/parent-auth';
import {
  useParentAttendance,
  type AttendanceRecord,
} from '@/hooks/use-parent';

// ============================================================
// CONSTANTS
// ============================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================================
// HELPERS
// ============================================================

function getDayName(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' });
  } catch {
    return '';
  }
}

function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'PRESENT': return '✅';
    case 'ABSENT': return '❌';
    case 'LATE': return '⏰';
    default: return '•';
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'PRESENT': return 'bg-emerald-100 text-emerald-700';
    case 'ABSENT': return 'bg-red-100 text-red-700';
    case 'LATE': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-500';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PRESENT':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">✅ Present</Badge>;
    case 'ABSENT':
      return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">❌ Absent</Badge>;
    case 'LATE':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">⏰ Late</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function getRateColor(rate: number): string {
  if (rate >= 90) return 'text-emerald-600';
  if (rate >= 75) return 'text-amber-600';
  return 'text-red-600';
}

function getRateBg(rate: number): string {
  if (rate >= 90) return 'bg-emerald-50 border-emerald-200';
  if (rate >= 75) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

// ============================================================
// MONTH STATS CARDS
// ============================================================

function StatsCards({ stats }: { stats: { present: number; absent: number; late: number; workingDays: number; rate: number } }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Rate Card */}
      <Card className={`rounded-3xl border ${getRateBg(stats.rate)}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className={`h-5 w-5 ${getRateColor(stats.rate)}`} />
            <span className={`text-2xl font-bold ${getRateColor(stats.rate)}`}>
              {stats.rate}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Attendance Rate</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats.rate >= 90 ? 'Excellent' : stats.rate >= 75 ? 'Good' : 'Needs Improvement'}
          </p>
        </CardContent>
      </Card>

      {/* Present Card */}
      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-2xl font-bold text-emerald-600">{stats.present}</span>
          </div>
          <p className="text-xs text-muted-foreground">Present Days</p>
        </CardContent>
      </Card>

      {/* Absent Card */}
      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
          </div>
          <p className="text-xs text-muted-foreground">Absent Days</p>
        </CardContent>
      </Card>

      {/* Late Card */}
      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-2xl font-bold text-amber-600">{stats.late}</span>
          </div>
          <p className="text-xs text-muted-foreground">Late Days</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// CUSTOM CALENDAR VIEW
// ============================================================

function AttendanceCalendar({
  month,
  year,
  records,
}: {
  month: number;
  year: number;
  records: AttendanceRecord[];
}) {
  // Build a map of date -> record for quick lookup
  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      map.set(r.date, r);
    }
    return map;
  }, [records]);

  // Calendar grid calculation
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0=Sun
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build calendar cells
  const cells: Array<{
    day: number | null;
    dateStr: string | null;
    record: AttendanceRecord | undefined;
    isFuture: boolean;
  }> = [];

  // Empty cells before the first day
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ day: null, dateStr: null, record: undefined, isFuture: false });
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cellDate = new Date(year, month - 1, d);
    const isFuture = cellDate > today;
    cells.push({
      day: d,
      dateStr,
      record: recordMap.get(dateStr),
      isFuture,
    });
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES.map((name) => (
            <div
              key={name}
              className="text-center text-[10px] font-semibold text-muted-foreground py-1"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            if (!cell.day) {
              return <div key={`empty-${idx}`} className="h-12 sm:h-14" />;
            }

            const status = cell.record?.status;
            const isWeekend = new Date(cell.dateStr!).getDay() === 0;

            let cellBg = 'bg-gray-50 text-gray-400';
            let statusIcon = '';

            if (cell.isFuture) {
              cellBg = 'bg-white text-gray-300 border border-gray-100';
            } else if (status === 'PRESENT') {
              cellBg = 'bg-emerald-100 text-emerald-800';
              statusIcon = '✅';
            } else if (status === 'ABSENT') {
              cellBg = 'bg-red-100 text-red-800';
              statusIcon = '❌';
            } else if (status === 'LATE') {
              cellBg = 'bg-amber-100 text-amber-800';
              statusIcon = '⏰';
            } else if (isWeekend) {
              cellBg = 'bg-gray-50 text-gray-400';
            } else {
              cellBg = 'bg-white text-gray-600 border border-gray-100';
            }

            const dayContent = (
              <div
                className={`h-12 sm:h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${cellBg} ${
                  !cell.isFuture && cell.day ? 'cursor-default' : ''
                }`}
              >
                <span className="text-xs font-medium leading-tight">{cell.day}</span>
                {statusIcon && <span className="text-[10px] leading-tight">{statusIcon}</span>}
              </div>
            );

            // Show tooltip for days with records
            if (cell.record && !cell.isFuture) {
              return (
                <Tooltip key={`day-${cell.day}`}>
                  <TooltipTrigger asChild>
                    {dayContent}
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{formatDateShort(cell.dateStr!)}</p>
                      <p>Status: {getStatusIcon(status!)} {status}</p>
                      {cell.record?.checkInTime && (
                        <p>Check-in: {cell.record.checkInTime}</p>
                      )}
                      {cell.record?.checkOutTime && (
                        <p>Check-out: {cell.record.checkOutTime}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <div key={`day-${cell.day}`}>
                {dayContent}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-4 h-4 rounded bg-emerald-100" /> Present
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-4 h-4 rounded bg-red-100" /> Absent
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-4 h-4 rounded bg-amber-100" /> Late
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-4 h-4 rounded bg-gray-50 border border-gray-100" /> No Data
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================
// TREND CHART
// ============================================================

function AttendanceTrendChart({ trend }: { trend: Array<{ month: string; rate: number }> }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sky-600" />
          Attendance Trend (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trend.length > 0 && trend.some((t) => t.rate > 0) ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Attendance Rate']}
                />
                <ReferenceLine
                  y={75}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Min 75%',
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 10,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No trend data available yet</p>
            <p className="text-xs text-muted-foreground">
              Attendance data will appear after records are created
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// DETAILS TABLE
// ============================================================

function AttendanceTable({
  records,
  childName,
  month,
  year,
}: {
  records: AttendanceRecord[];
  childName: string;
  month: number;
  year: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayRecords = expanded
    ? [...records].reverse()
    : [...records].reverse().slice(0, 7);

  const handleExportCSV = useCallback(() => {
    const header = 'Date,Day,Status,Check In,Check Out,Duration\n';
    const rows = records.map((r) => {
      const day = getDayName(r.date);
      const status = r.status;
      const checkIn = r.checkInTime || '-';
      const checkOut = r.checkOutTime || '-';
      const duration = r.duration || '-';
      return `${r.date},${day},${status},${checkIn},${checkOut},${duration}`;
    }).join('\n');

    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_${childName.replace(/\s+/g, '_')}_${MONTH_NAMES[month - 1]}_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [records, childName, month, year]);

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-sky-600" />
            Attendance Details
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs"
            onClick={handleExportCSV}
            disabled={records.length === 0}
          >
            <Download className="h-3 w-3 mr-1" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {records.length > 0 ? (
          <div className="space-y-3">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-6 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 bg-gray-50 rounded-xl">
              <span>Date</span>
              <span>Day</span>
              <span>Status</span>
              <span>Check In</span>
              <span>Check Out</span>
              <span>Duration</span>
            </div>

            {/* Table Rows */}
            <div className="space-y-1">
              {displayRecords.map((record) => (
                <div
                  key={record.date}
                  className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  <span className="font-medium text-xs">
                    {formatDateShort(record.date)}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {getDayName(record.date)}
                  </span>
                  <span>{getStatusBadge(record.status)}</span>
                  <span className="text-xs text-muted-foreground">
                    {record.checkInTime || '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {record.checkOutTime || '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {record.duration || '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Expand/Collapse */}
            {records.length > 7 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Show Less' : `Show All ${records.length} Records`}
                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No attendance records this month</p>
            <p className="text-xs text-muted-foreground">
              Records will appear as attendance is marked
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// MONTH YEAR PICKER
// ============================================================

function MonthYearPicker({
  month,
  year,
  onChange,
}: {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}) {
  const [open, setOpen] = useState(false);

  // Generate month options for current year and previous year
  const now = new Date();
  const options: Array<{ month: number; year: number; label: string }> = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--) {
    for (let m = 12; m >= 1; m--) {
      if (y === now.getFullYear() && m > now.getMonth() + 1) continue;
      options.push({
        month: m,
        year: y,
        label: `${MONTH_NAMES[m - 1]} ${y}`,
      });
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl gap-1 font-medium"
        >
          <CalendarIcon className="h-4 w-4" />
          {MONTH_NAMES[month - 1]} {year}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="max-h-64 overflow-y-auto">
        {options.map((opt) => (
          <DropdownMenuItem
            key={`${opt.month}-${opt.year}`}
            className={opt.month === month && opt.year === year ? 'bg-sky-50' : ''}
            onClick={() => {
              onChange(opt.month, opt.year);
              setOpen(false);
            }}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function AttendanceLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-4 w-56 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function ParentAttendancePage() {
  const router = useRouter();
  const { selectedChildId, selectedChild, children, selectChild } = useParentAuth();

  // Month/year state — default to current month
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Fetch attendance data
  const { data, isLoading, isError, error, refetch } = useParentAttendance(
    selectedChildId,
    month,
    year
  );

  // Month navigation
  const goToPrevMonth = useCallback(() => {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setMonth(newMonth);
    setYear(newYear);
  }, [month, year]);

  const goToNextMonth = useCallback(() => {
    const now2 = new Date();
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    // Don't allow future months
    if (newYear > now2.getFullYear() || (newYear === now2.getFullYear() && newMonth > now2.getMonth() + 1)) {
      return;
    }
    setMonth(newMonth);
    setYear(newYear);
  }, [month, year]);

  const handleMonthYearChange = useCallback((newMonth: number, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
  }, []);

  // Is this the current month?
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  // Loading state
  if (isLoading && !data) {
    return <AttendanceLoadingSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">
          {error?.message || 'Failed to load attendance'}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const stats = data?.stats || { present: 0, absent: 0, late: 0, workingDays: 0, rate: 0 };
  const records = data?.records || [];
  const trend = data?.trend || [];
  const childName = data?.childName || `${selectedChild?.firstName || ''} ${selectedChild?.lastName || ''}`.trim() || 'Child';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            View attendance history for {childName}
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

      {/* Monthly Stats Cards */}
      <StatsCards stats={stats} />

      {/* Calendar View */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-sky-600" />
              Attendance Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={goToPrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <MonthYearPicker
                month={month}
                year={year}
                onChange={handleMonthYearChange}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar
            month={month}
            year={year}
            records={records}
          />
        </CardContent>
      </Card>

      {/* Trend Chart + Table row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceTrendChart trend={trend} />
        <AttendanceTable
          records={records}
          childName={childName}
          month={month}
          year={year}
        />
      </div>
    </div>
  );
}
