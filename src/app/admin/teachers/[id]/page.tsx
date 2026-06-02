'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  Calendar,
  User,
  Star,
  Clock,
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// ── Types ──
interface BranchInfo { id: string; name: string }
interface UserInfo { id: string; email: string; isActive: boolean }
interface ClassInfo { id: string; name: string; capacity?: number }
interface QualificationInfo { id: string; degree: string; institution: string; year: number; certificate?: string | null }
interface WorkScheduleInfo { id: string; dayOfWeek: number; startTime: string; endTime: string; subject?: string | null; classId?: string | null }
interface ReviewInfo { id: string; period: string; teachingQuality: number; studentEngagement: number; communication: number; punctuality: number; professionalDev: number; overallRating: number; comments?: string | null; reviewerName?: string | null; reviewDate: string }
interface SalaryInfo { id: string; month: number; year: number; basicSalary: number; hra: number; da: number; pfDeduction: number; taxDeduction: number; otherDeductions: number; deductionReason?: string | null; bonus: number; bonusReason?: string | null; netPay: number; paymentMethod?: string | null; paymentDate?: string | null; status: string }
interface LeaveInfo { id: string; leaveType: string; startDate: string; endDate: string; reason: string; status: string; approvedBy?: string | null; approvedAt?: string | null }
interface AttendanceInfo { id: string; date: string; status: string; checkInTime?: string | null; checkOutTime?: string | null }

interface TeacherData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  experience: number;
  photo?: string | null;
  joiningDate: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  salary?: number | null;
  branchId?: string | null;
  branch: BranchInfo | null;
  user: UserInfo | null;
  assignedClass: ClassInfo | null;
  qualifications: QualificationInfo[];
  workSchedules: WorkScheduleInfo[];
  reviews: ReviewInfo[];
  salaries: SalaryInfo[];
  leaves: LeaveInfo[];
  staffAttendance: AttendanceInfo[];
}

// ── Constants ──
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ON_LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
  INACTIVE: 'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  ON_LEAVE: 'On Leave',
  INACTIVE: 'Inactive',
};

const SALARY_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-gray-50 text-gray-600 border-gray-200',
};

const LEAVE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-gray-50 text-gray-600 border-gray-200',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  CASUAL: 'Casual',
  SICK: 'Sick',
  EARNED: 'Earned',
  MATERNITY: 'Maternity',
  PATERNITY: 'Paternity',
  WITHOUT_PAY: 'Without Pay',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'];
