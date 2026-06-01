import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET /api/settings/school — Return school profile with counts
export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUser(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const schoolId = authResult.schoolId;

    let school;
    if (schoolId) {
      school = await db.school.findUnique({
        where: { id: schoolId },
        include: {
          _count: {
            select: {
              branches: true,
              users: true,
            },
          },
        },
      });
    }

    // Fallback to first school if not found
    if (!school) {
      school = await db.school.findFirst({
        include: {
          _count: {
            select: {
              branches: true,
              users: true,
            },
          },
        },
      });
    }

    if (!school) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    // Get student and teacher counts across all branches
    const [studentCount, teacherCount] = await Promise.all([
      db.student.count({
        where: { branch: { schoolId: school.id } },
      }),
      db.teacher.count({
        where: { branch: { schoolId: school.id } },
      }),
    ]);

    return NextResponse.json({
      school: {
        id: school.id,
        name: school.name,
        logo: school.logo,
        address: school.address,
        city: school.city,
        state: school.state,
        pincode: school.pincode,
        phone: school.phone,
        email: school.email,
        website: school.website,
        academicYear: school.academicYear,
        board: school.board,
        schoolCode: school.schoolCode,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt,
        _count: {
          branches: school._count.branches,
          students: studentCount,
          teachers: teacherCount,
          users: school._count.users,
        },
      },
    });
  } catch (error) {
    console.error('Get school settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/settings/school — Update school profile
export async function PATCH(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const {
      name,
      logo,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      website,
      academicYear,
      board,
      schoolCode,
    } = body;

    const schoolId = authResult.schoolId;

    // Find the school
    let school;
    if (schoolId) {
      school = await db.school.findUnique({ where: { id: schoolId } });
    }
    if (!school) {
      school = await db.school.findFirst();
    }
    if (!school) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (logo !== undefined) updateData.logo = logo;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (academicYear !== undefined) updateData.academicYear = academicYear;
    if (board !== undefined) updateData.board = board;
    if (schoolCode !== undefined) updateData.schoolCode = schoolCode;

    const updatedSchool = await db.school.update({
      where: { id: school.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'School profile updated successfully',
      school: updatedSchool,
    });
  } catch (error) {
    console.error('Update school settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
