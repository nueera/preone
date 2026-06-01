import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// PATCH /api/teachers/[id]/leaves/[leaveId] — Approve/reject leave
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; leaveId: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id, leaveId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (APPROVED, REJECTED, CANCELLED)' },
        { status: 400 }
      );
    }

    const leave = await db.leave.findFirst({
      where: { id: leaveId, teacherId: id },
    });

    if (!leave) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    const updatedLeave = await db.leave.update({
      where: { id: leaveId },
      data: {
        status,
        approvedBy: authResult.userId,
        approvedAt: new Date(),
      },
    });

    // If leave is approved and teacher is currently active, set to ON_LEAVE
    if (status === 'APPROVED') {
      const now = new Date();
      const startDate = new Date(updatedLeave.startDate);
      const endDate = new Date(updatedLeave.endDate);
      if (now >= startDate && now <= endDate) {
        await db.teacher.update({
          where: { id },
          data: { status: 'ON_LEAVE' },
        });
      }
    }

    return NextResponse.json({
      message: `Leave ${status.toLowerCase()} successfully`,
      leave: updatedLeave,
    });
  } catch (error) {
    console.error('Update leave error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
