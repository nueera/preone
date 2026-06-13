'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  GraduationCap,
  Users,
  MapPin,
  Clock,
  Calendar,
  BarChart3,
  BookOpen,
  Pencil,
  UserCheck,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;

// ── Types ──
interface TeacherInfo {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
}

interface ClassData {
  id: string;
  name: string;
  section?: string | null;
  capacity: number;
  roomNo?: string | null;
  program: { id: string; name: string };
  teacher?: TeacherInfo | null;
  _count: { students: number; activities: number };
}

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber?: string | null;
  photo?: string | null;
  status: string;
}

interface ActivityInfo {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  student: { id: string; firstName: string; lastName: string };
}

// ── Program badge colors ──
const PROGRAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Playgroup: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  Nursery:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  LKG:       { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  UKG:       { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-red-50 text-red-700 border-red-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  EXCUSED: 'bg-sky-50 text-sky-700 border-sky-200',
};

// ── Auth helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [activities, setActivities] = useState<ActivityInfo[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceRate, setAttendanceRate] = useState(0);

  // ── Fetch class data ──
  const fetchClassData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();

      // Fetch class info from /api/classes
      const classRes = await fetch('/api/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (classRes.ok) {
        const classData = await classRes.json();
        const found = (classData.classes || []).find((c: ClassData) => c.id === classId);
        if (found) {
          setClassData(found);
        }
      }

      // Fetch students in this class
      const studentsRes = await fetch(`/api/students?classId=${classId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || []);
      }

      // Fetch activities
      const activitiesRes = await fetch(`/api/activities?classId=${classId}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || []);
      }

      // Fetch attendance stats
      const statsRes = await fetch(`/api/attendance/stats?classId=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAttendanceRate(statsData.attendanceRate || 0);
      }
    } catch (err) {
      console.error('Failed to fetch class data:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <GraduationCap className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">Class not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/classes')}>
          Back to Classes
        </Button>
      </div>
    );
  }

  const programColors = PROGRAM_COLORS[classData.program.name] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  const occupancy = classData.capacity > 0 ? Math.round((classData._count.students / classData.capacity) * 100) : 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Back Button ── */}
        <Button
          variant="ghost"
          className="gap-1 text-muted-foreground"
          onClick={() => router.push('/admin/classes')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Button>

        {/* ── Class Info Header ── */}
        <PreOneCard variant="default">
          <PreOneCardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Class Icon */}
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-sky-100 dark:from-violet-900/30 dark:to-sky-900/30">
                <GraduationCap className="h-8 w-8 text-portal-600" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {classData.name}
                  </h1>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${programColors.bg} ${programColors.text} ${programColors.border}`}>
                    {classData.program.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                  {classData.teacher && (
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" />
                      {classData.teacher.firstName} {classData.teacher.lastName}
                    </span>
                  )}
                  {classData.roomNo && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Room {classData.roomNo}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Mon–Fri, 9:00 AM – 1:00 PM
                  </span>
                </div>
              </div>

              <Button variant="outline" size="sm" className="gap-1">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          </PreOneCardContent>
        </PreOneCard>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Students"
            value={classData._count.students}
            suffix={`/${classData.capacity}`}
            icon={<Users className="h-5 w-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Attendance Rate"
            value={attendanceRate}
            suffix="%"
            icon={<UserCheck className="h-5 w-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Activities"
            value={classData._count.activities || activities.length}
            icon={<BookOpen className="h-5 w-5" />}
            color="bg-sky-500"
          />
          <CosmicStatCard
            label="Capacity Used"
            value={occupancy}
            suffix="%"
            icon={<BarChart3 className="h-5 w-5" />}
            color="bg-amber-500"
          />
        </div>

        {/* ── Capacity Bar ── */}
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Class Capacity
            </span>
            <span className="text-sm text-muted-foreground">
              {classData._count.students} of {classData.capacity} seats filled
            </span>
          </div>
          <Progress value={occupancy} className="h-2" />
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="students" className="gap-1.5">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5">
              <Clock className="h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Students ── */}
          <TabsContent value="students">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Students in {classData.name}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => router.push(`/admin/classes/${classId}/students`)}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No students enrolled yet</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {students.slice(0, 9).map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => router.push(`/admin/students/${student.id}`)}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-portal-50 text-portal-700 text-xs font-semibold">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.rollNumber ? `#${student.rollNumber}` : 'No roll no.'}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${student.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}
                        >
                          {student.status === 'ACTIVE' ? 'Active' : student.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Attendance ── */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Attendance Overview</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => router.push(`/admin/classes/${classId}/attendance`)}
                >
                  Mark Attendance
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 py-8">
                  {/* Attendance Rate Circle */}
                  <div className="flex-shrink-0 w-32 h-32 rounded-full border-4 border-emerald-200 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-600">{attendanceRate}%</p>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-sm">Late</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-sky-500" />
                      <span className="text-sm">Excused</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Activities ── */}
          <TabsContent value="activities">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Activities</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => router.push(`/admin/classes/${classId}/activities`)}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activities scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {activity.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.type} &middot; {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${activity.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : activity.status === 'UPCOMING' ? 'bg-sky-50 text-sky-700' : 'bg-gray-50 text-gray-600'}`}
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Schedule ── */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-portal-500" />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-3 text-left text-muted-foreground font-medium">Day</th>
                        <th className="py-2 px-3 text-left text-muted-foreground font-medium">9:00 AM</th>
                        <th className="py-2 px-3 text-left text-muted-foreground font-medium">10:00 AM</th>
                        <th className="py-2 px-3 text-left text-muted-foreground font-medium">11:00 AM</th>
                        <th className="py-2 px-3 text-left text-muted-foreground font-medium">12:00 PM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                        <tr key={day} className="border-b last:border-0">
                          <td className="py-3 px-3 font-medium">{day}</td>
                          <td className="py-3 px-3"><span className="rounded-lg px-2 py-1 text-xs font-medium bg-violet-100 text-violet-700">Circle Time</span></td>
                          <td className="py-3 px-3"><span className="rounded-lg px-2 py-1 text-xs font-medium bg-sky-100 text-sky-700">Learning</span></td>
                          <td className="py-3 px-3"><span className="rounded-lg px-2 py-1 text-xs font-medium bg-pink-100 text-pink-700">Art & Craft</span></td>
                          <td className="py-3 px-3"><span className="rounded-lg px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700">Outdoor Play</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
