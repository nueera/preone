import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/attendance/stats — Today's attendance stats
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || authUser.branchId || '';
    const classId = searchParams.get('classId') || '';
    const dateParam = searchParams.get('date') || '';

    // Use provided date or today
    let targetDate = dateParam ? new Date(dateParam) : new Date();
    let dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

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
        // Find the most recent date with attendance records
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

    // Student attendance stats — use date string comparison for SQLite
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

    // Filter by branch/class
    let filteredStudentAttendance = studentAttendance;
    if (branchId) {
      filteredStudentAttendance = filteredStudentAttendance.filter(
        a => a.student.branchId === branchId
      );
    }
    if (classId) {
      filteredStudentAttendance = filteredStudentAttendance.filter(
        a => a.student.classId === classId
      );
    }

    const studentPresent = filteredStudentAttendance.filter(a => a.status === 'Present').length;
    const studentAbsent = filteredStudentAttendance.filter(a => a.status === 'Absent').length;
    const studentLate = filteredStudentAttendance.filter(a => a.status === 'Late').length;
    const studentHalfDay = filteredStudentAttendance.filter(a => a.status === 'HalfDay').length;
    const studentExcused = filteredStudentAttendance.filter(a => a.status === 'Excused').length;

    // Get total active students for the filter
    const studentWhere: Record<string, unknown> = { status: 'Active' };
    if (branchId) studentWhere.branchId = branchId;
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
      include: {
        teacher: {
          select: { branchId: true, staffType: true },
        },
      },
    });

    let filteredStaffAttendance = staffAttendance;
    if (branchId) {
      filteredStaffAttendance = filteredStaffAttendance.filter(
        a => a.teacher.branchId === branchId
      );
    }

    const staffPresent = filteredStaffAttendance.filter(a => a.status === 'Present').length;
    const staffAbsent = filteredStaffAttendance.filter(a => a.status === 'Absent').length;
    const staffOnLeave = filteredStaffAttendance.filter(a => a.status === 'OnLeave').length;
    const staffLate = filteredStaffAttendance.filter(a => a.status === 'Late').length;

    const totalActiveStaff = await db.teacher.count({
      where: {
        status: 'Active',
        ...(branchId ? { branchId } : {}),
      },
    });

    // Class-wise breakdown
    const classes = await db.class.findMany({
      where: {
        isActive: true,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        _count: { select: { students: true } },
      },
    });

    const classWiseStats = classes.map(cls => {
      const classAttendance = filteredStudentAttendance.filter(
        a => a.student.classId === cls.id
      );
      const present = classAttendance.filter(a => a.status === 'Present').length;
      const absent = classAttendance.filter(a => a.status === 'Absent').length;
      const late = classAttendance.filter(a => a.status === 'Late').length;
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
        halfDay: studentHalfDay,
        excused: studentExcused,
        attendanceRate: totalActiveStudents > 0
          ? Math.round((studentPresent / totalActiveStudents) * 100)
          : 0,
      },
      staff: {
        total: totalActiveStaff,
        marked: filteredStaffAttendance.length,
        present: staffPresent,
        absent: staffAbsent,
        onLeave: staffOnLeave,
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
