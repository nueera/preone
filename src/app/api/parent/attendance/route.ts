// ============================================================
// PreOne — GET /api/parent/attendance
// Attendance records for parent's children
// Query params: childId, month (YYYY-MM)
// Uses requireParent for consistent auth
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError, verifyChildAccess } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');
    const month = searchParams.get('month'); // YYYY-MM format

    // Determine target child
    let targetChildId = auth.childIds[0];
    if (childId) {
      const accessError = verifyChildAccess(auth, childId);
      if (accessError) return accessError;
      targetChildId = childId;
    }

    if (!targetChildId) {
      return NextResponse.json({ records: [], summary: { present: 0, absent: 0, late: 0, total: 0 } });
    }

    // Parse month or default to current month
    let monthStart: Date;
    let monthEnd: Date;

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      monthStart = new Date(year, mon - 1, 1);
      monthEnd = new Date(year, mon, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const records = await db.studentAttendance.findMany({
      where: {
        studentId: targetChildId,
        date: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { date: 'asc' },
    });

    const summary = {
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      total: records.length,
    };

    return NextResponse.json({
      records: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString().split('T')[0],
        status: r.status,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
      })),
      summary,
      month: month || `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
    });
  } catch (error) {
    console.error('Parent attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
