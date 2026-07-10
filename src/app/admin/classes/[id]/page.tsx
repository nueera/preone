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
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  WarmPremium,
  WarmCard,
  WarmCardHeader,
  WarmCardTitle,
  WarmCardDescription,
  WarmCardContent,
  WarmCardFooter,
  WarmSectionHeading,
  WarmEmptyState,
  WarmButton,
  WarmStatCard,
  WarmPill,
} from '@/components/warm-premium';

// ── Program CSS-var-based colors ──
const PROGRAM_VARS: Record<string, { color: string; bg: string }> = {
  Playgroup: { color: 'var(--admin-pink)', bg: 'var(--admin-pink-soft)' },
  Nursery:   { color: 'var(--admin-orange)', bg: 'var(--admin-orange-soft)' },
  LKG:       { color: 'var(--admin-info)', bg: 'var(--admin-info-soft)' },
  UKG:       { color: 'var(--admin-success)', bg: 'var(--admin-success-soft)' },
};

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
// (replaced with PROGRAM_VARS above)

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

  const programVars = PROGRAM_VARS[classData.program.name] || {
    color: 'var(--admin-text-muted)',
    bg: 'var(--warm-surface-2)',
  };
  const occupancy = classData.capacity > 0 ? Math.round((classData._count.students / classData.capacity) * 100) : 0;

  return (
    <WarmPremium className="min-h-screen">
    <PageTransition>
      <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
        {/* ── Back Button ── */}
        <Button
          variant="ghost"
          className="w-fit gap-1"
          style={{ color: 'var(--admin-text-muted)' }}
          onClick={() => router.push('/admin/classes')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Button>

        {/* ── Class Info Header ── */}
        <WarmCard variant="default" className="!rounded-xl">
          <WarmCardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Class Icon Badge */}
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'var(--warm-primary-soft)' }}
              >
                <GraduationCap
                  className="h-8 w-8"
                  style={{ color: 'var(--warm-primary)' }}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: 'var(--admin-text)' }}
                  >
                    {classData.name}
                  </h1>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: programVars.bg, color: programVars.color }}
                  >
                    {classData.program.name}
                  </span>
                </div>
                <div
                  className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
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

              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          </WarmCardContent>
        </WarmCard>

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
        <WarmCard className="!rounded-xl">
          <WarmCardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Class Capacity
              </span>
              <span
                className="text-sm"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {classData._count.students} of {classData.capacity} seats filled
              </span>
            </div>
            <Progress value={occupancy} className="h-2" />
          </WarmCardContent>
        </WarmCard>

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
                        className="flex items-center gap-3 p-3 rounded-xl border hover:bg-[var(--warm-surface-2)] dark:hover:bg-[var(--warm-surface-2)] cursor-pointer transition-colors"
                        onClick={() => router.push(`/admin/students/${student.id}`)}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            className="text-xs font-semibold"
                            style={{
                              background: 'var(--warm-primary-soft)',
                              color: 'var(--warm-primary)',
                            }}
                          >
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--admin-text)' }}
                          >
                            {student.firstName} {student.lastName}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--admin-text-muted)' }}
                          >
                            {student.rollNumber ? `#${student.rollNumber}` : 'No roll no.'}
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={
                            student.status === 'ACTIVE'
                              ? {
                                  background: 'var(--admin-success-soft)',
                                  color: 'var(--admin-success)',
                                }
                              : {
                                  background: 'var(--warm-surface-2)',
                                  color: 'var(--admin-text-muted)',
                                }
                          }
                        >
                          {student.status === 'ACTIVE' ? 'Active' : student.status}
                        </span>
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
                  <div
                    className="flex-shrink-0 w-32 h-32 rounded-full border-4 flex items-center justify-center"
                    style={{ borderColor: 'var(--admin-success-soft)' }}
                  >
                    <div className="text-center">
                      <p
                        className="text-3xl font-bold"
                        style={{ color: 'var(--admin-success)' }}
                      >
                        {attendanceRate}%
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        This month
                      </p>
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
                        className="flex items-center justify-between p-3 rounded-xl border hover:bg-[var(--warm-surface-2)] dark:hover:bg-[var(--warm-surface-2)] transition-colors"
                      >
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--admin-text)' }}
                          >
                            {activity.title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--admin-text-muted)' }}
                          >
                            {activity.type} &middot; {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={
                            activity.status === 'COMPLETED'
                              ? {
                                  background: 'var(--admin-success-soft)',
                                  color: 'var(--admin-success)',
                                }
                              : activity.status === 'UPCOMING'
                                ? {
                                    background: 'var(--admin-info-soft)',
                                    color: 'var(--admin-info)',
                                  }
                                : {
                                    background: 'var(--warm-surface-2)',
                                    color: 'var(--admin-text-muted)',
                                  }
                          }
                        >
                          {activity.status}
                        </span>
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
                  <Clock className="h-5 w-5" style={{ color: 'var(--warm-primary)' }} />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--warm-border)' }}>
                        <th className="py-2 px-3 text-left font-medium" style={{ color: 'var(--admin-text-muted)' }}>Day</th>
                        <th className="py-2 px-3 text-left font-medium" style={{ color: 'var(--admin-text-muted)' }}>9:00 AM</th>
                        <th className="py-2 px-3 text-left font-medium" style={{ color: 'var(--admin-text-muted)' }}>10:00 AM</th>
                        <th className="py-2 px-3 text-left font-medium" style={{ color: 'var(--admin-text-muted)' }}>11:00 AM</th>
                        <th className="py-2 px-3 text-left font-medium" style={{ color: 'var(--admin-text-muted)' }}>12:00 PM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                        <tr key={day} className="border-b last:border-0" style={{ borderColor: 'var(--warm-border)' }}>
                          <td className="py-3 px-3 font-medium" style={{ color: 'var(--admin-text)' }}>{day}</td>
                          <td className="py-3 px-3">
                            <span className="rounded-lg px-2 py-1 text-xs font-medium" style={{ background: 'var(--admin-pink-soft)', color: 'var(--admin-pink)' }}>Circle Time</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded-lg px-2 py-1 text-xs font-medium" style={{ background: 'var(--admin-info-soft)', color: 'var(--admin-info)' }}>Learning</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded-lg px-2 py-1 text-xs font-medium" style={{ background: 'var(--admin-pink-soft)', color: 'var(--admin-pink)' }}>Art &amp; Craft</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded-lg px-2 py-1 text-xs font-medium" style={{ background: 'var(--admin-success-soft)', color: 'var(--admin-success)' }}>Outdoor Play</span>
                          </td>
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
    </WarmPremium>
  );
}
