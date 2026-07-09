'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Check,
  X,
  Clock,
  AlertCircle,
  UserCheck,
  BarChart3,
  Save,
  Users,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ATTENDANCE_COLORS } from '@/lib/theme-tokens';

// ── Types ──
interface ClassInfo {
  id: string;
  name: string;
  program: { id: string; name: string };
}

interface StudentAttendance {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber?: string | null;
  photo?: string | null;
  status: string;
  attendance?: {
    id: string;
    status: string;
    checkInTime?: string | null;
  } | null;
}

interface AttendanceHistoryItem {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

// ── Attendance marking options ──
const ATTENDANCE_OPTIONS = [
  { value: 'PRESENT', label: 'Present', icon: Check, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  { value: 'ABSENT', label: 'Absent', icon: X, color: 'bg-red-500 hover:bg-red-600 text-white' },
  { value: 'LATE', label: 'Late', icon: Clock, color: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { value: 'EXCUSED', label: 'Excused', icon: AlertCircle, color: 'bg-sky-500 hover:bg-sky-600 text-white' },
] as const;

const STATUS_BADGE_CONFIG: Record<string, { dotColor: string; badgeBg: string; badgeText: string; label: string }> = {
  PRESENT: { dotColor: 'var(--admin-success)', badgeBg: 'var(--admin-success-soft)', badgeText: 'var(--admin-success)', label: 'Present' },
  ABSENT: { dotColor: 'var(--admin-error)', badgeBg: 'rgba(239,68,68,0.1)', badgeText: 'var(--admin-error)', label: 'Absent' },
  LATE: { dotColor: 'var(--admin-orange)', badgeBg: 'var(--admin-orange-soft)', badgeText: 'var(--admin-orange)', label: 'Late' },
  EXCUSED: { dotColor: 'var(--admin-info)', badgeBg: 'var(--admin-info-soft)', badgeText: 'var(--admin-info)', label: 'Excused' },
};

// ── Auth helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function ClassAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);

  // ── Fetch class name ──
  useEffect(() => {
    async function fetchClassName() {
      try {
        const token = getToken();
        const res = await fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const found = (data.classes || []).find((c: ClassInfo) => c.id === classId);
          if (found) setClassName(found.name);
        }
      } catch (err) {
        console.error('Failed to fetch class:', err);
      }
    }
    fetchClassName();
  }, [classId]);

  // ── Fetch students + today's attendance ──
  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const studentsRes = await fetch(`/api/students?classId=${classId}&limit=100&status=ACTIVE`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        const studentList: StudentAttendance[] = data.students || [];
        setStudents(studentList);

        // Initialize attendance map
        const initialMap: Record<string, string> = {};
        studentList.forEach((s) => {
          initialMap[s.id] = s.attendance?.status || 'PRESENT';
        });
        setAttendanceMap(initialMap);
      }

      // Fetch attendance stats for weekly history
      const statsRes = await fetch(`/api/attendance/stats?classId=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setHistory(statsData.weeklyHistory || []);
      }
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // ── Handle marking attendance ──
  const handleMarkAttendance = (studentId: string, status: string) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  // ── Bulk actions ──
  const markAllPresent = useCallback(() => {
    setAttendanceMap((prev) => {
      const next: Record<string, string> = { ...prev };
      students.forEach((s) => {
        next[s.id] = 'PRESENT';
      });
      return next;
    });
  }, [students]);

  // ── Save attendance ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status,
        date: selectedDate,
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ records }),
      });

      if (res.ok) {
        // Refresh data
        fetchAttendanceData();
      }
    } catch (err) {
      console.error('Failed to save attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Derived stats ──
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'LATE').length;
  const excusedCount = Object.values(attendanceMap).filter((s) => s === 'EXCUSED').length;
  const attendanceRate =
    students.length > 0
      ? Math.round(((presentCount + lateCount) / students.length) * 100)
      : 0;

  // ── Weekly trend data (mock if no real data) ──
  const weeklyData = useMemo<AttendanceHistoryItem[]>(
    () =>
      history.length > 0
        ? history
        : [
            { date: 'Mon', present: 20, absent: 2, late: 1, total: 23 },
            { date: 'Tue', present: 21, absent: 1, late: 1, total: 23 },
            { date: 'Wed', present: 19, absent: 3, late: 1, total: 23 },
            { date: 'Thu', present: 22, absent: 0, late: 1, total: 23 },
            { date: 'Fri', present: 20, absent: 2, late: 0, total: 22 },
          ],
    [history]
  );

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
        {/* ── Back Button ── */}
        <Button
          variant="ghost"
          className="w-fit gap-1"
          style={{ color: 'var(--admin-text-muted)' }}
          onClick={() => router.push(`/admin/classes/${classId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {className || 'Class'}
        </Button>

        {/* ── HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--admin-primary-soft)' }}
            >
              <Calendar className="h-5 w-5" style={{ color: 'var(--admin-primary)' }} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--admin-text)' }}
              >
                {className} — Attendance
              </h1>
              <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                Mark and manage daily attendance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 rounded-lg border px-3 text-sm outline-none"
              style={{
                background: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text)',
              }}
            />
            <Button
              size="sm"
              className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Present"
            value={presentCount}
            icon={<Check className="h-5 w-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Absent"
            value={absentCount}
            icon={<X className="h-5 w-5" />}
            color="bg-red-500"
          />
          <CosmicStatCard
            label="Late"
            value={lateCount}
            icon={<Clock className="h-5 w-5" />}
            color="bg-amber-500"
          />
          <CosmicStatCard
            label="Attendance Rate"
            value={attendanceRate}
            suffix="%"
            icon={<BarChart3 className="h-5 w-5" />}
            color="bg-violet-500"
          />
        </div>

        {/* ── Today's Attendance Grid ── */}
        <PreOneCard className="!rounded-xl overflow-hidden">
          {/* Stats Bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
            style={{ borderColor: 'var(--admin-border)' }}
          >
            <div className="flex items-center gap-3">
              <UserCheck
                className="h-4 w-4"
                style={{ color: 'var(--admin-primary)' }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--admin-text)' }}
              >
                Mark Attendance — {format(new Date(selectedDate), 'dd MMM yyyy')}
              </span>
              <span
                className="rounded-md px-2 py-0.5 text-xs font-bold"
                style={{
                  background: 'var(--admin-primary-soft)',
                  color: 'var(--admin-primary)',
                }}
              >
                {students.length} students
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={markAllPresent}
              disabled={loading || students.length === 0}
            >
              <Check className="h-3.5 w-3.5" />
              Mark All Present
            </Button>
          </div>

          {/* Attendance List */}
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Users
                  className="h-10 w-10 opacity-40"
                  style={{ color: 'var(--admin-text-muted)' }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  No active students in this class
                </p>
                <p className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                  Add students to this class to start marking attendance.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map((student) => {
                  const currentStatus = attendanceMap[student.id] || 'PRESENT';
                  const badgeConfig = STATUS_BADGE_CONFIG[currentStatus] ?? STATUS_BADGE_CONFIG.PRESENT;
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-[var(--admin-surface-2)] dark:hover:bg-[var(--admin-surface-2)]"
                      style={{ borderColor: 'var(--admin-border)' }}
                    >
                      {/* Student Info */}
                      <Avatar className="h-9 w-9">
                        <AvatarFallback
                          className="text-xs font-semibold"
                          style={{
                            background: 'var(--admin-primary-soft)',
                            color: 'var(--admin-primary)',
                          }}
                        >
                          {student.firstName.charAt(0)}
                          {student.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p
                          className="truncate text-sm font-medium"
                          style={{ color: 'var(--admin-text)' }}
                        >
                          {student.firstName} {student.lastName}
                        </p>
                        {student.rollNumber && (
                          <p
                            className="text-xs"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          >
                            #{student.rollNumber}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ background: badgeConfig.badgeBg, color: badgeConfig.badgeText }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: badgeConfig.dotColor }}
                        />
                        {badgeConfig.label}
                      </span>

                      {/* Quick Action Buttons */}
                      <div className="flex gap-1">
                        {ATTENDANCE_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = currentStatus === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleMarkAttendance(student.id, opt.value)}
                              className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs transition-all ${
                                isSelected
                                  ? opt.color
                                  : 'bg-[var(--admin-surface-2)] text-[var(--admin-text-subtle)] hover:bg-[var(--admin-border)] dark:bg-[var(--admin-surface)] dark:hover:bg-[var(--admin-surface-2)]'
                              }`}
                              title={opt.label}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </PreOneCard>

        {/* ── Weekly Trend ── */}
        <PreOneCard className="!rounded-xl">
          <PreOneCardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3
                className="h-4 w-4"
                style={{ color: 'var(--admin-primary)' }}
              />
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--admin-text)' }}
              >
                Weekly Attendance Trend
              </h3>
            </div>

            <div className="flex items-end gap-2 h-32">
              {weeklyData.map((day, i) => {
                const maxTotal = Math.max(...weeklyData.map((d) => d.total), 1);
                const presentHeight = Math.round((day.present / maxTotal) * 100);
                const absentHeight = Math.round((day.absent / maxTotal) * 100);
                const lateHeight = Math.round((day.late / maxTotal) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full flex flex-col items-center gap-0.5"
                      style={{ height: '96px' }}
                    >
                      <div
                        className="w-full bg-emerald-400 rounded-t"
                        style={{
                          height: `${presentHeight}%`,
                          minHeight: day.present > 0 ? '4px' : '0',
                        }}
                      />
                      <div
                        className="w-full bg-amber-400"
                        style={{
                          height: `${lateHeight}%`,
                          minHeight: day.late > 0 ? '4px' : '0',
                        }}
                      />
                      <div
                        className="w-full bg-red-400 rounded-b"
                        style={{
                          height: `${absentHeight}%`,
                          minHeight: day.absent > 0 ? '4px' : '0',
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px]"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      {typeof day.date === 'string' && day.date.length <= 3
                        ? day.date
                        : format(new Date(day.date), 'EEE')}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-emerald-400" /> Present
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-amber-400" /> Late
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-red-400" /> Absent
              </div>
            </div>
          </PreOneCardContent>
        </PreOneCard>
      </div>
    </PageTransition>
  );
}
