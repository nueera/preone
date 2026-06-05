import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, verifyPassword, hashPassword } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: true,
          message: 'Validation failed',
          details: result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;
    const user = req.user;

    // Fetch the current password hash from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: true, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, dbUser.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: true, message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash and update the new password
    const hashedNewPassword = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CHANGE_PASSWORD',
          entity: 'User',
          entityId: user.id,
          details: 'Password changed successfully',
        },
      }),
    ]);

    return NextResponse.json({
      error: false,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[CHANGE_PASSWORD] Error:', error);
    return NextResponse.json(
      { error: true, message: 'Internal server error' },
      { status: 500 }
    );
  }
});
