import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

export const GET = withAuth(async (req) => {
  try {
    const user = req.user;

    // Fetch fresh user data from DB with related info
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            logo: true,
            onboardingComplete: true,
            theme: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            branchId: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: true, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!dbUser.isActive) {
      return NextResponse.json(
        { error: true, message: 'Account has been deactivated' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      error: false,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        phone: dbUser.phone,
        role: dbUser.role,
        avatar: dbUser.avatar,
        isActive: dbUser.isActive,
        schoolId: dbUser.schoolId,
        branchId: dbUser.branchId,
        lastLogin: dbUser.lastLogin,
        createdAt: dbUser.createdAt,
        school: dbUser.school,
        branch: dbUser.branch,
        teacher: dbUser.teacher,
      },
    });
  } catch (error) {
    console.error('[AUTH_ME] Error:', error);
    return NextResponse.json(
      { error: true, message: 'Internal server error' },
      { status: 500 }
    );
  }
});
