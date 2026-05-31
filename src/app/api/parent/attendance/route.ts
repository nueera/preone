import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/parent/attendance — Attendance records for parent's children
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Parent);
    if (user instanceof NextResponse) return user;

    // Find the Parent record linked to this user
    const parent = await db.parent.findUnique({
      where: { userId: user.userId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');
    const monthParam = searchParams.get('month'); // format: "2024-01"

    // Get all children of this parent
    const studentParents = await db.studentParent.findMany({
      where: { parentId: parent.id },
      select: { studentId: true },
    });
    const childIds = studentParents.map((sp) => sp.studentId);

    if (childIds.length === 0) {
      return NextResponse.json({
        records: [],
        summary: { present: 0, absent: 0, late: 0, halfDay: 0, excused: 0, total: 0 },
      });
    }

    // Validate childId if provided
    if (childId && !childIds.includes(childId)) {
      return NextResponse.json(
        { error: 'Child not found or not associated with this parent' },
        { status: 403 }
      );
    }

    // Determine date range
    let monthStart: Date;
    let monthEnd: Date;

    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      if (!year || !month || month < 1 || month > 12) {
        return NextResponse.json(
          { error: 'Invalid month format. Use YYYY-MM (e.g., 2024-01)' },
          { status: 400 }
        );
      }
      monthStart = new Date(year, month - 1, 1);
      monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Determine which children to query
    const targetChildIds = childId ? [childId] : childIds;

    // Fetch attendance records
    const records = await db.studentAttendance.findMany({
      where: {
        studentId: { in: targetChildIds },
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, photo: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Compute monthly summary
    const summary = {
      present: records.filter((r) => r.status === 'Present').length,
      absent: records.filter((r) => r.status === 'Absent').length,
      late: records.filter((r) => r.status === 'Late').length,
      halfDay: records.filter((r) => r.status === 'HalfDay').length,
      excused: records.filter((r) => r.status === 'Excused').length,
      total: records.length,
    };

    return NextResponse.json({
      records,
      summary,
      month: monthParam || `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
    });
  } catch (error) {
    console.error('Parent attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
