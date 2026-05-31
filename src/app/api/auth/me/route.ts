import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
      return unauthorized();
    }

    const user = await db.user.findUnique({
      where: { id: authUser.userId },
      include: {
        branch: true,
        teacher: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        name: userWithoutPassword.name,
        role: userWithoutPassword.role,
        branchId: userWithoutPassword.branchId,
        schoolId: userWithoutPassword.schoolId,
        phone: userWithoutPassword.phone,
        avatar: userWithoutPassword.avatar,
        isActive: userWithoutPassword.isActive,
        branch: userWithoutPassword.branch,
        teacher: userWithoutPassword.teacher,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
