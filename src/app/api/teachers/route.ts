import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

// GET /api/teachers — List all teachers
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
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

// POST /api/teachers — Create new teacher
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const {
      branchId, firstName, lastName, phone, email,
      dob, gender, address, qualification, specialization,
      experience, salary,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'firstName and lastName are required' },
        { status: 400 }
      );
    }

    // Create user account for teacher if email provided
    let userId: string | undefined;
    if (email) {
      const existingUser = await db.user.findUnique({ where: { email } });
      if (!existingUser) {
        const hashedPwd = await hashPassword('password123');
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
        userId = newUser.id;
      }
    }

    const teacher = await db.teacher.create({
      data: {
        userId,
        branchId: branchId || null,
        firstName,
        lastName,
        phone: phone || '',
        email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@littlestars.com`,
        dob: dob ? new Date(dob) : undefined,
        gender,
        address,
        qualification,
        specialization,
        experience: experience || 0,
        salary: salary || null,
        status: 'ACTIVE',
      },
      include: {
        branch: { select: { id: true, name: true } },
        assignedClass: { select: { id: true, name: true } },
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
