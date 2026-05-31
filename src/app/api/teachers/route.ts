import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/teachers — List all teachers
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || authUser.branchId || '';
    const status = searchParams.get('status') || '';
    const staffType = searchParams.get('staffType') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (staffType) where.staffType = staffType;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeId: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [teachers, total] = await Promise.all([
      db.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { id: true, name: true } },
          user: { select: { id: true, email: true, isActive: true } },
          class: { select: { id: true, name: true } },
          _count: {
            select: {
              qualifications: true,
              leaves: true,
              activities: true,
              observations: true,
            },
          },
        },
      }),
      db.teacher.count({ where }),
    ]);

    return NextResponse.json({
      teachers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List teachers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teachers — Create new teacher
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      branchId, employeeId, firstName, lastName, phone, email,
      dob, gender, photo, address, qualification, specialization,
      experience, staffType, userId,
    } = body;

    if (!branchId || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'branchId, firstName, and lastName are required' },
        { status: 400 }
      );
    }

    // Check employee ID uniqueness if provided
    if (employeeId) {
      const existing = await db.teacher.findUnique({ where: { employeeId } });
      if (existing) {
        return NextResponse.json({ error: 'Employee ID already exists' }, { status: 409 });
      }
    }

    const teacher = await db.teacher.create({
      data: {
        branchId,
        employeeId,
        firstName,
        lastName,
        phone,
        email,
        dob: dob ? new Date(dob) : undefined,
        gender,
        photo,
        address,
        qualification,
        specialization,
        experience,
        staffType: staffType || 'Teaching',
        userId,
      },
      include: {
        branch: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { message: 'Teacher created successfully', teacher },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
