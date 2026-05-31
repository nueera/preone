import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

// GET /api/dashboard/stats — aggregate counts and revenue
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const branchId = request.nextUrl.searchParams.get('branchId') || user.branchId || '';
    const bf = branchId ? { branchId } : {};

    // Total students
    const totalStudents = await db.student.count({
      where: { ...bf, status: 'ACTIVE' },
    });

    // Total teachers
    const totalTeachers = await db.teacher.count({
      where: { ...bf, status: 'ACTIVE' },
    });

    // Revenue — sum of all payments
    const payments = await db.payment.findMany({
      select: { amount: true, paymentDate: true },
    });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // This month revenue
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRevenue = payments
      .filter(p => p.paymentDate && new Date(p.paymentDate) >= monthStart)
      .reduce((sum, p) => sum + p.amount, 0);

    // New admissions this month
    const newAdmissions = await db.student.count({
      where: {
        admissionDate: { gte: monthStart },
        ...bf,
      },
    });

    const displayAdmissions = newAdmissions > 0 ? newAdmissions : totalStudents;

    // Class occupancy
    const classes = await db.class.findMany({
      where: bf,
      include: { _count: { select: { students: true } } },
    });
    const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
    const totalOccupancy = classes.reduce((sum, c) => sum + c._count.students, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

    // Fee collection breakdown
    const invoices = await db.invoice.findMany({
      select: { status: true, amount: true, netAmount: true, discount: true },
    });
    const collected = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.netAmount, 0);
    const pending = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + i.netAmount, 0);
    const overdue = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + i.netAmount, 0);

    // Today's attendance
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
    const todayPresent = todayAttendance.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = todayAttendance.length > 0
      ? Math.round((todayPresent / totalStudents) * 100)
      : 0;

    // CRM leads count
    const activeLeads = await db.lead.count({
      where: {
        stage: { notIn: ['ENROLLED', 'LOST'] },
      },
    });

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalRevenue,
      thisMonthRevenue,
      newAdmissions: displayAdmissions,
      occupancyRate,
      attendanceRate,
      totalCapacity,
      totalOccupancy,
      feeBreakdown: { collected, pending, overdue },
      activeLeads,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
