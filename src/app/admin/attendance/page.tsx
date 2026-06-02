'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Download,
  CheckSquare,
  Users,
  UserCheck,
  UserX,
  Clock,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { PORTAL_THEMES, ATTENDANCE_COLORS, CHART_PALETTE } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;

// ── Types ──
interface ClassWiseStat {
  classId: string;
  className: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  unmarked: number;
  rate: number;
}

interface StaffDetail {
  id: string;
  firstName: string;
  lastName: string;
  teacherStatus: string;
  assignedClass: { id: string; name: string } | null;
  attendance: {
    id: string;
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    method: string | null;
  } | null;
}

interface StudentForMarking {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  photo: string | null;
  currentStatus: string;
}

interface ProgramGroup {
  id: string;
  name: string;
  classes: { id: string; name: string; _count: { students: number } }[];
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  method: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    rollNumber: string | null;
    class: { id: string; name: string } | null;
  };
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function AttendancePage() {
  // ── State ──
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [classStats, setClassStats] = useState<ClassWiseStat[]>([]);
  const [staffDetails, setStaffDetails] = useState<StaffDetail[]>([]);
  const [staffStats, setStaffStats] = useState({ present: 0, onLeave: 0, late: 0, absent: 0 });
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [programs, setPrograms] = useState<ProgramGroup[]>([]);

  // Mark attendance dialog
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [markClassId, setMarkClassId] = useState('');
  const [studentsForMarking, setStudentsForMarking] = useState<StudentForMarking[]>([]);
  const [markingStatus, setMarkingStatus] = useState<Record<string, string>>({});
  const [markingSubmitting, setMarkingSubmitting] = useState(false);
  const [markLoading, setMarkLoading] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // ── Fetch classes ──
  useEffect(() => {
    async function fetchClasses() {
      try {
        const token = getToken();
        const res = await fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPrograms(data.programs || []);
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    }
    fetchClasses();
  }, []);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ date: dateStr });
      if (classId) params.set('classId', classId);

      const [statsRes, staffRes, attendanceRes] = await Promise.all([
        fetch(`/api/attendance/stats?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/attendance/staff?date=${dateStr}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/attendance?date=${dateStr}&type=student${classId ? `&classId=${classId}` : ''}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setClassStats(statsData.classes || []);
      }
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffDetails(staffData.details || []);
        setStaffStats({
          present: staffData.present || 0,
          onLeave: staffData.onLeave || 0,
          late: staffData.late || 0,
          absent: staffData.absent || 0,
        });
      }
      if (attendanceRes.ok) {
        const attData = await attendanceRes.json();
        setStudentRecords(attData.attendance || []);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, [dateStr, classId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Open mark attendance dialog ──
  const openMarkDialog = async (cId: string) => {
    setMarkClassId(cId);
    setMarkLoading(true);
    setMarkDialogOpen(true);

    try {
      const token = getToken();
      // Fetch students in class
      const studentsRes = await fetch(`/api/students?classId=${cId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        const students = (studentsData.students || []).map((s: { id: string; firstName: string; lastName: string; rollNumber: string | null; photo: string | null }) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          rollNumber: s.rollNumber,
          photo: s.photo,
          currentStatus: 'PRESENT', // Default all present
        }));
        setStudentsForMarking(students);

        // Set default status to PRESENT for all
        const defaultStatus: Record<string, string> = {};
        students.forEach((s: StudentForMarking) => {
          defaultStatus[s.id] = 'PRESENT';
        });
        setMarkingStatus(defaultStatus);
      }

      // Fetch existing attendance for this class/date
      const attRes = await fetch(`/api/attendance?date=${dateStr}&classId=${cId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (attRes.ok) {
        const attData = await attRes.json();
        const existingStatus: Record<string, string> = {};
        (attData.attendance || []).forEach((a: AttendanceRecord) => {
          existingStatus[a.studentId] = a.status;
        });
        if (Object.keys(existingStatus).length > 0) {
          setMarkingStatus((prev) => ({ ...prev, ...existingStatus }));
        }
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setMarkLoading(false);
    }
  };

  // ── Save attendance ──
  const handleSaveAttendance = async () => {
    setMarkingSubmitting(true);
    try {
      const token = getToken();
      const records = studentsForMarking.map((s) => ({
        studentId: s.id,
        date: dateStr,
        status: markingStatus[s.id] || 'PRESENT',
        method: 'MANUAL',
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'student', records }),
      });

      if (res.ok) {
        setMarkDialogOpen(false);
        fetchStats();
      }
    } catch (err) {
      console.error('Save attendance failed:', err);
    } finally {
      setMarkingSubmitting(false);
    }
  };

  // ── Mark all present ──
  const markAllPresent = () => {
    const allPresent: Record<string, string> = {};
    studentsForMarking.forEach((s) => {
      allPresent[s.id] = 'PRESENT';
    });
    setMarkingStatus(allPresent);
  };

  // ── Export CSV ──
  const exportCSV = () => {
    const headers = ['Class', 'Total', 'Present', 'Absent', 'Late', 'Rate'];
    const rows = classStats.map(c => [c.className, c.total, c.present, c.absent, c.late, `${c.rate}%`]);
    const totalRow = ['TOTAL', classStats.reduce((s, c) => s + c.total, 0),
      classStats.reduce((s, c) => s + c.present, 0),
      classStats.reduce((s, c) => s + c.absent, 0),
      classStats.reduce((s, c) => s + c.late, 0),
      `${classStats.length > 0 ? Math.round(classStats.reduce((s, c) => s + c.rate, 0) / classStats.length) : 0}%`];

    const csv = [headers, ...rows, totalRow].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, 'dd MMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Class Filter */}
          <Select value={classId} onValueChange={(v) => setClassId(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {programs.map((program) => (
                <SelectGroup key={program.id}>
                  <SelectLabel>{program.name}</SelectLabel>
                  {program.classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ═══════════ Section 1: Student Attendance Stats ═══════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-portal-500" />
            Student Attendance — {format(selectedDate, 'dd MMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Rate</TableHead>
                    <TableHead className="w-[200px]">Visual</TableHead>
                    <TableHead className="w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStats.map((cls) => (
                    <TableRow key={cls.classId} className="cursor-pointer hover:bg-portal-50/50">
                      <TableCell className="font-medium">{cls.className}</TableCell>
                      <TableCell className="text-center">{cls.total}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-medium">{cls.present}</TableCell>
                      <TableCell className="text-center text-red-600 font-medium">{cls.absent}</TableCell>
                      <TableCell className="text-center text-amber-600 font-medium">{cls.late}</TableCell>
                      <TableCell className="text-center font-bold">{cls.rate}%</TableCell>
                      <TableCell>
                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100">
                          <div
                            className="transition-all"
                            style={{ width: `${(cls.present / Math.max(cls.total, 1)) * 100}%`, backgroundColor: ATTENDANCE_COLORS.PRESENT.hex }}
                          />
                          <div
                            className="transition-all"
                            style={{ width: `${(cls.late / Math.max(cls.total, 1)) * 100}%`, backgroundColor: ATTENDANCE_COLORS.LATE.hex }}
                          />
                          <div
                            className="transition-all"
                            style={{ width: `${(cls.absent / Math.max(cls.total, 1)) * 100}%`, backgroundColor: ATTENDANCE_COLORS.ABSENT.hex }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => openMarkDialog(cls.classId)}
                        >
                          <Plus className="h-3 w-3" /> Mark
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  {classStats.length > 0 && (
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-center">{classStats.reduce((s, c) => s + c.total, 0)}</TableCell>
                      <TableCell className="text-center text-emerald-600">{classStats.reduce((s, c) => s + c.present, 0)}</TableCell>
                      <TableCell className="text-center text-red-600">{classStats.reduce((s, c) => s + c.absent, 0)}</TableCell>
                      <TableCell className="text-center text-amber-600">{classStats.reduce((s, c) => s + c.late, 0)}</TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const total = classStats.reduce((s, c) => s + c.total, 0);
                          const present = classStats.reduce((s, c) => s + c.present + c.late, 0);
                          return total > 0 ? Math.round((present / total) * 100) : 0;
                        })()}%
                      </TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {classStats.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No attendance data for this date</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════ Section 2: Staff Attendance ═══════════ */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-portal-500" />
          Staff Attendance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-emerald-600">{staffStats.present}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold text-amber-600">{staffStats.onLeave}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-orange-600">{staffStats.late}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{staffStats.absent}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff list */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Assigned Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : staffDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No staff data
                      </TableCell>
                    </TableRow>
                  ) : (
                    staffDetails.map((staff) => {
                      const status = staff.attendance?.status ||
                        (staff.teacherStatus === 'ON_LEAVE' ? 'ON_LEAVE' : 'UNMARKED');
                      const statusColor: Record<string, string> = {
                        PRESENT: `${ATTENDANCE_COLORS.PRESENT.bg} ${ATTENDANCE_COLORS.PRESENT.text} border-emerald-200`,
                        LATE: `${ATTENDANCE_COLORS.LATE.bg} ${ATTENDANCE_COLORS.LATE.text} border-amber-200`,
                        ABSENT: `${ATTENDANCE_COLORS.ABSENT.bg} ${ATTENDANCE_COLORS.ABSENT.text} border-red-200`,
                        ON_LEAVE: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                        UNMARKED: 'bg-gray-50 text-gray-500 border-gray-200',
                      };
                      return (
                        <TableRow key={staff.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-portal-50 text-portal-700 text-xs font-semibold">
                                  {getInitials(staff.firstName, staff.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{staff.firstName} {staff.lastName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {staff.assignedClass ? (
                              <Badge variant="secondary">{staff.assignedClass.name}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${statusColor[status] || statusColor.UNMARKED}`}>
                              {status === 'ON_LEAVE' ? 'On Leave' : status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {staff.attendance?.checkInTime || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {staff.attendance?.method || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════ Section 3: Mark Attendance Button ═══════════ */}
      <div className="flex justify-end">
        <Button
          className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          onClick={() => {
            if (programs.length > 0 && programs[0].classes.length > 0) {
              openMarkDialog(programs[0].classes[0].id);
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Mark Attendance
        </Button>
      </div>

      {/* ═══════════ Section 4: Check-in/Out Table ═══════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-portal-500" />
            Check-in / Check-out — {format(selectedDate, 'dd MMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : studentRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No check-in/out data for this date</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentRecords
                    .filter((r) => r.checkInTime)
                    .map((record) => {
                      const calculateDuration = () => {
                        if (!record.checkInTime || !record.checkOutTime) return '—';
                        try {
                          const [inH, inM] = record.checkInTime.split(':').map(Number);
                          const [outH, outM] = record.checkOutTime.split(':').map(Number);
                          const totalMin = (outH * 60 + outM) - (inH * 60 + inM);
                          if (totalMin < 0) return '—';
                          const h = Math.floor(totalMin / 60);
                          const m = totalMin % 60;
                          return `${h}h ${m}m`;
                        } catch {
                          return '—';
                        }
                      };
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-portal-50 text-portal-700 text-xs">
                                  {getInitials(record.student.firstName, record.student.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{record.student.firstName} {record.student.lastName.charAt(0)}.</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.student.class ? (
                              <Badge variant="secondary" className="text-xs">{record.student.class.name}</Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-sm">{record.checkInTime || '—'}</TableCell>
                          <TableCell className="text-sm">{record.checkOutTime || '—'}</TableCell>
                          <TableCell className="text-sm font-medium">{calculateDuration()}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{record.method || '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════ Mark Attendance Dialog ═══════════ */}
      <Dialog open={markDialogOpen} onOpenChange={setMarkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark Attendance — {format(selectedDate, 'dd MMM yyyy')}</DialogTitle>
          </DialogHeader>

          <div className="mb-4">
            <Label>Class</Label>
            <Select
              value={markClassId}
              onValueChange={(v) => {
                setMarkClassId(v);
                openMarkDialog(v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectGroup key={program.id}>
                    <SelectLabel>{program.name}</SelectLabel>
                    {program.classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mb-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={markAllPresent}>
              <UserCheck className="h-3.5 w-3.5" />
              Mark All Present
            </Button>
          </div>

          {markLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {studentsForMarking.map((student) => {
                const status = markingStatus[student.id] || 'PRESENT';
                return (
                  <div key={student.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-portal-50 text-portal-700 text-xs font-semibold">
                          {getInitials(student.firstName, student.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                        {student.rollNumber && (
                          <p className="text-xs text-muted-foreground">#{student.rollNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {(['PRESENT', 'LATE', 'ABSENT'] as const).map((s) => {
                        const colors: Record<string, string> = {
                          PRESENT: status === 'PRESENT' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                          LATE: status === 'LATE' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                          ABSENT: status === 'ABSENT' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
                        };
                        const labels: Record<string, string> = { PRESENT: 'Present', LATE: 'Late', ABSENT: 'Absent' };
                        return (
                          <button
                            key={s}
                            onClick={() => setMarkingStatus((prev) => ({ ...prev, [student.id]: s }))}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${colors[s]}`}
                          >
                            {labels[s]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setMarkDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
              disabled={markingSubmitting}
              onClick={handleSaveAttendance}
            >
              {markingSubmitting ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
