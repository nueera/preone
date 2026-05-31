import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/students/[id] — Get complete student details with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            capacity: true,
            roomNo: true,
            program: { select: { id: true, name: true, ageMin: true, ageMax: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
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
          take: 90,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            payments: { orderBy: { paymentDate: 'desc' } },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 20,
        },
        growthScores: {
          orderBy: { createdAt: 'desc' },
        },
        observations: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        dailyUpdates: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        achievements: { orderBy: { date: 'desc' }, take: 10 },
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

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Get student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/students/[id] — Update student (partial update, handle status changes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Build update data from allowed fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'firstName', 'lastName', 'dob', 'gender', 'bloodGroup', 'photo',
      'classId', 'status', 'rollNumber', 'aadhaarNumber', 'branchId',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = field === 'dob' || field === 'admissionDate'
          ? new Date(body[field])
          : body[field];
      }
    }

    // Handle admissionDate separately
    if (body.admissionDate !== undefined) {
      updateData.admissionDate = new Date(body.admissionDate);
    }

    const student = await db.student.update({
      where: { id },
      data: updateData,
      include: {
        class: { select: { id: true, name: true, program: { select: { name: true } } } },
        branch: { select: { id: true, name: true } },
        parents: { include: { parent: true } },
      },
    });

    return NextResponse.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/students/[id] — Soft delete: set status to INACTIVE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
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
