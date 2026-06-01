import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

// GET /api/attendance/stats — Attendance statistics
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId') || '';
    const dateParam = searchParams.get('date') || '';

    let targetDate = dateParam ? new Date(dateParam) : new Date();
    let dateStr = targetDate.toISOString().split('T')[0];

    const dateStart = new Date(dateStr + 'T00:00:00.000Z');
    const dateEnd = new Date(dateStr + 'T23:59:59.999Z');

    // If no date param and today has no data, find most recent date with attendance
    if (!dateParam) {
      const todayCount = await db.studentAttendance.count({
        where: { date: { gte: dateStart, lte: dateEnd } },
      });

      if (todayCount === 0) {
        const recentAttendance = await db.studentAttendance.findFirst({
          orderBy: { date: 'desc' },
          select: { date: true },
        });
        if (recentAttendance) {
          dateStr = recentAttendance.date.toISOString().split('T')[0];
        }
      }
    }

    const start = new Date(dateStr + 'T00:00:00.000Z');
    const end = new Date(dateStr + 'T23:59:59.999Z');

    // Student attendance stats
    const studentAttendance = await db.studentAttendance.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        student: {
          select: { branchId: true, classId: true },
        },
      },
    });

    let filteredStudentAttendance = studentAttendance;
    if (classId) {
      filteredStudentAttendance = filteredStudentAttendance.filter(a => a.student.classId === classId);
    }

    const studentPresent = filteredStudentAttendance.filter(a => a.status === 'PRESENT').length;
    const studentAbsent = filteredStudentAttendance.filter(a => a.status === 'ABSENT').length;
    const studentLate = filteredStudentAttendance.filter(a => a.status === 'LATE').length;

    const studentWhere: Record<string, unknown> = { status: 'ACTIVE' };
    if (classId) studentWhere.classId = classId;
    const totalActiveStudents = await db.student.count({ where: studentWhere });

    const unmarked = totalActiveStudents - filteredStudentAttendance.length;

    // Staff attendance stats
    const staffAttendance = await db.staffAttendance.findMany({
      where: { date: { gte: start, lte: end } },
    });

    const staffPresent = staffAttendance.filter(a => a.status === 'PRESENT').length;
    const staffAbsent = staffAttendance.filter(a => a.status === 'ABSENT').length;
    const staffLate = staffAttendance.filter(a => a.status === 'LATE').length;

    const totalActiveStaff = await db.teacher.count({
      where: { status: 'ACTIVE' },
    });
    const staffOnLeave = await db.teacher.count({
      where: { status: 'ON_LEAVE' },
    });

    // Class-wise breakdown
    const classes = await db.class.findMany({
      include: {
        _count: { select: { students: true } },
      },
    });

    const classWiseStats = classes.map(cls => {
      const classAttendance = studentAttendance.filter(a => a.student.classId === cls.id);
      const present = classAttendance.filter(a => a.status === 'PRESENT').length;
      const absent = classAttendance.filter(a => a.status === 'ABSENT').length;
      const late = classAttendance.filter(a => a.status === 'LATE').length;
      const total = cls._count.students;
      return {
        classId: cls.id,
        className: cls.name,
        total,
        present,
        absent,
        late,
        unmarked: total - classAttendance.length,
        rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      };
    });

    // Overall rate
    const overallRate = totalActiveStudents > 0
      ? Math.round(((studentPresent + studentLate) / totalActiveStudents) * 100)
      : 0;

    return NextResponse.json({
      date: dateStr,
      classes: classWiseStats,
      students: {
        total: totalActiveStudents,
        marked: filteredStudentAttendance.length,
        unmarked,
        present: studentPresent,
        absent: studentAbsent,
        late: studentLate,
        attendanceRate: overallRate,
      },
      staff: {
        total: totalActiveStaff + staffOnLeave,
        present: staffPresent,
        absent: staffAbsent,
        late: staffLate,
        onLeave: staffOnLeave,
        attendanceRate: totalActiveStaff > 0
          ? Math.round((staffPresent / totalActiveStaff) * 100)
          : 0,
      },
      overall: { rate: overallRate },
    });
  } catch (error) {
    console.error('Attendance stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
