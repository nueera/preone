import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/teacher/dashboard — Teacher dashboard data
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.role !== 'Teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
    }

    // Find the teacher profile linked to this user
    const teacher = await db.teacher.findUnique({
      where: { userId: authUser.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        branchId: true,
        status: true,
        specialization: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Find the class assigned to this teacher
    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      include: {
        program: { select: { id: true, name: true, color: true, icon: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayStart = new Date(todayStr + 'T00:00:00.000Z');
    const todayEnd = new Date(todayStr + 'T23:59:59.999Z');

    // Today's schedule (activities for today)
    let todaySchedule: Array<{
      id: string;
      title: string;
      type: string;
      startTime: string | null;
      endTime: string | null;
      status: string;
    }> = [];

    if (assignedClass) {
      todaySchedule = await db.activity.findMany({
        where: {
          teacherId: teacher.id,
          date: { gte: todayStart, lte: todayEnd },
        },
        select: {
          id: true,
          title: true,
          type: true,
          startTime: true,
          endTime: true,
          status: true,
        },
        orderBy: { startTime: 'asc' },
      });
    }

    // Student count for assigned class
    const studentCount = assignedClass?._count.students ?? 0;

    // Attendance summary for today
    let attendanceSummary = {
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
    };

    if (assignedClass) {
      const todayAttendance = await db.studentAttendance.findMany({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          student: { classId: assignedClass.id },
        },
        select: { status: true },
      });

      attendanceSummary = {
        present: todayAttendance.filter(a => a.status === 'Present').length,
        absent: todayAttendance.filter(a => a.status === 'Absent').length,
        late: todayAttendance.filter(a => a.status === 'Late').length,
        total: todayAttendance.length,
      };
    }

    // Pending daily updates count (students without updates today)
    let pendingDailyUpdates = 0;
    if (assignedClass) {
      const studentsWithUpdates = await db.dailyUpdate.findMany({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          student: { classId: assignedClass.id },
        },
        select: { studentId: true },
      });
      const updatedStudentIds = new Set(studentsWithUpdates.map(u => u.studentId));
      pendingDailyUpdates = studentCount - updatedStudentIds.size;
    }

    // Recent activities (last 5)
    const recentActivities = await db.activity.findMany({
      where: { teacherId: teacher.id },
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Upcoming events (next 7 days)
    const weekLater = new Date(now);
    weekLater.setDate(weekLater.getDate() + 7);
    const upcomingEvents = await db.event.findMany({
      where: {
        branchId: teacher.branchId,
        startDate: { gte: now, lte: weekLater },
        status: 'Scheduled',
      },
      select: {
        id: true,
        title: true,
        type: true,
        startDate: true,
        endDate: true,
        location: true,
        isAllDay: true,
        color: true,
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    });

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        status: teacher.status,
        specialization: teacher.specialization,
      },
      assignedClass: assignedClass
        ? {
            id: assignedClass.id,
            name: assignedClass.name,
            capacity: assignedClass.capacity,
            roomNo: assignedClass.roomNo,
            academicYear: assignedClass.academicYear,
            program: assignedClass.program,
            branch: assignedClass.branch,
            studentCount,
          }
        : null,
      todaySchedule,
      attendanceSummary,
      pendingDailyUpdates: Math.max(0, pendingDailyUpdates),
      recentActivities,
      upcomingEvents,
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
