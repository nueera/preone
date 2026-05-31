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

    // If no date param provided and today has no data, find the most recent date with attendance
    if (!dateParam) {
      const todayCount = await db.studentAttendance.count({
        where: {
          date: {
            gte: new Date(dateStr + 'T00:00:00.000Z'),
            lte: new Date(dateStr + 'T23:59:59.999Z'),
          },
        },
      });

      if (todayCount === 0) {
        const recentAttendance = await db.studentAttendance.findFirst({
          orderBy: { date: 'desc' },
          select: { date: true },
        });
        if (recentAttendance) {
          dateStr = recentAttendance.date.toISOString().split('T')[0];
          targetDate = new Date(dateStr + 'T00:00:00.000Z');
        }
      }
    }

    // Student attendance stats
    const studentAttendance = await db.studentAttendance.findMany({
      where: {
        date: {
          gte: new Date(dateStr + 'T00:00:00.000Z'),
          lte: new Date(dateStr + 'T23:59:59.999Z'),
        },
      },
      include: {
        student: {
          select: { branchId: true, classId: true },
        },
      },
    });

    // Filter by class if needed
    let filteredStudentAttendance = studentAttendance;
    if (classId) {
      filteredStudentAttendance = filteredStudentAttendance.filter(
        a => a.student.classId === classId
      );
    }

    const studentPresent = filteredStudentAttendance.filter(a => a.status === 'PRESENT').length;
    const studentAbsent = filteredStudentAttendance.filter(a => a.status === 'ABSENT').length;
    const studentLate = filteredStudentAttendance.filter(a => a.status === 'LATE').length;

    // Get total active students
    const studentWhere: Record<string, unknown> = { status: 'ACTIVE' };
    if (classId) studentWhere.classId = classId;
    const totalActiveStudents = await db.student.count({ where: studentWhere });

    const unmarked = totalActiveStudents - filteredStudentAttendance.length;

    // Staff attendance stats
    const staffAttendance = await db.staffAttendance.findMany({
      where: {
        date: {
          gte: new Date(dateStr + 'T00:00:00.000Z'),
          lte: new Date(dateStr + 'T23:59:59.999Z'),
        },
      },
    });

    const staffPresent = staffAttendance.filter(a => a.status === 'PRESENT').length;
    const staffAbsent = staffAttendance.filter(a => a.status === 'ABSENT').length;
    const staffLate = staffAttendance.filter(a => a.status === 'LATE').length;

    const totalActiveStaff = await db.teacher.count({
      where: { status: 'ACTIVE' },
    });

    // Class-wise breakdown
    const classes = await db.class.findMany({
      include: {
        _count: { select: { students: true } },
      },
    });

    const classWiseStats = classes.map(cls => {
      const classAttendance = filteredStudentAttendance.filter(
        a => a.student.classId === cls.id
      );
      const present = classAttendance.filter(a => a.status === 'PRESENT').length;
      const absent = classAttendance.filter(a => a.status === 'ABSENT').length;
      const late = classAttendance.filter(a => a.status === 'LATE').length;
      return {
        classId: cls.id,
        className: cls.name,
        totalStudents: cls._count.students,
        present,
        absent,
        late,
        unmarked: cls._count.students - classAttendance.length,
        attendanceRate: cls._count.students > 0
          ? Math.round((present / cls._count.students) * 100)
          : 0,
      };
    });

    return NextResponse.json({
      date: dateStr,
      students: {
        total: totalActiveStudents,
        marked: filteredStudentAttendance.length,
        unmarked,
        present: studentPresent,
        absent: studentAbsent,
        late: studentLate,
        attendanceRate: totalActiveStudents > 0
          ? Math.round((studentPresent / totalActiveStudents) * 100)
          : 0,
      },
      staff: {
        total: totalActiveStaff,
        present: staffPresent,
        absent: staffAbsent,
        late: staffLate,
        attendanceRate: totalActiveStaff > 0
          ? Math.round((staffPresent / totalActiveStaff) * 100)
          : 0,
      },
      classWise: classWiseStats,
    });
  } catch (error) {
    console.error('Attendance stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
