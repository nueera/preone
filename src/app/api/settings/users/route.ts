import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin, hashPassword } from '@/lib/auth';

// GET /api/settings/users — List all users with search, role filter, status filter, pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUser(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Filter by schoolId if available
    const schoolId = authResult.schoolId;
    if (schoolId) {
      where.schoolId = schoolId;
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Search filter
    if (search) {
      (where as Record<string, unknown>).OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          avatar: true,
          isActive: true,
          schoolId: true,
          branchId: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: { id: true, name: true },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings/users — Create a new user
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { name, email, phone, role, password, schoolId, branchId, sendCredentials } = body;

    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'name, email, role, and password are required' },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Resolve schoolId
    let resolvedSchoolId = schoolId;
    if (!resolvedSchoolId) {
      resolvedSchoolId = authResult.schoolId;
    }
    if (!resolvedSchoolId) {
      const firstSchool = await db.school.findFirst();
      resolvedSchoolId = firstSchool?.id;
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role,
        password: hashedPassword,
        schoolId: resolvedSchoolId || null,
        branchId: branchId || null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    const response: Record<string, unknown> = {
      message: 'User created successfully',
      user,
    };

    // Acknowledge sendCredentials flag (don't actually send)
    if (sendCredentials) {
      response.sendCredentialsAcknowledged = true;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
