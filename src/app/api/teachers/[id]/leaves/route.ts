import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/teachers/[id]/leaves — Get leave records
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const teacher = await db.teacher.findUnique({ where: { id } });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const leaves = await db.leave.findMany({
      where: { teacherId: id },
      orderBy: { startDate: 'desc' },
    });

    // Calculate leave balances
    const currentYear = new Date().getFullYear();
    const yearLeaves = await db.leave.findMany({
      where: {
        teacherId: id,
        status: 'APPROVED',
        startDate: { gte: new Date(currentYear, 0, 1) },
        endDate: { lte: new Date(currentYear, 11, 31) },
      },
    });

    const casualUsed = yearLeaves
      .filter((l) => l.leaveType === 'CASUAL')
      .reduce((sum, l) => {
        const days = Math.ceil(
          (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        return sum + days;
      }, 0);

    const sickUsed = yearLeaves
      .filter((l) => l.leaveType === 'SICK')
      .reduce((sum, l) => {
        const days = Math.ceil(
          (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        return sum + days;
      }, 0);

    const earnedUsed = yearLeaves
      .filter((l) => l.leaveType === 'EARNED')
      .reduce((sum, l) => {
        const days = Math.ceil(
          (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        return sum + days;
      }, 0);

    return NextResponse.json({
      leaves,
      balance: {
        casual: { used: casualUsed, total: 12 },
        sick: { used: sickUsed, total: 10 },
        earned: { used: earnedUsed, total: 15 },
      },
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teachers/[id]/leaves — Apply leave on behalf of teacher
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    const adminUser = authResult;

    const { id } = await params;
    const body = await request.json();
    const { leaveType, startDate, endDate, reason } = body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Leave type, start date, end date, and reason are required' },
        { status: 400 }
      );
    }

    const teacher = await db.teacher.findUnique({ where: { id } });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const leave = await db.leave.create({
      data: {
        teacherId: id,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'APPROVED', // Admin-applied leaves are auto-approved
        approvedBy: adminUser.userId,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Leave applied successfully', leave },
      { status: 201 }
    );
  } catch (error) {
    console.error('Apply leave error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
