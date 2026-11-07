import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranchFromRequest, withBranchViaRelationFilter } from '@/lib/branch';

// GET /api/classes/[id]/students — Students in a single class, with today's
// attendance mark and a 30-day attendance rate.
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
      select: { id: true },
    });

    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const statusParam = request.nextUrl.searchParams.get('status') || '';
    const where: Record<string, unknown> = { classId: id };
    if (statusParam) {
      const statuses = statusParam.split(',').filter(Boolean);
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }

    const students = await db.student.findMany({
      where,
      orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        photo: true,
        gender: true,
        status: true,
      },
    });

    if (students.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const studentIds = students.map((s) => s.id);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [todayAttendance, recentAttendance] = await Promise.all([
      db.studentAttendance.findMany({
        where: { studentId: { in: studentIds }, date: { gte: todayStart, lte: todayEnd } },
        select: { id: true, studentId: true, status: true, checkInTime: true },
      }),
      db.studentAttendance.findMany({
        where: { studentId: { in: studentIds }, date: { gte: thirtyDaysAgo } },
        select: { studentId: true, status: true },
      }),
    ]);

    const todayMap = new Map(todayAttendance.map((a) => [a.studentId, a]));
    const recentByStudent = new Map<string, { present: number; total: number }>();
    for (const a of recentAttendance) {
      const entry = recentByStudent.get(a.studentId) || { present: 0, total: 0 };
      entry.total += 1;
      if (a.status === 'PRESENT' || a.status === 'LATE') entry.present += 1;
      recentByStudent.set(a.studentId, entry);
    }

    const formatted = students.map((s) => {
      const today = todayMap.get(s.id);
      const recent = recentByStudent.get(s.id);
      return {
        ...s,
        attendance: today
          ? { id: today.id, status: today.status, checkInTime: today.checkInTime }
          : null,
        attendanceRate: recent && recent.total > 0
          ? Math.round((recent.present / recent.total) * 100)
          : null,
      };
    });

    return NextResponse.json({ students: formatted });
  } catch (error) {
    console.error('Get class students error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
