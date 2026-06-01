import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// PATCH /api/teacher/leaves/[id]/cancel — Cancel a PENDING leave request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { id } = await params;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Find the leave request
    const leave = await db.leave.findUnique({
      where: { id },
    });

    if (!leave) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Verify the leave belongs to this teacher
    if (leave.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'You can only cancel your own leave requests' }, { status: 403 });
    }

    // Only PENDING leaves can be cancelled
    if (leave.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel a leave with status "${leave.status}". Only pending leaves can be cancelled.` },
        { status: 400 }
      );
    }

    // Update leave status to CANCELLED
    const updatedLeave = await db.leave.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({
      message: 'Leave request cancelled successfully',
      leave: {
        id: updatedLeave.id,
        leaveType: updatedLeave.leaveType,
        startDate: updatedLeave.startDate.toISOString().split('T')[0],
        endDate: updatedLeave.endDate.toISOString().split('T')[0],
        status: updatedLeave.status,
      },
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
