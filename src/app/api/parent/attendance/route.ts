// ============================================================
// PreOne — GET /api/parent/attendance
// Attendance records for parent's children
// Query params: childId (required), month (1-12), year (YYYY)
// Returns: stats, daily records, and 6-month trend data
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
    const monthParam = searchParams.get('month'); // 1-12
    const yearParam = searchParams.get('year');   // YYYY

    // Determine target child — default to first child
    let targetChildId = auth.childIds[0];
    if (childId) {
      const accessError = verifyChildAccess(auth, childId);
      if (accessError) return accessError;
      targetChildId = childId;
    }

    if (!targetChildId) {
      return NextResponse.json({
        childId: null,
        childName: '',
        month: parseInt(monthParam || '0') || new Date().getMonth() + 1,
        year: parseInt(yearParam || '0') || new Date().getFullYear(),
        stats: { present: 0, absent: 0, late: 0, workingDays: 0, rate: 0 },
        records: [],
        trend: [],
      });
    }

    // Get child name from auth children
    const childInfo = auth.children.find((c) => c.id === targetChildId);

    // Parse month/year or default to current
    const now = new Date();
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();

    // Validate month/year
    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid month or year parameter' },
        { status: 400 }
      );
    }

    // ── Fetch attendance records for the selected month ──
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await db.studentAttendance.findMany({
      where: {
        studentId: targetChildId,
        date: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { date: 'asc' },
    });

    // ── Calculate monthly stats ──
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const workingDays = records.length;
    const rate = workingDays > 0
      ? Math.round(((present + late) / workingDays) * 100)
      : 0;

    // ── Calculate duration from check-in/out times ──
    const formattedRecords = records.map((r) => {
      let duration: string | null = null;
      if (r.checkInTime && r.checkOutTime) {
        try {
          const [inH, inM] = r.checkInTime.split(':').map(Number);
          const [outH, outM] = r.checkOutTime.split(':').map(Number);
          const inMinutes = inH * 60 + inM;
          const outMinutes = outH * 60 + outM;
          const diffMinutes = outMinutes - inMinutes;
          if (diffMinutes > 0) {
            const hours = Math.floor(diffMinutes / 60);
            const mins = diffMinutes % 60;
            duration = `${hours}h ${mins}m`;
          }
        } catch {
          duration = null;
        }
      }

      return {
        date: r.date.toISOString().split('T')[0],
        status: r.status,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        duration,
      };
    });

    // ── Fetch trend data (last 6 months) ──
    const trendData: Array<{ month: string; rate: number }> = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      let trendMonth = month - i;
      let trendYear = year;

      // Adjust year if month goes below 1
      while (trendMonth <= 0) {
        trendMonth += 12;
        trendYear--;
      }

      const tStart = new Date(trendYear, trendMonth - 1, 1);
      const tEnd = new Date(trendYear, trendMonth, 0, 23, 59, 59, 999);

      // Don't fetch future months
      if (tStart > now) {
        trendData.push({ month: monthNames[trendMonth - 1], rate: 0 });
        continue;
      }

      const tRecords = await db.studentAttendance.findMany({
        where: {
          studentId: targetChildId,
          date: { gte: tStart, lte: tEnd },
        },
        select: { status: true },
      });

      const tPresent = tRecords.filter((r) => r.status === 'PRESENT').length;
      const tLate = tRecords.filter((r) => r.status === 'LATE').length;
      const tTotal = tRecords.length;
      const tRate = tTotal > 0
        ? Math.round(((tPresent + tLate) / tTotal) * 100)
        : 0;

      trendData.push({ month: monthNames[trendMonth - 1], rate: tRate });
    }

    return NextResponse.json({
      childId: targetChildId,
      childName: childInfo
        ? `${childInfo.firstName} ${childInfo.lastName}`
        : '',
      month,
      year,
      stats: { present, absent, late, workingDays, rate },
      records: formattedRecords,
      trend: trendData,
    });
  } catch (error) {
    console.error('Parent attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
