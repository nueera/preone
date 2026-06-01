import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET /api/settings/branches — List all branches with counts and filters
export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUser(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};

    // Filter by schoolId if available
    const schoolId = authResult.schoolId;
    if (schoolId) {
      where.schoolId = schoolId;
    }

    // Filter by isActive
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Search filter
    if (search) {
      (where as Record<string, unknown>).OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { inChargeName: { contains: search } },
      ];
    }

    const branches = await db.branch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            students: true,
            classes: true,
            teachers: true,
          },
        },
      },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error('List branches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings/branches — Create a new branch
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { name, schoolId, address, phone, capacity, inChargeName, inChargePhone } = body;

    if (!name) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }

    // Resolve schoolId: from body, auth token, or first school
    let resolvedSchoolId = schoolId;
    if (!resolvedSchoolId) {
      resolvedSchoolId = authResult.schoolId;
    }
    if (!resolvedSchoolId) {
      const firstSchool = await db.school.findFirst();
      resolvedSchoolId = firstSchool?.id;
    }
    if (!resolvedSchoolId) {
      return NextResponse.json({ error: 'No school found. Create a school first.' }, { status: 400 });
    }

    // Verify school exists
    const school = await db.school.findUnique({ where: { id: resolvedSchoolId } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const branch = await db.branch.create({
      data: {
        name,
        schoolId: resolvedSchoolId,
        address: address || null,
        phone: phone || null,
        capacity: capacity || 0,
        inChargeName: inChargeName || null,
        inChargePhone: inChargePhone || null,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            students: true,
            classes: true,
            teachers: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Branch created successfully', branch },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create branch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