const SUBJECT_COLORS: Record<string, string> = {
  Math: 'bg-blue-100 text-blue-700',
  English: 'bg-purple-100 text-purple-700',
  Art: 'bg-pink-100 text-pink-700',
  Music: 'bg-amber-100 text-amber-700',
  Science: 'bg-emerald-100 text-emerald-700',
  Play: 'bg-sky-100 text-sky-700',
  Story: 'bg-rose-100 text-rose-700',
  Dance: 'bg-indigo-100 text-indigo-700',
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = params.id as string;
  const defaultTab = searchParams.get('tab') || 'profile';

  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date());

  // Dialog states
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [incrementDialogOpen, setIncrementDialogOpen] = useState(false);

  // Salary processing form
  const [salaryForm, setSalaryForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    hra: 0,
    da: 0,
    pfDeduction: 0,
    taxDeduction: 0,
    otherDeductions: 0,
    deductionReason: '',
    bonus: 0,
    bonusReason: '',
    paymentMethod: 'Bank Transfer',
    paymentDate: new Date(),
  });

  // Leave form
  const [leaveForm, setLeaveForm] = useState({
    leaveType: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    reason: '',
  });

  // Review form
  const [reviewForm, setReviewForm] = useState({
    period: '',
    teachingQuality: 3,
    studentEngagement: 3,
    communication: 3,
    punctuality: 3,
    professionalDev: 3,
    comments: '',
  });

  // Increment form
  const [incrementForm, setIncrementForm] = useState({
    newSalary: 0,
    reason: '',
    effectiveDate: new Date(),
  });

  // ── Fetch teacher ──
  const fetchTeacher = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/teachers/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTeacher(data.teacher);
        // Pre-fill salary form
        if (data.teacher.salary) {
          setSalaryForm((prev) => ({ ...prev, basicSalary: data.teacher.salary }));
        }
        setIncrementForm((prev) => ({ ...prev, newSalary: data.teacher.salary || 0 }));
      }
    } catch (err) {
      console.error('Failed to fetch teacher:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  // ── Delete handler ──
  const handleDelete = async () => {
    if (!teacher) return;
    if (!confirm(`Deactivate ${teacher.firstName} ${teacher.lastName}?`)) return;
    try {
      const token = getToken();
      await fetch(`/api/teachers/${teacher.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/admin/teachers');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // ── Process Salary ──
  const handleProcessSalary = async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/teachers/${teacherId}/salary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(salaryForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process salary');
      }
      setSalaryDialogOpen(false);
      fetchTeacher();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process salary');
    }
  };

  // ── Apply Leave ──
  const handleApplyLeave = async () => {
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      alert('All fields are required');
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`/api/teachers/${teacherId}/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveType: leaveForm.leaveType,
          startDate: leaveForm.startDate.toISOString(),
          endDate: leaveForm.endDate.toISOString(),
          reason: leaveForm.reason,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to apply leave');
      }
      setLeaveDialogOpen(false);
      setLeaveForm({ leaveType: '', startDate: null, endDate: null, reason: '' });
      fetchTeacher();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to apply leave');
    }
  };

  // ── Approve/Reject Leave ──
  const handleLeaveAction = async (leaveId: string, status: string) => {
    try {
      const token = getToken();
      await fetch(`/api/teachers/${teacherId}/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      fetchTeacher();
    } catch (err) {
      console.error('Leave action failed:', err);
    }
  };

  // ── Add Review ──
  const handleAddReview = async () => {
    if (!reviewForm.period) {
      alert('Period is required');
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`/api/teachers/${teacherId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add review');
      }
      setReviewDialogOpen(false);
      setReviewForm({
        period: '',
        teachingQuality: 3,
        studentEngagement: 3,
        communication: 3,
        punctuality: 3,
        professionalDev: 3,
        comments: '',
      });
      fetchTeacher();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add review');
    }
  };

  // ── Apply Salary Increment ──
  const handleIncrement = async () => {
    try {
      const token = getToken();
      await fetch(`/api/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ salary: incrementForm.newSalary }),
      });
      setIncrementDialogOpen(false);
      fetchTeacher();
    } catch (err) {
      console.error('Increment failed:', err);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Teacher not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/teachers')}>
          Back to Teachers
        </Button>
      </div>
    );
  }

  // ── Attendance stats for current month ──
  const monthAttendance = teacher.staffAttendance.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === attendanceMonth.getMonth() && d.getFullYear() === attendanceMonth.getFullYear();
  });
  const presentDays = monthAttendance.filter((a) => a.status === 'PRESENT').length;
  const absentDays = monthAttendance.filter((a) => a.status === 'ABSENT').length;
  const lateDays = monthAttendance.filter((a) => a.status === 'LATE').length;
  const attendanceRate = monthAttendance.length > 0
    ? Math.round(((presentDays + lateDays) / monthAttendance.length) * 100)
    : 0;

  // ── Calendar grid for attendance ──
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const renderAttendanceCalendar = () => {
    const { firstDay, daysInMonth } = getDaysInMonth(attendanceMonth);
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = format(new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth(), d), 'yyyy-MM-dd');
      const record = monthAttendance.find((a) => format(new Date(a.date), 'yyyy-MM-dd') === dateStr);
      let bgColor = 'bg-gray-50';
      if (record) {
        if (record.status === 'PRESENT') bgColor = 'bg-emerald-100 text-emerald-700';
        else if (record.status === 'ABSENT') bgColor = 'bg-red-100 text-red-700';
        else if (record.status === 'LATE') bgColor = 'bg-amber-100 text-amber-700';
      }
      days.push(
        <div key={d} className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-medium ${bgColor}`}>
          {d}
        </div>
      );
    }
    return days;
  };

  // ── Build schedule grid ──
  const getScheduleForSlot = (dayOfWeek: number, timeIndex: number) => {
    const hour = 8 + timeIndex;
    const timeStart = `${hour.toString().padStart(2, '0')}:00`;
    return teacher.workSchedules.find(
      (s) => s.dayOfWeek === dayOfWeek && s.startTime === timeStart && s.subject
    );
  };

  // ── Star display ──
  const StarDisplay = ({ rating, max = 5 }: { rating: number; max?: number }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );

  // ── Net pay calculation ──
  const calculatedNetPay = salaryForm.basicSalary + salaryForm.hra + salaryForm.da - salaryForm.pfDeduction - salaryForm.taxDeduction - salaryForm.otherDeductions + salaryForm.bonus;

  return (
    <div className="space-y-6">
      {/* ── Back Button ── */}
      <Button
        variant="ghost"
        className="gap-1 text-muted-foreground"
        onClick={() => router.push('/admin/teachers')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Teachers
      </Button>

      {/* ── Profile Header ── */}
      <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-purple-50 text-purple-700 text-2xl font-bold">
              {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {teacher.firstName} {teacher.lastName}
              </h1>
              {teacher.qualification && (
                <Badge variant="secondary" className="gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {teacher.qualification}
                </Badge>
              )}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${STATUS_COLORS[teacher.status]}`}>
                {STATUS_LABELS[teacher.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {teacher.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {teacher.phone}</span>
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {teacher.experience} yrs experience</span>
              {teacher.assignedClass && (
                <span>Class: {teacher.assignedClass.name}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Deactivate
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* ═══════════ Tab 1: Profile ═══════════ */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-500" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium">{teacher.dob ? format(new Date(teacher.dob), 'dd MMM yyyy') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-sm font-medium">{teacher.gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> {teacher.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium flex items-center gap-1"><Mail className="h-3 w-3" /> {teacher.email}</p>
                  </div>
                </div>
                {teacher.address && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Address</p>
                      <p className="text-sm flex items-start gap-1"><MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" /> {teacher.address}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-sky-500" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Qualification</p>
                    <p className="text-sm font-medium">{teacher.qualification || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Specialization</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {teacher.specialization
                        ? teacher.specialization.split(', ').map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))
                        : <span className="text-sm">—</span>
                      }
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="text-sm font-medium">{teacher.experience} years</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joining Date</p>
                    <p className="text-sm font-medium">{format(new Date(teacher.joiningDate), 'dd MMM yyyy')}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Class</p>
                  {teacher.assignedClass ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary">{teacher.assignedClass.name}</Badge>
                      {teacher.assignedClass.capacity && (
                        <span className="text-xs text-muted-foreground">Capacity: {teacher.assignedClass.capacity}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-0.5">No class assigned</p>
                  )}
                </div>
                {teacher.salary && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Salary</p>
                      <p className="text-lg font-bold text-purple-700">₹{teacher.salary.toLocaleString('en-IN')}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════ Tab 2: Schedule ═══════════ */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Weekly Timetable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Day</TableHead>
                      {TIME_SLOTS.map((slot) => (
                        <TableHead key={slot} className="text-center min-w-[100px]">{slot}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DAYS.map((day, dayIdx) => (
                      <TableRow key={day}>
                        <TableCell className="font-medium text-sm">{day}</TableCell>
                        {TIME_SLOTS.map((_, timeIdx) => {
                          const schedule = getScheduleForSlot(dayIdx + 1, timeIdx);
                          return (
                            <TableCell key={timeIdx} className="text-center p-1">
                              {schedule?.subject ? (
                                <div className={cn(
                                  'rounded-lg px-2 py-1.5 text-xs font-medium',
                                  SUBJECT_COLORS[schedule.subject] || 'bg-gray-100 text-gray-700'
                                )}>
                                  {schedule.subject}
                                </div>
                              ) : (
                                <div className="h-8" />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {teacher.workSchedules.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No schedule configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ Tab 3: Attendance ═══════════ */}
        <TabsContent value="attendance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Attendance Calendar</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAttendanceMonth(new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth() - 1))}
                  >
                    ←
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {format(attendanceMonth, 'MMMM yyyy')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAttendanceMonth(new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth() + 1))}
                  >
                    →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="h-9 flex items-center justify-center text-xs font-medium text-muted-foreground">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderAttendanceCalendar()}
                </div>
                <div className="flex gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-emerald-100" /> Present</div>
                  <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-red-100" /> Absent</div>
                  <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-amber-100" /> Late</div>
                  <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-gray-50" /> No Data</div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Present Days</p>
                  <p className="text-2xl font-bold text-emerald-600">{presentDays}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Absent Days</p>
                  <p className="text-2xl font-bold text-red-600">{absentDays}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Late Days</p>
                  <p className="text-2xl font-bold text-amber-600">{lateDays}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{attendanceRate}%</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════ Tab 4: Salary ═══════════ */}
        <TabsContent value="salary">
          <div className="space-y-6">
            {/* Current Salary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Current Monthly Salary</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ₹{(teacher.salary || 0).toLocaleString('en-IN')}
                  </p>
                </CardContent>
              </Card>
              <Card className="flex items-center justify-center">
                <Button
                  className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                  onClick={() => setSalaryDialogOpen(true)}
                >
                  <IndianRupee className="h-4 w-4" />
                  Process Salary
                </Button>
              </Card>
              <Card className="flex items-center justify-center">
                <Button variant="outline" className="gap-2" onClick={() => setIncrementDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Increment
                </Button>
              </Card>
            </div>

            {/* Salary History Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Salary History</CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.salaries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No salary records found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Basic</TableHead>
                          <TableHead>HRA</TableHead>
                          <TableHead>DA</TableHead>
                          <TableHead>Deductions</TableHead>
                          <TableHead>Bonus</TableHead>
                          <TableHead>Net Pay</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Paid Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacher.salaries.map((sal) => {
                          const totalDeductions = sal.pfDeduction + sal.taxDeduction + sal.otherDeductions;
                          return (
                            <TableRow key={sal.id}>
                              <TableCell className="font-medium">
                                {MONTHS[sal.month - 1]} {sal.year}
                              </TableCell>
                              <TableCell>₹{sal.basicSalary.toLocaleString('en-IN')}</TableCell>
                              <TableCell>₹{sal.hra.toLocaleString('en-IN')}</TableCell>
                              <TableCell>₹{sal.da.toLocaleString('en-IN')}</TableCell>
                              <TableCell className="text-red-600">
                                ₹{totalDeductions.toLocaleString('en-IN')}
                              </TableCell>
                              <TableCell className="text-emerald-600">
                                {sal.bonus > 0 ? `₹${sal.bonus.toLocaleString('en-IN')}` : '—'}
                              </TableCell>
                              <TableCell className="font-bold">₹{sal.netPay.toLocaleString('en-IN')}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${SALARY_STATUS_COLORS[sal.status] || ''}`}>
                                  {sal.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {sal.paymentDate ? format(new Date(sal.paymentDate), 'dd MMM yyyy') : '—'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════ Tab 5: Leaves ═══════════ */}
        <TabsContent value="leaves">
          <div className="space-y-6">
            {/* Leave Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Casual Leave</p>
                  <p className="text-2xl font-bold text-sky-600">12</p>
                  <p className="text-xs text-muted-foreground">Available this year</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Sick Leave</p>
                  <p className="text-2xl font-bold text-red-600">10</p>
                  <p className="text-xs text-muted-foreground">Available this year</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Earned Leave</p>
                  <p className="text-2xl font-bold text-purple-600">15</p>
                  <p className="text-xs text-muted-foreground">Available this year</p>
                </CardContent>
              </Card>
            </div>

            {/* Apply Leave Button */}
            <div className="flex justify-end">
              <Button
                className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                onClick={() => setLeaveDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Apply Leave
              </Button>
            </div>

            {/* Leaves Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leave History</CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.leaves.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No leaves found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacher.leaves.map((leave) => {
                          const days = Math.ceil(
                            (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)
                          ) + 1;
                          return (
                            <TableRow key={leave.id}>
                              <TableCell>
                                <Badge variant="secondary">{LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}</Badge>
                              </TableCell>
                              <TableCell>{format(new Date(leave.startDate), 'dd MMM yyyy')}</TableCell>
                              <TableCell>{format(new Date(leave.endDate), 'dd MMM yyyy')}</TableCell>
                              <TableCell>{days}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${LEAVE_STATUS_COLORS[leave.status] || ''}`}>
                                  {leave.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {leave.status === 'PENDING' && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700"
                                      onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                                      onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" /> Reject
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════ Tab 6: Performance ═══════════ */}
        <TabsContent value="performance">
          <div className="space-y-6">
            {/* Overall Rating Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Overall Rating</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-bold text-purple-700">
                        {teacher.reviews.length > 0
                          ? (teacher.reviews.reduce((sum, r) => sum + r.overallRating, 0) / teacher.reviews.length).toFixed(1)
                          : '—'}
                      </span>
                      {teacher.reviews.length > 0 && (
                        <StarDisplay rating={teacher.reviews.reduce((sum, r) => sum + r.overallRating, 0) / teacher.reviews.length} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex items-center justify-center">
                <Button
                  className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                  onClick={() => setReviewDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Review
                </Button>
              </Card>
            </div>

            {/* Review History */}
            {teacher.reviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No performance reviews yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teacher.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{review.period}</CardTitle>
                        <div className="flex items-center gap-1">
                          <StarDisplay rating={review.overallRating} />
                          <span className="text-sm font-bold ml-1">{review.overallRating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.reviewDate), 'dd MMM yyyy')}
                        {review.reviewerName && ` • by ${review.reviewerName}`}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Teaching</span>
                          <StarDisplay rating={review.teachingQuality} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Engagement</span>
                          <StarDisplay rating={review.studentEngagement} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Communication</span>
                          <StarDisplay rating={review.communication} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Punctuality</span>
                          <StarDisplay rating={review.punctuality} />
                        </div>
                        <div className="flex items-center justify-between col-span-2">
                          <span className="text-muted-foreground">Professional Dev</span>
                          <StarDisplay rating={review.professionalDev} />
                        </div>
                      </div>
                      {review.comments && (
                        <>
                          <Separator />
                          <p className="text-sm text-muted-foreground">{review.comments}</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════ Salary Processing Dialog ═══════════ */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Salary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Month</Label>
                <Select
                  value={salaryForm.month.toString()}
                  onValueChange={(v) => setSalaryForm((p) => ({ ...p, month: parseInt(v) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={salaryForm.year}
                  onChange={(e) => setSalaryForm((p) => ({ ...p, year: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Basic Salary (₹)</Label>
                <Input
                  type="number"
                  value={salaryForm.basicSalary}
                  onChange={(e) => setSalaryForm((p) => ({ ...p, basicSalary: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>HRA (₹)</Label>
                <Input
                  type="number"
                  value={salaryForm.hra}
                  onChange={(e) => setSalaryForm((p) => ({ ...p, hra: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>DA (₹)</Label>
                <Input
                  type="number"
                  value={salaryForm.da}
                  onChange={(e) => setSalaryForm((p) => ({ ...p, da: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>PF Deduction (₹)</Label>
                <Input
                  type="number"
                  value={salaryForm.pfDeduction}
                  onChange={(e) => setSalaryForm((p) => ({ ...p, pfDeduction: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Tax Deduction (₹)</Label>
                <Input
                  type="number"
                  value={salaryForm.taxDeduction}
                  onChange={(e) => setSalaryForm((p) => ({ ...p, taxDeduction: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Other Deductions (₹)</Label>
                <Input
                  type="number"
                  value={salaryForm.otherDeductions}
                  onChange={(e) => setSalaryForm((p) => ({ ...p, otherDeductions: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              {salaryForm.otherDeductions > 0 && (
                <div className="col-span-2">
                  <Label>Deduction Reason</Label>
                  <Input
                    value={salaryForm.deductionReason}
                    onChange={(e) => setSalaryForm((p) => ({ ...p, deductionReason: e.target.value }))}
                    placeholder="Reason for deductions"
                  />
                </div>
              )}
              <div>
                <Label>Bonus (₹)</Label>
                <Input
                  type="number"
                  value={salaryForm.bonus}
                  onChange={(e) => setSalaryForm((p) => ({ ...p, bonus: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              {salaryForm.bonus > 0 && (
                <div>
                  <Label>Bonus Reason</Label>
                  <Input
                    value={salaryForm.bonusReason}
                    onChange={(e) => setSalaryForm((p) => ({ ...p, bonusReason: e.target.value }))}
                    placeholder="Reason for bonus"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Net Pay Display */}
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 text-center">
              <p className="text-xs text-muted-foreground">Net Pay</p>
              <p className="text-2xl font-bold text-purple-700">₹{calculatedNetPay.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">
                Basic + HRA + DA - PF - Tax - Other + Bonus
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={salaryForm.paymentMethod}
                  onValueChange={(v) => setSalaryForm((p) => ({ ...p, paymentMethod: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {format(salaryForm.paymentDate, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={salaryForm.paymentDate}
                      onSelect={(d) => d && setSalaryForm((p) => ({ ...p, paymentDate: d }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setSalaryDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
              onClick={handleProcessSalary}
            >
              Process Salary
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Apply Leave Dialog ═══════════ */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Leave Type *</Label>
              <Select
                value={leaveForm.leaveType}
                onValueChange={(v) => setLeaveForm((p) => ({ ...p, leaveType: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAVE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !leaveForm.startDate && 'text-muted-foreground')}>
                      {leaveForm.startDate ? format(leaveForm.startDate, 'dd MMM yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={leaveForm.startDate || undefined} onSelect={(d) => setLeaveForm((p) => ({ ...p, startDate: d }))} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !leaveForm.endDate && 'text-muted-foreground')}>
                      {leaveForm.endDate ? format(leaveForm.endDate, 'dd MMM yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={leaveForm.endDate || undefined} onSelect={(d) => setLeaveForm((p) => ({ ...p, endDate: d }))} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Reason for leave"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover" onClick={handleApplyLeave}>
              Apply Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Add Review Dialog ═══════════ */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Performance Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Period *</Label>
              <Select
                value={reviewForm.period}
                onValueChange={(v) => setReviewForm((p) => ({ ...p, period: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {[
              { key: 'teachingQuality', label: 'Teaching Quality' },
              { key: 'studentEngagement', label: 'Student Engagement' },
              { key: 'communication', label: 'Communication' },
              { key: 'punctuality', label: 'Punctuality' },
              { key: 'professionalDev', label: 'Professional Development' },
            ].map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <Label>{label}</Label>
                  <span className="text-sm font-bold text-purple-700">
                    {reviewForm[key as keyof typeof reviewForm] as number}/5
                  </span>
                </div>
                <Slider
                  value={[reviewForm[key as keyof typeof reviewForm] as number]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(v) => setReviewForm((p) => ({ ...p, [key]: v[0] }))}
                  className="mt-2"
                />
              </div>
            ))}

            <div>
              <Label>Comments</Label>
              <Textarea
                value={reviewForm.comments}
                onChange={(e) => setReviewForm((p) => ({ ...p, comments: e.target.value }))}
                placeholder="Additional comments..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover" onClick={handleAddReview}>
              Add Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Add Increment Dialog ═══════════ */}
      <Dialog open={incrementDialogOpen} onOpenChange={setIncrementDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Salary Increment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Salary</Label>
              <p className="text-lg font-bold text-muted-foreground">₹{(teacher.salary || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <Label>New Salary (₹) *</Label>
              <Input
                type="number"
                value={incrementForm.newSalary || ''}
                onChange={(e) => setIncrementForm((p) => ({ ...p, newSalary: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={incrementForm.reason}
                onChange={(e) => setIncrementForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Annual increment, promotion..."
              />
            </div>
            <div>
              <Label>Effective Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {format(incrementForm.effectiveDate, 'dd MMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={incrementForm.effectiveDate}
                    onSelect={(d) => d && setIncrementForm((p) => ({ ...p, effectiveDate: d }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIncrementDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover" onClick={handleIncrement}>
              Apply Increment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
