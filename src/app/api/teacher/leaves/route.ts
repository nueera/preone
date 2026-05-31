import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/leaves — Get teacher's leave history and balance
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Teacher);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, joinDate: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Get leave history
    const leaves = await db.leave.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate leave balance (based on used leaves by type)
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const approvedLeaves = leaves.filter(
      l => l.status === 'Approved' &&
        new Date(l.startDate) >= yearStart &&
        new Date(l.startDate) <= yearEnd
    );

    const pendingLeaves = leaves.filter(l => l.status === 'Pending');

    // Calculate used days by leave type
    const usedByType: Record<string, number> = {};
    for (const leave of approvedLeaves) {
      usedByType[leave.leaveType] = (usedByType[leave.leaveType] || 0) + leave.totalDays;
    }

    // Default leave entitlements (can be customized per school)
    const leaveBalance = {
      Sick: { entitled: 12, used: usedByType['Sick'] || 0, remaining: 12 - (usedByType['Sick'] || 0) },
      Casual: { entitled: 10, used: usedByType['Casual'] || 0, remaining: 10 - (usedByType['Casual'] || 0) },
      Earned: { entitled: 15, used: usedByType['Earned'] || 0, remaining: 15 - (usedByType['Earned'] || 0) },
      Maternity: { entitled: 180, used: usedByType['Maternity'] || 0, remaining: 180 - (usedByType['Maternity'] || 0) },
      Paternity: { entitled: 15, used: usedByType['Paternity'] || 0, remaining: 15 - (usedByType['Paternity'] || 0) },
      CompOff: { entitled: 0, used: usedByType['CompOff'] || 0, remaining: 0 },
      LossOfPay: { entitled: 0, used: usedByType['LossOfPay'] || 0, remaining: 0 },
    };

    return NextResponse.json({
      leaves,
      leaveBalance,
      summary: {
        totalLeaves: leaves.length,
        approvedCount: approvedLeaves.length,
        pendingCount: pendingLeaves.length,
        rejectedCount: leaves.filter(l => l.status === 'Rejected').length,
        totalDaysUsed: approvedLeaves.reduce((sum, l) => sum + l.totalDays, 0),
        totalDaysPending: pendingLeaves.reduce((sum, l) => sum + l.totalDays, 0),
      },
    });
  } catch (error) {
    console.error('Get teacher leaves error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teacher/leaves — Apply for leave
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Teacher);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { leaveType, startDate, endDate, totalDays, reason } = body;

    if (!leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'leaveType, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const validLeaveTypes = ['Sick', 'Casual', 'Earned', 'Maternity', 'Paternity', 'CompOff', 'LossOfPay'];
    if (!validLeaveTypes.includes(leaveType)) {
      return NextResponse.json(
        { error: `Invalid leaveType. Must be one of: ${validLeaveTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for overlapping leaves
    const overlapping = await db.leave.findFirst({
      where: {
        teacherId: teacher.id,
        status: { in: ['Pending', 'Approved'] },
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: 'You already have a leave application that overlaps with these dates' },
        { status: 409 }
      );
    }

    const leave = await db.leave.create({
      data: {
        teacherId: teacher.id,
        leaveType,
        startDate: new Date(startDate + 'T00:00:00.000Z'),
        endDate: new Date(endDate + 'T00:00:00.000Z'),
        totalDays: totalDays ?? 1,
        reason: reason || null,
        status: 'Pending',
      },
    });

    return NextResponse.json(
      {
        message: 'Leave application submitted successfully',
        leave,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Apply leave error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
