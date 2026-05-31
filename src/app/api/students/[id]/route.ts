import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

// GET /api/students/[id] — Get student details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
      include: {
        class: {
          select: { id: true, name: true, capacity: true, program: { select: { name: true } } },
        },
        branch: { select: { id: true, name: true } },
        parents: {
          include: {
            parent: true,
          },
        },
        medicalRecords: true,
        attendance: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            payments: { orderBy: { paymentDate: 'desc' } },
          },
        },
        growthScores: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        observations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        dailyUpdates: {
          orderBy: { date: 'desc' },
          take: 7,
        },
        achievements: { orderBy: { date: 'desc' }, take: 5 },
        _count: {
          select: {
            attendance: true,
            invoices: true,
            observations: true,
            memories: true,
            achievements: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (user.branchId && student.branchId !== user.branchId) {
      return forbidden('You do not have access to this student');
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Get student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/students/[id] — Update student
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (user.branchId && existing.branchId !== user.branchId) {
      return forbidden('You do not have access to this student');
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'firstName', 'lastName', 'dob', 'gender', 'bloodGroup', 'photo',
      'classId', 'status', 'rollNumber', 'aadhaarNumber', 'branchId',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = field === 'dob' ? new Date(body[field]) : body[field];
      }
    }

    const student = await db.student.update({
      where: { id },
      data: updateData,
      include: {
        class: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        parents: {
          include: { parent: true },
        },
      },
    });

    return NextResponse.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/students/[id] — Soft delete by setting status
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const { id } = await params;

    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (user.branchId && existing.branchId !== user.branchId) {
      return forbidden('You do not have access to this student');
    }

    const student = await db.student.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return NextResponse.json({
      message: 'Student deactivated successfully',
      student: { id: student.id, status: student.status },
    });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
