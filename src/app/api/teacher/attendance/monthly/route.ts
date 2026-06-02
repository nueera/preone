import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/attendance/monthly — Monthly attendance summary for teacher's class
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      select: { id: true, name: true },
    });

    if (!assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 404 });
    }

    // Get params
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month (1-12)' }, { status: 400 });
    }

    // Get all students in the class
    const studentCount = await db.student.count({
      where: { classId: assignedClass.id, status: 'ACTIVE' },
    });

    // Date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    // Get all attendance records for the month
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        student: { classId: assignedClass.id, status: 'ACTIVE' },
        date: {
          gte: startDate,
          lte: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59),
        },
      },
      select: {
        date: true,
        status: true,
        studentId: true,
      },
    });

    // Group by date
    const dailyMap = new Map<string, { present: number; absent: number; late: number; total: number }>();

    attendanceRecords.forEach((record) => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { present: 0, absent: 0, late: 0, total: 0 });
      }
      const day = dailyMap.get(dateKey)!;
      day.total++;
      switch (record.status) {
        case 'PRESENT': day.present++; break;
        case 'ABSENT': day.absent++; break;
        case 'LATE': day.late++; break;
      }
    });

    // Build daily stats array
    const dailyStats = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        rate: stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0,
      }));

    // Count working days (days with any attendance records)
    const workingDays = dailyMap.size;

    // Compute monthly rate
    const totalPresent = dailyStats.reduce((sum, d) => sum + d.present, 0);
    const totalLate = dailyStats.reduce((sum, d) => sum + d.late, 0);
    const totalRecords = attendanceRecords.length;
    const monthlyRate = totalRecords > 0 ? Math.round(((totalPresent + totalLate) / totalRecords) * 100) : 0;

    return NextResponse.json({
      month,
      year,
      className: assignedClass.name,
      studentCount,
      workingDays,
      dailyStats,
      monthlyRate,
    });
  } catch (error) {
    console.error('Monthly attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
