import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized, forbidden, requireAdmin } from '@/lib/auth';

// GET /api/teachers/[id] — Get teacher details with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const { id } = await params;

    const teacher = await db.teacher.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, isActive: true } },
        assignedClass: { select: { id: true, name: true, capacity: true } },
        qualifications: { orderBy: { year: 'desc' } },
        workSchedules: { orderBy: { dayOfWeek: 'asc' } },
        reviews: { orderBy: { reviewDate: 'desc' }, take: 20 },
        leaves: { orderBy: { startDate: 'desc' }, take: 30 },
        staffAttendance: { orderBy: { date: 'desc' }, take: 90 },
        salaries: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 24 },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (user.branchId && teacher.branchId !== user.branchId) {
      return forbidden('You do not have access to this teacher');
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error('Get teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/teachers/[id] — Update teacher
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'email', 'dob', 'gender',
      'photo', 'address', 'qualification', 'specialization',
      'experience', 'status', 'salary', 'branchId', 'joiningDate',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = ['dob', 'joiningDate'].includes(field) ? new Date(body[field]) : body[field];
      }
    }

    // Handle class assignment
    if (body.classId !== undefined) {
      // Remove old class assignment
      if (existing.assignedClass) {
        // Get current assigned class
        const currentClass = await db.class.findFirst({
          where: { teacherId: existing.id },
        });
        if (currentClass) {
          await db.class.update({
            where: { id: currentClass.id },
            data: { teacherId: null },
          });
        }
      }
      // Assign new class
      if (body.classId) {
        await db.class.update({
          where: { id: body.classId },
          data: { teacherId: existing.id },
        });
      }
    }

    const teacher = await db.teacher.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true } },
        assignedClass: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: 'Teacher updated successfully', teacher });
  } catch (error) {
    console.error('Update teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teachers/[id] — Soft delete (set status INACTIVE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const existing = await db.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const teacher = await db.teacher.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    // Also deactivate the user account
    if (teacher.userId) {
      await db.user.update({
        where: { id: teacher.userId },
        data: { isActive: false },
      });
    }

    // Unassign from class
    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
    });
    if (assignedClass) {
      await db.class.update({
        where: { id: assignedClass.id },
        data: { teacherId: null },
      });
    }

    return NextResponse.json({
      message: 'Teacher deactivated successfully',
      teacher: { id: teacher.id, status: teacher.status },
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
