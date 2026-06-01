import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/dashboard — Teacher dashboard data
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile linked to this user
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        photo: true,
        qualification: true,
        specialization: true,
        branchId: true,
        status: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Find the class assigned to this teacher
    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      include: {
        program: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayStart = new Date(todayStr + 'T00:00:00.000Z');
    const todayEnd = new Date(todayStr + 'T23:59:59.999Z');

    // Student count for assigned class
    const studentCount = assignedClass?._count.students ?? 0;

    // ── Attendance summary for today ──
    let attendanceSummary = { marked: false, present: 0, absent: 0, late: 0, total: 0 };

    if (assignedClass) {
      const todayAttendance = await db.studentAttendance.findMany({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          student: { classId: assignedClass.id },
        },
        select: { status: true },
      });

      attendanceSummary = {
        marked: todayAttendance.length > 0,
        present: todayAttendance.filter(a => a.status === 'PRESENT').length,
        absent: todayAttendance.filter(a => a.status === 'ABSENT').length,
        late: todayAttendance.filter(a => a.status === 'LATE').length,
        total: todayAttendance.length,
      };
    }

    // ── Today's schedule from WorkSchedule ──
    const today = now.getDay(); // 0=Sun, 1=Mon, etc.
    const workSchedules = await db.workSchedule.findMany({
      where: { teacherId: teacher.id, dayOfWeek: today },
      orderBy: { startTime: 'asc' },
    });

    // Also get activities for today
    const todayActivities = assignedClass
      ? await db.activity.findMany({
          where: {
            classId: assignedClass.id,
            date: { gte: todayStart, lte: todayEnd },
          },
          select: {
            id: true,
            title: true,
            type: true,
            startTime: true,
            endTime: true,
          },
          orderBy: { startTime: 'asc' },
        })
      : [];

    // Combine schedule items: prefer activities if they exist, otherwise use work schedule
    const todaySchedule = todayActivities.length > 0
      ? todayActivities.map(a => ({
          id: a.id,
          startTime: a.startTime || '',
          endTime: a.endTime || '',
          subject: a.title,
          type: a.type,
        }))
      : workSchedules.map(ws => ({
          id: ws.id,
          startTime: ws.startTime,
          endTime: ws.endTime,
          subject: ws.subject || 'General',
          type: 'SCHEDULE',
        }));

    // ── Stats ──
    // Pending observations (not shared with parents)
    const pendingObservations = await db.observation.count({
      where: { teacherId: teacher.id, isShared: false },
    });

    // Leaves remaining (simple calculation)
    const leavesTaken = await db.leave.findMany({
      where: {
        teacherId: teacher.id,
        status: 'APPROVED',
      },
      select: { leaveType: true, startDate: true, endDate: true },
    });

    const leaveBalance: Record<string, number> = { CASUAL: 12, SICK: 10, EARNED: 15 };
    for (const leave of leavesTaken) {
      const days = Math.ceil(
        (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      leaveBalance[leave.leaveType] = Math.max(0, (leaveBalance[leave.leaveType] || 0) - days);
    }

    // ── Recent activities (last 10) ──
    const recentActivities = assignedClass
      ? await db.activity.findMany({
          where: { classId: assignedClass.id },
          select: {
            id: true,
            title: true,
            type: true,
            date: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : [];

    // ── Pending items ──
    let dailyUpdatesPending = 0;
    if (assignedClass) {
      const studentsWithUpdates = await db.dailyUpdate.findMany({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          student: { classId: assignedClass.id },
        },
        select: { studentId: true },
      });
      const updatedStudentIds = new Set(studentsWithUpdates.map(u => u.studentId));
      dailyUpdatesPending = Math.max(0, studentCount - updatedStudentIds.size);
    }

    const leavesPendingApproval = await db.leave.count({
      where: { teacherId: teacher.id, status: 'PENDING' },
    });

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        photo: teacher.photo,
        specialization: teacher.specialization,
      },
      assignedClass: assignedClass
        ? {
            id: assignedClass.id,
            name: assignedClass.name,
            capacity: assignedClass.capacity,
            roomNo: assignedClass.roomNo,
            program: assignedClass.program,
            branch: assignedClass.branch,
            studentCount,
          }
        : null,
      stats: {
        presentToday: attendanceSummary.present,
        totalStudents: studentCount,
        activitiesToday: todayActivities.length,
        pendingObservations,
        leavesRemaining: leaveBalance,
      },
      todaySchedule,
      attendance: attendanceSummary,
      recentActivities,
      pendingItems: {
        dailyUpdatesPending,
        observationsToShare: pendingObservations,
        leavesPending: leavesPendingApproval,
      },
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
