'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Pencil,
  ArrowRightLeft,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Heart,
  Shield,
  Calendar,
  User,
  Droplet,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TransferStudentDialog } from '@/components/transfer-student-dialog';
import { PORTAL_THEMES, CHART_PALETTE } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ── Types ──
interface ClassInfo {
  id: string;
  name: string;
  roomNo?: string;
  program: { id: string; name: string; ageMin: number; ageMax: number };
  teacher?: { id: string; firstName: string; lastName: string } | null;
}

interface ParentInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  occupation?: string | null;
  relation: string;
  isEmergencyContact: boolean;
  address?: string | null;
}

interface StudentParent {
  isPrimary: boolean;
  parent: ParentInfo;
}

interface MedicalRecord {
  id: string;
  allergies?: string | null;
  conditions?: string | null;
  medications?: string | null;
  vaccinationStatus?: string | null;
  doctorName?: string | null;
  doctorPhone?: string | null;
  notes?: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

interface InvoiceInfo {
  id: string;
  invoiceNo: string;
  amount: number;
  discount: number;
  netAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paidDate?: string | null;
  description?: string | null;
  payments: PaymentInfo[];
}

interface PaymentInfo {
  id: string;
  amount: number;
  method: string;
  transactionRef?: string | null;
  paymentDate: string;
}

interface GrowthScoreInfo {
  id: string;
  period: string;
  creativity: number;
  communication: number;
  social: number;
  confidence: number;
  cognitive: number;
  physical: number;
  overall?: number | null;
  comments?: string | null;
  assessedBy?: string | null;
  createdAt: string;
}

interface DailyUpdateInfo {
  id: string;
  date: string;
  breakfast?: string | null;
  breakfastMenu?: string | null;
  lunch?: string | null;
  lunchMenu?: string | null;
  snacks?: string | null;
  snacksMenu?: string | null;
  sleepStart?: string | null;
  sleepEnd?: string | null;
  sleepQuality?: string | null;
  moodMorning?: string | null;
  moodAfternoon?: string | null;
  pottyCount: number;
  pottyType?: string | null;
  waterGlasses: number;
  highlights?: string | null;
  status: string;
}

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  bloodGroup?: string | null;
  aadhaarNumber?: string | null;
  photo?: string | null;
  admissionDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  rollNumber?: string | null;
  classId?: string | null;
  branchId?: string | null;
  class: ClassInfo | null;
  branch?: { id: string; name: string } | null;
  parents: StudentParent[];
  medicalRecords: MedicalRecord[];
  attendance: AttendanceRecord[];
  invoices: InvoiceInfo[];
  payments: PaymentInfo[];
  growthScores: GrowthScoreInfo[];
  dailyUpdates: DailyUpdateInfo[];
  _count: {
    attendance: number;
    invoices: number;
    observations: number;
    memories: number;
    achievements: number;
  };
}

