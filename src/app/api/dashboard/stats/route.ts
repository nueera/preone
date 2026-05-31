import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/dashboard/stats — Aggregate dashboard statistics
// Requires ADMIN role. Returns counts, rates, and trend percentages.
export async function GET(request: NextRequest) {
  try {
    // ── Verify ADMIN role ──
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    // ── Current date boundaries ──
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ── Total students (ACTIVE) ──
    const totalStudents = await db.student.count({
      where: { status: 'ACTIVE' },
    });

    // ── Students from last month (for trend) ──
    const lastMonthStudents = await db.student.count({
      where: { status: 'ACTIVE', createdAt: { lt: monthStart } },
    });

    // ── Total teachers (ACTIVE) ──
    const totalTeachers = await db.teacher.count({
      where: { status: 'ACTIVE' },
    });

    const lastMonthTeachers = await db.teacher.count({
      where: { status: 'ACTIVE', createdAt: { lt: monthStart } },
    });

    // ── Monthly revenue (payments this month) ──
    const thisMonthPayments = await db.payment.findMany({
      where: { paymentDate: { gte: monthStart } },
      select: { amount: true },
    });
    const monthlyRevenue = thisMonthPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    // ── Last month revenue (for trend) ──
    const lastMonthPayments = await db.payment.findMany({
      where: {
        paymentDate: { gte: lastMonthStart, lt: monthStart },
      },
      select: { amount: true },
    });
    const lastMonthRevenue = lastMonthPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    // ── New admissions this month ──
    const newAdmissions = await db.student.count({
      where: { createdAt: { gte: monthStart } },
    });

    const lastMonthAdmissions = await db.student.count({
      where: { createdAt: { gte: lastMonthStart, lt: monthStart } },
    });

    // ── Class occupancy rate ──
    const classes = await db.class.findMany({
      include: { _count: { select: { students: true } } },
    });
    const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
    const totalOccupancy = classes.reduce(
      (sum, c) => sum + c._count.students,
      0,
    );
    const occupancyRate =
      totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

    // ── Today's attendance rate ──
    let dateStr = now.toISOString().split('T')[0];
    let todayAttendance = await db.studentAttendance.findMany({
      where: {
        date: {
          gte: new Date(dateStr + 'T00:00:00.000Z'),
          lte: new Date(dateStr + 'T23:59:59.999Z'),
        },
      },
      select: { status: true },
    });

    // Fallback: use most recent attendance date if today has none
    if (todayAttendance.length === 0) {
      const recentAtt = await db.studentAttendance.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      if (recentAtt) {
        dateStr = recentAtt.date.toISOString().split('T')[0];
        todayAttendance = await db.studentAttendance.findMany({
          where: {
            date: {
              gte: new Date(dateStr + 'T00:00:00.000Z'),
              lte: new Date(dateStr + 'T23:59:59.999Z'),
            },
          },
          select: { status: true },
        });
      }
    }
    const todayPresent = todayAttendance.filter(
      (a) => a.status === 'PRESENT',
    ).length;
    const attendanceRate =
      todayAttendance.length > 0
        ? Math.round((todayPresent / totalStudents) * 100)
        : 0;

    // ── Compute trend percentages ──
    const trendPct = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      monthlyRevenue,
      newAdmissions,
      occupancyRate,
      attendanceRate,
      trends: {
        students: trendPct(totalStudents, lastMonthStudents),
        teachers: trendPct(totalTeachers, lastMonthTeachers),
        revenue: trendPct(monthlyRevenue, lastMonthRevenue),
        admissions: trendPct(newAdmissions, lastMonthAdmissions),
        occupancy: 2, // Placeholder — historical occupancy comparison
        attendance: 1, // Placeholder — compared to yesterday
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
