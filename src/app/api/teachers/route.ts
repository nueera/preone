import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { getBranchFromRequest, withBranchViaRelationFilter } from '@/lib/branch';

// GET /api/teachers — List all teachers with pagination + filters (Admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    // Branch isolation
    const branchScope = getBranchFromRequest(request, authResult);

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status') || '';
    const qualification = searchParams.get('qualification') || '';
    const branchId = searchParams.get('branchId') || '';

    // Build where clause — start with branch filter (Teacher has branchId, no schoolId)
    const where: Record<string, unknown> = withBranchViaRelationFilter(branchScope);

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { qualification: { contains: search } },
        { specialization: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (qualification) {
      where.qualification = qualification;
    }

    if (branchId) {
      where.branchId = branchId;
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
          assignedClass: { select: { id: true, name: true } },
          _count: {
            select: {
              qualifications: true,
              leaves: true,
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

// POST /api/teachers — Create new teacher + user account
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const {
      branchId, firstName, lastName, phone, email,
      dob, gender, address, qualification, specialization,
      experience, salary, joiningDate, classId, photo,
    } = body;

    // Validation
    if (!firstName || firstName.length < 2) {
      return NextResponse.json({ error: 'First name is required (min 2 chars)' }, { status: 400 });
    }
    if (!lastName || lastName.length < 2) {
      return NextResponse.json({ error: 'Last name is required (min 2 chars)' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit phone number is required' }, { status: 400 });
    }

    // Check email uniqueness
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }
    const existingTeacher = await db.teacher.findUnique({ where: { email } });
    if (existingTeacher) {
      return NextResponse.json({ error: 'A teacher with this email already exists' }, { status: 409 });
    }

    // Create user account with role=TEACHER
    const defaultPassword = 'teacher123';
    const hashedPwd = await hashPassword(defaultPassword);
    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPwd,
        name: `${firstName} ${lastName}`,
        phone,
        role: 'TEACHER',
        isActive: true,
        branchId: branchId || null,
      },
    });

    // Create teacher record linked to user
    const teacher = await db.teacher.create({
      data: {
        userId: newUser.id,
        branchId: branchId || null,
        firstName,
        lastName,
        phone,
        email,
        dob: dob ? new Date(dob) : undefined,
        gender,
        address,
        qualification,
        specialization,
        experience: experience || 0,
        salary: salary || null,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        photo: photo || null,
        status: 'ACTIVE',
      },
      include: {
        branch: { select: { id: true, name: true } },
        assignedClass: { select: { id: true, name: true } },
      },
    });

    // Assign class if selected
    if (classId) {
      await db.class.update({
        where: { id: classId },
        data: { teacherId: teacher.id },
      });
    }

    return NextResponse.json(
      { message: 'Teacher created successfully', teacher },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
