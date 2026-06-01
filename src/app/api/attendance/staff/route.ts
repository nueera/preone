import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/attendance/staff — Get staff attendance for a date
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Get all active teachers
    const teachers = await db.teacher.findMany({
      where: { status: { in: ['ACTIVE', 'ON_LEAVE'] } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        branch: { select: { id: true, name: true } },
        assignedClass: { select: { id: true, name: true } },
      },
      orderBy: { firstName: 'asc' },
    });

    // Get staff attendance for date
    const staffAttendance = await db.staffAttendance.findMany({
      where: { date: { gte: dateStart, lte: dateEnd } },
    });

    // Map attendance to teachers
    const attendanceMap = new Map(staffAttendance.map(a => [a.teacherId, a]));

    const staffDetails = teachers.map(t => {
      const att = attendanceMap.get(t.id);
      return {
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        teacherStatus: t.status,
        branch: t.branch,
        assignedClass: t.assignedClass,
        attendance: att ? {
          id: att.id,
          status: att.status,
          checkInTime: att.checkInTime,
          checkOutTime: att.checkOutTime,
          method: att.method,
        } : null,
      };
    });

    const present = staffDetails.filter(s => s.attendance?.status === 'PRESENT').length;
    const absent = staffDetails.filter(s => s.attendance?.status === 'ABSENT').length;
    const late = staffDetails.filter(s => s.attendance?.status === 'LATE').length;
    const onLeave = staffDetails.filter(s => s.teacherStatus === 'ON_LEAVE').length;

    return NextResponse.json({
      date,
      present,
      absent,
      late,
      onLeave,
      total: teachers.length,
      details: staffDetails,
    });
  } catch (error) {
    console.error('Staff attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
