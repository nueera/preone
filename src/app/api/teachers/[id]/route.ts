import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

// GET /api/teachers/[id] — Get teacher details
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
        reviews: { orderBy: { reviewDate: 'desc' }, take: 5 },
        leaves: { orderBy: { startDate: 'desc' }, take: 10 },
        staffAttendance: { orderBy: { date: 'desc' }, take: 30 },
        salaries: { orderBy: { month: 'desc' }, take: 12 },
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
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const existing = await db.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (user.branchId && existing.branchId !== user.branchId) {
      return forbidden('You do not have access to this teacher');
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'email', 'dob', 'gender',
      'photo', 'address', 'qualification', 'specialization',
      'experience', 'status', 'salary', 'branchId',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = ['dob'].includes(field) ? new Date(body[field]) : body[field];
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

// DELETE /api/teachers/[id] — Soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const { id } = await params;

    const existing = await db.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (user.branchId && existing.branchId !== user.branchId) {
      return forbidden('You do not have access to this teacher');
    }

    const teacher = await db.teacher.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return NextResponse.json({
      message: 'Teacher deactivated successfully',
      teacher: { id: teacher.id, status: teacher.status },
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
