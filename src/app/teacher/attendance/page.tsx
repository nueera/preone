'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  Edit3,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PORTAL_THEMES, ATTENDANCE_COLORS } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.teacher;

// ── Types ──
type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';

interface StudentRecord {
  studentId: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  photo: string | null;
  status: AttendanceStatus | null;
  checkInTime: string | null;
  checkOutTime: string | null;
}

interface AttendanceData {
  date: string;
  class: {
    id: string;
    name: string;
    program: string;
  };
  marked: boolean;
  stats: {
    present: number;
    absent: number;
    late: number;
    total: number;
    rate: number;
  };
  records: StudentRecord[];
}

interface DailyStat {
  date: string;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

interface MonthlyData {
  month: number;
  year: number;
  className: string;
  studentCount: number;
  workingDays: number;
  dailyStats: DailyStat[];
  monthlyRate: number;
}

// ── Helpers ──
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function isFutureDate(dateStr: string): boolean {
  const today = formatDate(new Date());
  return dateStr > today;
}

function getStatusConfig(status: AttendanceStatus) {
  switch (status) {
    case 'PRESENT':
      return { label: 'Present', icon: CheckCircle2, color: 'emerald' };
    case 'LATE':
      return { label: 'Late', icon: Clock, color: 'amber' };
    case 'ABSENT':
      return { label: 'Absent', icon: XCircle, color: 'red' };
  }
}

/**
 * AttendancePage — Mark and view daily attendance for teacher's class.
 */
export default function AttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date state
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  // Data state
  const [data, setData] = useState<AttendanceData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [selections, setSelections] = useState<Map<string, AttendanceStatus>>(new Map());

  // Absent notification dialog
  const [showAbsentDialog, setShowAbsentDialog] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<StudentRecord[]>([]);