// ── Status badge ──
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-gray-50 text-gray-600 border-gray-200',
  GRADUATED: 'bg-sky-50 text-sky-700 border-sky-200',
  TRANSFERRED: 'bg-amber-50 text-amber-700 border-amber-200',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PARTIAL: 'bg-sky-50 text-sky-700 border-sky-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OVERDUE: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-gray-50 text-gray-600 border-gray-200',
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date());

  // ── Fetch student ──
  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
      }
    } catch (err) {
      console.error('Failed to fetch student:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  // ── Delete handler ──
  const handleDelete = async () => {
    if (!student) return;
    if (!confirm(`Deactivate ${student.firstName} ${student.lastName}?`)) return;
    try {
      const token = getToken();
      await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/admin/students');
    } catch (err) {
      console.error('Delete failed:', err);
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

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Student not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/students')}>
          Back to Students
        </Button>
      </div>
    );
  }

  const primaryParent = student.parents.find((p) => p.isPrimary)?.parent;
  const mother = student.parents.find((p) => p.parent.relation === 'Mother')?.parent;
  const father = student.parents.find((p) => p.parent.relation === 'Father')?.parent;

  // ── Attendance stats for current month ──
  const monthAttendance = student.attendance.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === attendanceMonth.getMonth() && d.getFullYear() === attendanceMonth.getFullYear();
  });
  const presentDays = monthAttendance.filter((a) => a.status === 'PRESENT').length;
  const absentDays = monthAttendance.filter((a) => a.status === 'ABSENT').length;
  const lateDays = monthAttendance.filter((a) => a.status === 'LATE').length;
  const attendanceRate = monthAttendance.length > 0
    ? Math.round(((presentDays + lateDays) / monthAttendance.length) * 100)
    : 0;

  // ── Fee stats ──
  const totalFees = student.invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
  const totalPaid = student.invoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0),
    0
  );
  const totalPending = totalFees - totalPaid;

  // ── Growth radar data ──
  const latestGrowth = student.growthScores[0];
  const growthRadarData = latestGrowth
    ? [
        { dimension: 'Creativity', student: latestGrowth.creativity, average: 65 },
        { dimension: 'Communication', student: latestGrowth.communication, average: 60 },
        { dimension: 'Social', student: latestGrowth.social, average: 70 },
        { dimension: 'Confidence', student: latestGrowth.confidence, average: 55 },
        { dimension: 'Cognitive', student: latestGrowth.cognitive, average: 62 },
        { dimension: 'Physical', student: latestGrowth.physical, average: 68 },
      ]
    : [];

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
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }
    // Day cells
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
        <div
          key={d}
          className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-medium ${bgColor}`}
        >
          {d}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6">
      {/* ── Back Button ── */}
      <Button
        variant="ghost"
        className="gap-1 text-muted-foreground"
        onClick={() => router.push('/admin/students')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Button>

      {/* ── Profile Header ── */}
      <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-portal-50 text-portal-700 text-2xl font-bold">
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {student.firstName} {student.lastName}
              </h1>
              {student.class && (
                <Badge variant="secondary">{student.class.name}</Badge>
              )}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${STATUS_COLORS[student.status]}`}>
                {student.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
              {student.rollNumber && <span>Roll No: {student.rollNumber}</span>}
              <span>Admitted: {format(new Date(student.admissionDate), 'dd MMM yyyy')}</span>
              <span>DOB: {format(new Date(student.dob), 'dd MMM yyyy')}</span>
              <span>Gender: {student.gender}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => router.push(`/admin/students/${student.id}`)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setTransferDialogOpen(true)}>
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Transfer
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="daily">Daily Updates</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Profile ── */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-portal-500" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium">{format(new Date(student.dob), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-sm font-medium">{student.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Blood Group</p>
                    <p className="text-sm font-medium">{student.bloodGroup || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Aadhaar Number</p>
                    <p className="text-sm font-medium">{student.aadhaarNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Roll Number</p>
                    <p className="text-sm font-medium">{student.rollNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Admission Date</p>
                    <p className="text-sm font-medium">{format(new Date(student.admissionDate), 'dd MMM yyyy')}</p>
                  </div>
                </div>
                {student.class && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Class</p>
                      <p className="text-sm font-medium">
                        {student.class.name} ({student.class.program?.name || 'No Program'})
                      </p>
                      {student.class.teacher && (
                        <p className="text-xs text-muted-foreground">
                          Teacher: {student.class.teacher.firstName} {student.class.teacher.lastName}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Parent Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Parent / Guardian
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {father && (
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-sm font-semibold text-portal-700">Father</p>
                    <p className="text-sm">{father.firstName} {father.lastName}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {father.phone}
                    </div>
                    {father.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {father.email}
                      </div>
                    )}
                    {father.occupation && (
                      <p className="text-xs text-muted-foreground">{father.occupation}</p>
                    )}
                  </div>
                )}
                {mother && (
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-sm font-semibold text-portal-700">Mother</p>
                    <p className="text-sm">{mother.firstName} {mother.lastName}</p>
                    {mother.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {mother.phone}
                      </div>
                    )}
                    {mother.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {mother.email}
                      </div>
                    )}
                    {mother.occupation && (
                      <p className="text-xs text-muted-foreground">{mother.occupation}</p>
                    )}
                  </div>
                )}
                {primaryParent?.address && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Address</p>
                      <div className="flex items-start gap-1 text-sm">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                        {primaryParent.address}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 2: Attendance ── */}
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
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="h-9 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderAttendanceCalendar()}
                </div>
                {/* Legend */}
                <div className="flex gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-emerald-100" /> Present
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-red-100" /> Absent
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-amber-100" /> Late
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-gray-50" /> No Data
                  </div>
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
                  <p className="text-2xl font-bold text-portal-600">{attendanceRate}%</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 3: Fees ── */}
        <TabsContent value="fees">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Fees</p>
                  <p className="text-2xl font-bold">₹{totalFees.toLocaleString('en-IN')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalPending.toLocaleString('en-IN')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Invoice Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {student.invoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No invoices found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Net Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Paid Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                            <TableCell>₹{inv.amount.toLocaleString('en-IN')}</TableCell>
                            <TableCell>₹{inv.discount.toLocaleString('en-IN')}</TableCell>
                            <TableCell className="font-medium">₹{inv.netAmount.toLocaleString('en-IN')}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${INVOICE_STATUS_COLORS[inv.status]}`}>
                                {inv.status}
                              </span>
                            </TableCell>
                            <TableCell>{format(new Date(inv.dueDate), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{inv.paidDate ? format(new Date(inv.paidDate), 'dd MMM yyyy') : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {student.payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payments found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{format(new Date(p.paymentDate), 'dd MMM yyyy')}</TableCell>
                            <TableCell className="font-medium">₹{p.amount.toLocaleString('en-IN')}</TableCell>
                            <TableCell>{p.method}</TableCell>
                            <TableCell>{p.transactionRef || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 4: Growth ── */}
        <TabsContent value="growth">
          <div className="space-y-6">
            {student.growthScores.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No growth assessments recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Radar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Growth Assessment — {latestGrowth?.period || 'Latest'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={growthRadarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar
                            name="Student"
                            dataKey="student"
                            stroke={CHART_PALETTE.series[0]}
                            fill={CHART_PALETTE.series[0]}
                            fillOpacity={0.25}
                          />
                          <Radar
                            name="Class Average"
                            dataKey="average"
                            stroke={CHART_PALETTE.series[1]}
                            fill={CHART_PALETTE.series[1]}
                            fillOpacity={0.1}
                          />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Score Breakdown Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead>Creativity</TableHead>
                            <TableHead>Communication</TableHead>
                            <TableHead>Social</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Cognitive</TableHead>
                            <TableHead>Physical</TableHead>
                            <TableHead>Overall</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {student.growthScores.map((gs) => (
                            <TableRow key={gs.id}>
                              <TableCell className="font-medium">{gs.period}</TableCell>
                              <TableCell>{gs.creativity}</TableCell>
                              <TableCell>{gs.communication}</TableCell>
                              <TableCell>{gs.social}</TableCell>
                              <TableCell>{gs.confidence}</TableCell>
                              <TableCell>{gs.cognitive}</TableCell>
                              <TableCell>{gs.physical}</TableCell>
                              <TableCell className="font-bold">
                                {gs.overall ? gs.overall.toFixed(1) : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 5: Medical ── */}
        <TabsContent value="medical">
          <div className="space-y-6">
            {student.medicalRecords.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No medical records found</p>
                </CardContent>
              </Card>
            ) : (
              student.medicalRecords.map((med) => (
                <Card key={med.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-portal-500" />
                      Medical Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Allergies */}
                    {med.allergies && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <p className="text-sm font-semibold text-red-700">Allergies</p>
                        </div>
                        <p className="text-sm text-red-600">{med.allergies}</p>
                      </div>
                    )}

                    {/* Conditions */}
                    {med.conditions && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Medical Conditions</p>
                        <p className="text-sm">{med.conditions}</p>
                      </div>
                    )}

                    {/* Medications */}
                    {med.medications && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Medications</p>
                        <p className="text-sm">{med.medications}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Vaccination & Doctor */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Vaccination Status</p>
                        <Badge variant={med.vaccinationStatus === 'COMPLETE' ? 'default' : 'secondary'} className="mt-1">
                          {med.vaccinationStatus || 'Unknown'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Doctor&apos;s Name</p>
                        <p className="text-sm font-medium">{med.doctorName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Doctor&apos;s Phone</p>
                        <p className="text-sm font-medium">{med.doctorPhone || '—'}</p>
                      </div>
                    </div>

                    {med.notes && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm">{med.notes}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Tab 6: Daily Updates ── */}
        <TabsContent value="daily">
          <div className="space-y-4">
            {student.dailyUpdates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No daily updates found</p>
                </CardContent>
              </Card>
            ) : (
              student.dailyUpdates.map((update) => {
                const moodEmoji = (mood: string | null | undefined) => {
                  if (!mood) return '—';
                  const map: Record<string, string> = {
                    happy: '😊',
                    sad: '😢',
                    excited: '🤩',
                    tired: '😴',
                    cranky: '😤',
                    calm: '😌',
                  };
                  return map[mood.toLowerCase()] || mood;
                };

                return (
                  <Card key={update.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {format(new Date(update.date), 'EEEE, dd MMM yyyy')}
                        </CardTitle>
                        <Badge variant={update.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                          {update.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        {/* Food */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Breakfast</p>
                          <p className="font-medium">{update.breakfast || '—'}</p>
                          {update.breakfastMenu && (
                            <p className="text-xs text-muted-foreground">{update.breakfastMenu}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Lunch</p>
                          <p className="font-medium">{update.lunch || '—'}</p>
                          {update.lunchMenu && (
                            <p className="text-xs text-muted-foreground">{update.lunchMenu}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Snacks</p>
                          <p className="font-medium">{update.snacks || '—'}</p>
                          {update.snacksMenu && (
                            <p className="text-xs text-muted-foreground">{update.snacksMenu}</p>
                          )}
                        </div>
                        {/* Sleep */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Sleep</p>
                          <p className="font-medium">
                            {update.sleepStart && update.sleepEnd
                              ? `${update.sleepStart} – ${update.sleepEnd}`
                              : '—'}
                          </p>
                          {update.sleepQuality && (
                            <p className="text-xs text-muted-foreground">
                              Quality: {update.sleepQuality}
                            </p>
                          )}
                        </div>
                        {/* Mood */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Morning Mood</p>
                          <p className="font-medium">{moodEmoji(update.moodMorning)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Afternoon Mood</p>
                          <p className="font-medium">{moodEmoji(update.moodAfternoon)}</p>
                        </div>
                        {/* Potty & Water */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Potty</p>
                          <p className="font-medium">
                            {update.pottyCount}x {update.pottyType || ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Water</p>
                          <p className="font-medium">{update.waterGlasses} glasses</p>
                        </div>
                      </div>
                      {update.highlights && (
                        <>
                          <Separator className="my-3" />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Highlights</p>
                            <p className="text-sm">{update.highlights}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Transfer Dialog ── */}
      <TransferStudentDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        student={student}
        onTransferred={fetchStudent}
      />
    </div>
  );
}
