import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// Helper: calculate number of calendar days between two dates (inclusive)
function calculateDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

// Default leave entitlements per year
const LEAVE_ENTITLEMENTS: Record<string, { total: number; label: string }> = {
  CASUAL: { total: 12, label: 'Casual Leave' },
  SICK: { total: 10, label: 'Sick Leave' },
  EARNED: { total: 15, label: 'Earned Leave' },
  MATERNITY: { total: 180, label: 'Maternity Leave' },
  PATERNITY: { total: 15, label: 'Paternity Leave' },
  WITHOUT_PAY: { total: 0, label: 'Leave Without Pay' },
};

// GET /api/teacher/leaves — Get teacher's leave history and balance
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Get leave history
    const leaves = await db.leave.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate leave balance based on current year
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const approvedLeaves = leaves.filter(
      (l) => l.status === 'APPROVED' &&
        new Date(l.startDate) >= yearStart &&
        new Date(l.startDate) <= yearEnd
    );

    const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');

    // Calculate used days by leave type (sum of days from APPROVED leaves)
    const usedByType: Record<string, number> = {};
    for (const leave of approvedLeaves) {
      const days = calculateDays(leave.startDate, leave.endDate);
      usedByType[leave.leaveType] = (usedByType[leave.leaveType] || 0) + days;
    }

    // Build leave balance with all types
    const balance: Record<string, { total: number; used: number; remaining: number; label: string }> = {};
    for (const [type, config] of Object.entries(LEAVE_ENTITLEMENTS)) {
      const used = usedByType[type] || 0;
      balance[type.toLowerCase()] = {
        total: config.total,
        used,
        remaining: config.total - used,
        label: config.label,
      };
    }

    // Format leaves for response
    const formattedLeaves = leaves.map((l) => ({
      id: l.id,
      leaveType: l.leaveType,
      startDate: l.startDate.toISOString().split('T')[0],
      endDate: l.endDate.toISOString().split('T')[0],
      days: calculateDays(l.startDate, l.endDate),
      reason: l.reason,
      status: l.status,
      approvedBy: l.approvedBy || null,
      approvedAt: l.approvedAt ? l.approvedAt.toISOString() : null,
      createdAt: l.createdAt.toISOString(),
    }));

    return NextResponse.json({
      leaves: formattedLeaves,
      balance,
      teacher: {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
      },
      summary: {
        totalLeaves: leaves.length,
        approvedCount: approvedLeaves.length,
        pendingCount: pendingLeaves.length,
        rejectedCount: leaves.filter((l) => l.status === 'REJECTED').length,
        cancelledCount: leaves.filter((l) => l.status === 'CANCELLED').length,
        totalDaysUsed: approvedLeaves.reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0),
        totalDaysPending: pendingLeaves.reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0),
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
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { leaveType, startDate, endDate, reason, contactDuringLeave } = body;

    if (!leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'leaveType, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reason is required and must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Validate leave type matches Prisma enum (uppercase)
    const validLeaveTypes = ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'WITHOUT_PAY'];
    const upperLeaveType = leaveType.toUpperCase();
    if (!validLeaveTypes.includes(upperLeaveType)) {
      return NextResponse.json(
        { error: `Invalid leaveType. Must be one of: ${validLeaveTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json(
        { error: 'End date must be on or after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping leaves (PENDING or APPROVED)
    const overlapping = await db.leave.findFirst({
      where: {
        teacherId: teacher.id,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: 'You already have a leave application that overlaps with these dates' },
        { status: 409 }
      );
    }

    const days = calculateDays(start, end);

    // Create leave record
    const leave = await db.leave.create({
      data: {
        teacherId: teacher.id,
        leaveType: upperLeaveType as any,
        startDate: start,
        endDate: end,
        reason: reason.trim(),
        status: 'PENDING',
      },
    });

    // Create notifications for all ADMIN users
    try {
      const admins = await db.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true },
      });

      const dateStr = start.toISOString().split('T')[0] === end.toISOString().split('T')[0]
        ? start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;

      for (const admin of admins) {
        await db.notification.create({
          data: {
            userId: admin.id,
            schoolId: user.schoolId || '',
            title: `Leave Request - ${teacher.firstName} ${teacher.lastName}`,
            message: `${LEAVE_ENTITLEMENTS[upperLeaveType]?.label || upperLeaveType} requested for ${dateStr} (${days} day${days > 1 ? 's' : ''})`,
            type: 'LEAVE',
            category: 'SYSTEM',
            link: `/admin/teachers/${teacher.id}`,
          },
        });
      }
    } catch (notifError) {
      console.error('Failed to send admin notifications:', notifError);
      // Don't fail the leave creation if notification fails
    }

    return NextResponse.json(
      {
        message: 'Leave application submitted successfully',
        leave: {
          id: leave.id,
          leaveType: leave.leaveType,
          startDate: leave.startDate.toISOString().split('T')[0],
          endDate: leave.endDate.toISOString().split('T')[0],
          days,
          reason: leave.reason,
          status: leave.status,
          createdAt: leave.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Apply leave error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
