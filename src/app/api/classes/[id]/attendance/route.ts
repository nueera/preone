import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranchFromRequest, withBranchViaRelationFilter } from '@/lib/branch';

const DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// GET /api/classes/[id]/attendance — Attendance stats + 7-day trend for a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const branchScope = getBranchFromRequest(request, authResult);

    const cls = await db.class.findFirst({
      where: { id, ...withBranchViaRelationFilter(branchScope) },
      select: { id: true, name: true },
    });

    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const totalStudents = await db.student.count({ where: { classId: id, status: 'ACTIVE' } });

    // Last 7 days (oldest first) for the weekly trend chart.
    const days: { start: Date; end: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      days.push({ start, end });
    }

    const weekStart = days[0].start;
    const weekEnd = days[days.length - 1].end;

    const weekAttendance = await db.studentAttendance.findMany({
      where: { student: { classId: id }, date: { gte: weekStart, lte: weekEnd } },
      select: { date: true, status: true },
    });

    const weeklyHistory = days.map(({ start, end }) => {
      const dayRecords = weekAttendance.filter((a) => a.date >= start && a.date <= end);
      return {
        date: DAY_LABEL[start.getDay()],
        present: dayRecords.filter((a) => a.status === 'PRESENT').length,
        absent: dayRecords.filter((a) => a.status === 'ABSENT').length,
        late: dayRecords.filter((a) => a.status === 'LATE').length,
        total: totalStudents,
      };
    });

    const todayRecords = weekAttendance.filter((a) => a.date >= days[6].start && a.date <= days[6].end);
    const present = todayRecords.filter((a) => a.status === 'PRESENT').length;
    const absent = todayRecords.filter((a) => a.status === 'ABSENT').length;
    const late = todayRecords.filter((a) => a.status === 'LATE').length;

    return NextResponse.json({
      classId: cls.id,
      className: cls.name,
      total: totalStudents,
      present,
      absent,
      late,
      unmarked: totalStudents - todayRecords.length,
      rate: totalStudents > 0 ? Math.round(((present + late) / totalStudents) * 100) : 0,
      weeklyHistory,
    });
  } catch (error) {
    console.error('Get class attendance stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