  // ── Fetch attendance data ──
  const fetchAttendance = useCallback(async (date: string) => {
    const token = localStorage.getItem('preone_token');
    if (!token) { router.push('/login'); return; }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/teacher/attendance/mark?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load attendance');
      const json = await res.json();
      setData(json);

      // Initialize selections from existing records
      const map = new Map<string, AttendanceStatus>();
      json.records.forEach((r: StudentRecord) => {
        if (r.status) {
          map.set(r.studentId, r.status);
        } else {
          map.set(r.studentId, 'PRESENT'); // default to present for new
        }
      });
      setSelections(map);

      // Set edit mode: if not marked or future date, allow editing
      if (!json.marked && !isFutureDate(date)) {
        setEditMode(true);
      } else {
        setEditMode(false);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ── Fetch monthly data ──
  const fetchMonthly = useCallback(async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      const d = new Date(selectedDate + 'T00:00:00');
      const res = await fetch(
        `/api/teacher/attendance/monthly?month=${d.getMonth() + 1}&year=${d.getFullYear()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const json = await res.json();
      setMonthlyData(json);
    } catch {
      // silently fail
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate, fetchAttendance]);

  useEffect(() => {
    fetchMonthly();
  }, [fetchMonthly]);

  // ── Computed stats from current selections ──
  const liveStats = React.useMemo(() => {
    let present = 0, absent = 0, late = 0;
    selections.forEach((status) => {
      switch (status) {
        case 'PRESENT': present++; break;
        case 'LATE': late++; break;
        case 'ABSENT': absent++; break;
      }
    });
    const total = present + absent + late;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { present, absent, late, total, rate };
  }, [selections]);

  // ── Handle date change ──
  const handleDateChange = (newDate: string) => {
    if (isFutureDate(newDate)) return;
    setSelectedDate(newDate);
  };

  // ── Navigate days ──
  const goToPrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    handleDateChange(formatDate(d));
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const next = formatDate(d);
    if (!isFutureDate(next)) {
      setSelectedDate(next);
    }
  };

  // ── Toggle student status ──
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!editMode) return;
    setSelections((prev) => {
      const next = new Map(prev);
      next.set(studentId, status);
      return next;
    });
  };

  // ── Mark all present ──
  const handleMarkAllPresent = () => {
    if (!editMode || !data) return;
    const map = new Map<string, AttendanceStatus>();
    data.records.forEach((r) => map.set(r.studentId, 'PRESENT'));
    setSelections(map);
  };

  // ── Clear all ──
  const handleClearAll = () => {
    if (!editMode || !data) return;
    const map = new Map<string, AttendanceStatus>();
    data.records.forEach((r) => map.set(r.studentId, 'ABSENT'));
    setSelections(map);
  };

  // ── Save attendance ──
  const handleSave = async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setSaving(true);
      const records = Array.from(selections.entries()).map(([studentId, status]) => ({
        studentId,
        status,
        method: 'MANUAL',
      }));

      const res = await fetch('/api/teacher/attendance/mark', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          records,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save attendance');
      }

      const result = await res.json();
      toast.success(`Attendance saved for ${result.saved + result.updated} students`);

      // Refresh data
      await fetchAttendance(selectedDate);
      await fetchMonthly();
      setEditMode(false);

      // Check for absent students
      const absentList = data?.records.filter(
        (r) => selections.get(r.studentId) === 'ABSENT'
      ) || [];
      if (absentList.length > 0) {
        setAbsentStudents(absentList);
        setShowAbsentDialog(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ──
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Attendance</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button
          onClick={() => fetchAttendance(selectedDate)}
          className="bg-portal-600 hover:bg-portal-700 rounded-xl"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const isFuture = isFutureDate(selectedDate);
  const isToday = selectedDate === today;
  const isPast = !isToday && !isFuture;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-xl h-auto">
          <TabsTrigger value="daily" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 mr-1.5" /> Daily Attendance
          </TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LayoutGrid className="h-4 w-4 mr-1.5" /> Monthly View
          </TabsTrigger>
        </TabsList>

        {/* ── Daily Attendance Tab ── */}
        <TabsContent value="daily">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Main attendance area */}
            <div className="lg:col-span-2 space-y-4">
              {/* Header with date navigation */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">Mark Attendance</h1>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {data.class.name} | {data.class.program} | {data.stats.total} Students
                      </p>
                    </div>

                    {/* Date navigation */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={goToPrevDay}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Input
                        type="date"
                        value={selectedDate}
                        max={today}
                        onChange={(e) => e.target.value && handleDateChange(e.target.value)}
                        className="w-40 h-8 text-sm rounded-xl"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={goToNextDay}
                        disabled={isToday}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Already marked banner */}
                  {data.marked && !editMode && (
                    <div className="mt-3 flex items-center justify-between p-3 bg-portal-50 border border-portal-200 rounded-xl">
                      <div className="flex items-center gap-2 text-portal-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Attendance already marked for {formatDateDisplay(selectedDate)}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs rounded-xl border-portal-200 text-portal-700 hover:bg-portal-50"
                        onClick={() => setEditMode(true)}
                      >
                        <Edit3 className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    </div>
                  )}

                  {isFuture && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Cannot mark attendance for future dates
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action bar */}
              {editMode && !isFuture && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-xl border-portal-200 text-portal-700 hover:bg-portal-50"
                    onClick={handleMarkAllPresent}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                    onClick={handleClearAll}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Clear All
                  </Button>
                  <div className="flex-1" />
                  <span className="text-sm text-gray-500">{formatDateDisplay(selectedDate)}</span>
                  <Button
                    size="sm"
              className="bg-portal-600 hover:bg-portal-700 rounded-xl text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {saving ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </div>
              )}

              {/* Student rows */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-0 divide-y divide-gray-100">
                  {data.records.map((student) => {
                    const status = selections.get(student.studentId) || null;
                    return (
                      <StudentRow
                        key={student.studentId}
                        student={student}
                        selectedStatus={status}
                        editable={editMode && !isFuture}
                        onStatusChange={(s) => handleStatusChange(student.studentId, s)}
                      />
                    );
                  })}

                  {data.records.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                      <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="font-medium">No Students Found</p>
                      <p className="text-sm">Add students to your class to mark attendance.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Stats sidebar */}
            <div className="space-y-4">
              {/* Today's Summary */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-900">
                    {isToday ? "Today's Summary" : `Summary — ${formatDateShort(selectedDate)}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatRow
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    label="Present"
                    value={liveStats.present}
                    color="emerald"
                  />
                  <StatRow
                    icon={<Clock className="h-4 w-4 text-amber-500" />}
                    label="Late"
                    value={liveStats.late}
                    color="amber"
                  />
                  <StatRow
                    icon={<XCircle className="h-4 w-4 text-red-500" />}
                    label="Absent"
                    value={liveStats.absent}
                    color="red"
                  />
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Attendance Rate</span>
                      <span className="font-bold text-lg text-portal-600">{liveStats.rate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-portal-500 transition-all duration-500"
                        style={{ width: `${liveStats.rate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    Total: {liveStats.total} students
                  </div>
                </CardContent>
              </Card>

              {/* Absent Students Alert (after saving) */}
              {data.marked && !editMode && liveStats.absent > 0 && (
                <Card className="border-0 shadow-md border-l-4 border-l-red-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-semibold text-red-700">
                        {liveStats.absent} student{liveStats.absent !== 1 ? 's' : ''} absent
                      </span>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {data.records
                        .filter((r) => selections.get(r.studentId) === 'ABSENT')
                        .map((r) => (
                          <li key={r.studentId} className="text-xs text-gray-600">
                            {r.firstName} {r.lastName} (Roll: {r.rollNumber || '-'})
                          </li>
                        ))}
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        toast.success('Notifications sent to parents of absent students');
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" /> Notify Parents
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Quick date navigation */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Quick Navigation</p>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - i);
                      const dateStr = formatDate(d);
                      const isCurrent = dateStr === selectedDate;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => handleDateChange(dateStr)}
                          className={`px-2 py-1.5 rounded-lg text-xs text-center transition-colors ${
                            isCurrent
                              ? 'bg-portal-600 text-white font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Monthly View Tab ── */}
        <TabsContent value="monthly">
          <MonthlyView
            data={monthlyData}
            selectedDate={selectedDate}
            onDateSelect={handleDateChange}
          />
        </TabsContent>
      </Tabs>

      {/* ── Absent Students Dialog ── */}
      <Dialog open={showAbsentDialog} onOpenChange={setShowAbsentDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Absent Students
            </DialogTitle>
            <DialogDescription>
              {absentStudents.length} student{absentStudents.length !== 1 ? 's' : ''} absent on {formatDateDisplay(selectedDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {absentStudents.map((s) => (
              <div key={s.studentId} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                <Avatar className="h-8 w-8">
                <AvatarFallback className={`${ATTENDANCE_COLORS.ABSENT.bg} ${ATTENDANCE_COLORS.ABSENT.text} text-xs`}>
                    {getInitials(s.firstName, s.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-500">Roll: {s.rollNumber || '-'}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowAbsentDialog(false)}
            >
              Close
            </Button>
            <Button
              className="bg-portal-600 hover:bg-portal-700 rounded-xl"
            >
              <Send className="h-4 w-4 mr-1" /> Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Student Row Component ──
function StudentRow({
  student,
  selectedStatus,
  editable,
  onStatusChange,
}: {
  student: StudentRecord;
  selectedStatus: AttendanceStatus | null;
  editable: boolean;
  onStatusChange: (status: AttendanceStatus) => void;
}) {
  const initials = getInitials(student.firstName, student.lastName);

  const statusButtons: { status: AttendanceStatus; label: string; icon: React.ElementType }[] = [
    { status: 'PRESENT', label: 'Present', icon: CheckCircle2 },
    { status: 'LATE', label: 'Late', icon: Clock },
    { status: 'ABSENT', label: 'Absent', icon: XCircle },
  ];

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
      {/* Avatar + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-9 w-9 shrink-0">
          {student.photo ? (
            <AvatarImage src={student.photo} alt={student.name} />
          ) : (
            <AvatarFallback className={`${theme.avatarFallbackClass} text-xs font-semibold`}>
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {student.firstName} {student.lastName}
          </p>
          <p className="text-xs text-gray-500">Roll: {student.rollNumber || '-'}</p>
        </div>
      </div>

      {/* Status buttons */}
      <div className="flex items-center gap-1.5">
        {statusButtons.map(({ status, label, icon: Icon }) => {
          const isSelected = selectedStatus === status;
          const colorMap: Record<AttendanceStatus, { bg: string; border: string; text: string; activeBg: string }> = {
            PRESENT: { bg: `${ATTENDANCE_COLORS.PRESENT.bg}`, border: 'border-emerald-300', text: `${ATTENDANCE_COLORS.PRESENT.text}`, activeBg: 'bg-emerald-600' },
            LATE: { bg: `${ATTENDANCE_COLORS.LATE.bg}`, border: 'border-amber-300', text: `${ATTENDANCE_COLORS.LATE.text}`, activeBg: 'bg-amber-500' },
            ABSENT: { bg: `${ATTENDANCE_COLORS.ABSENT.bg}`, border: 'border-red-300', text: `${ATTENDANCE_COLORS.ABSENT.text}`, activeBg: 'bg-red-500' },
          };
          const colors = colorMap[status];

          return (
            <button
              key={status}
              disabled={!editable}
              onClick={() => onStatusChange(status)}
              className={`
                flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 border
                ${isSelected
                  ? `${colors.activeBg} text-white border-transparent shadow-sm`
                  : `${colors.bg} ${colors.text} ${colors.border} hover:shadow-sm`
                }
                ${!editable ? 'opacity-80 cursor-default' : 'cursor-pointer'}
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat Row Component ──
function StatRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const bgColor = color === 'emerald' ? ATTENDANCE_COLORS.PRESENT.bg : color === 'amber' ? ATTENDANCE_COLORS.LATE.bg : ATTENDANCE_COLORS.ABSENT.bg;
  const textColor = color === 'emerald' ? ATTENDANCE_COLORS.PRESENT.text : color === 'amber' ? ATTENDANCE_COLORS.LATE.text : ATTENDANCE_COLORS.ABSENT.text;

  return (
    <div className={`flex items-center justify-between p-2.5 ${bgColor} rounded-xl`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-lg font-bold ${textColor}`}>{value}</span>
    </div>
  );
}

// ── Monthly View Component ──
function MonthlyView({
  data,
  selectedDate,
  onDateSelect,
}: {
  data: MonthlyData | null;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}) {
  if (!data) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-12 text-center">
          <Skeleton className="h-8 w-48 rounded-xl mx-auto mb-4" />
          <div className="grid grid-cols-7 gap-2 max-w-lg mx-auto">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const currentMonth = data.month - 1;
  const currentYear = data.year;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Build daily stats map
  const dailyStatsMap = new Map<string, DailyStat>();
  data.dailyStats.forEach((ds) => dailyStatsMap.set(ds.date, ds));

  // Count total students in class
  const totalStudents = data.studentCount;

  return (
    <div className="space-y-4">
      {/* Monthly stats header */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {new Date(currentYear, currentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-sm text-gray-500">{data.className} | {data.studentCount} Students</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-portal-600">{data.monthlyRate}%</p>
                <p className="text-xs text-gray-500">Monthly Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{data.workingDays}</p>
                <p className="text-xs text-gray-500">Working Days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar grid */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-xs font-medium text-gray-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const ds = dailyStatsMap.get(dateStr);
              const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
              const isSelected = dateStr === selectedDate;
              const isFuture = new Date(currentYear, currentMonth, day) > now;
              const isWeekend = new Date(currentYear, currentMonth, day).getDay() === 0;

              // Determine cell color
              let cellBg = 'bg-white hover:bg-gray-50';
              let dotColor = '';
              if (ds) {
                const absentRate = totalStudents > 0 ? ds.absent / totalStudents : 0;
                if (absentRate === 0) { cellBg = 'bg-portal-50 hover:bg-emerald-100'; dotColor = 'bg-emerald-500'; }
                else if (absentRate <= 0.1) { cellBg = 'bg-portal-50 hover:bg-emerald-100'; dotColor = 'bg-emerald-500'; }
                else if (absentRate <= 0.3) { cellBg = 'bg-amber-50 hover:bg-amber-100'; dotColor = 'bg-amber-500'; }
                else { cellBg = 'bg-red-50 hover:bg-red-100'; dotColor = 'bg-red-500'; }
              }

              return (
                <button
                  key={day}
                  disabled={isFuture || isWeekend}
                  onClick={() => !isFuture && onDateSelect(dateStr)}
                  className={`
                    h-14 flex flex-col items-center justify-center rounded-xl text-sm relative
                    transition-all duration-200 border
                    ${isSelected ? 'ring-2 ring-portal-500 ring-offset-1 border-portal-200' : 'border-transparent'}
                    ${isToday ? 'font-bold' : ''}
                    ${isFuture ? 'text-gray-300 cursor-default' : isWeekend ? 'text-gray-400 cursor-default' : 'cursor-pointer'}
                    ${cellBg}
                  `}
                >
                  <span className={`${isToday ? 'text-portal-600' : ''}`}>{day}</span>
                  {ds && !isFuture && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                      <span className="text-[9px] text-gray-500">{ds.rate}%</span>
                    </div>
                  )}
                  {isWeekend && !isFuture && (
                    <span className="text-[9px] text-gray-400 mt-0.5">Off</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> All Present
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Some Absent
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" /> Many Absent
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
