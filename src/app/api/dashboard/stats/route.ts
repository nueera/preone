import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const branchId = request.nextUrl.searchParams.get('branchId') || authUser.branchId;

    // Total students
    const totalStudents = await db.student.count({
      where: branchId ? { branchId, status: 'Active' } : { status: 'Active' },
    });

    // Total teachers
    const totalTeachers = await db.teacher.count({
      where: branchId ? { branchId, status: 'Active' } : { status: 'Active' },
    });

    // Revenue — sum of all paid amounts
    const paidInvoices = await db.payment.findMany({
      where: { status: 'Success' },
      select: { amount: true, paidAt: true },
    });
    const totalRevenue = paidInvoices.reduce((sum, p) => sum + p.amount, 0);

    // This month revenue
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRevenue = paidInvoices
      .filter(p => p.paidAt && new Date(p.paidAt) >= monthStart)
      .reduce((sum, p) => sum + p.amount, 0);

    // New admissions this month
    const newAdmissions = await db.student.count({
      where: {
        enrollmentDate: { gte: monthStart },
        ...(branchId ? { branchId } : {}),
      },
    });

    // Class occupancy
    const classes = await db.class.findMany({
      where: branchId ? { branchId, isActive: true } : { isActive: true },
      include: { _count: { select: { students: true } } },
    });
    const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
    const totalOccupancy = classes.reduce((sum, c) => sum + c._count.students, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

    // Parent satisfaction — average of parent feedback (mock calculation based on observations)
    const observations = await db.observation.count({
      where: { parentAcknowledged: true },
    });
    const totalObservations = await db.observation.count();
    const satisfactionRate = totalObservations > 0
      ? Math.round((observations / totalObservations) * 100)
      : 92; // Default mock value

    // Pending fees
    const pendingInvoices = await db.invoice.count({
      where: {
        status: { in: ['Pending', 'Overdue', 'Partial'] },
        ...(branchId ? { branchId } : {}),
      },
    });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await db.studentAttendance.count({
      where: {
        date: { gte: today },
        status: 'Present',
      },
    });
    const todayTotalAttendance = await db.studentAttendance.count({
      where: { date: { gte: today } },
    });
    const attendanceRate = todayTotalAttendance > 0
      ? Math.round((todayAttendance / todayTotalAttendance) * 100)
      : 0;

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalRevenue,
      thisMonthRevenue,
      newAdmissions,
      occupancyRate,
      satisfactionRate,
      pendingFees: pendingInvoices,
      attendanceRate,
      totalCapacity,
      totalOccupancy,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
