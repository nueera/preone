import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, forbidden } from '@/lib/auth';

// GET /api/teachers/[id] — Get teacher details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;

    const teacher = await db.teacher.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, isActive: true, isVerified: true } },
        class: { select: { id: true, name: true, capacity: true } },
        qualifications: { orderBy: { year: 'desc' } },
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        performances: { orderBy: { createdAt: 'desc' }, take: 5 },
        leaves: { orderBy: { startDate: 'desc' }, take: 10 },
        attendance: { orderBy: { date: 'desc' }, take: 30 },
        salaryRecords: { orderBy: { month: 'desc' }, take: 12 },
        activities: { orderBy: { date: 'desc' }, take: 10 },
        observations: { orderBy: { date: 'desc' }, take: 10 },
        _count: {
          select: {
            qualifications: true,
            leaves: true,
            activities: true,
            observations: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Verify branch isolation
    if (user.branchId && teacher.branchId !== user.branchId) {
      return forbidden('You do not have access to this teacher');
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error('Get teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/teachers/[id] — Update teacher
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Verify branch isolation
    if (user.branchId && existing.branchId !== user.branchId) {
      return forbidden('You do not have access to this teacher');
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'email', 'dob', 'gender',
      'photo', 'address', 'qualification', 'specialization',
      'experience', 'status', 'staffType', 'endDate',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = ['dob', 'endDate'].includes(field) ? new Date(body[field]) : body[field];
      }
    }

    const teacher = await db.teacher.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: 'Teacher updated successfully', teacher });
  } catch (error) {
    console.error('Update teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
