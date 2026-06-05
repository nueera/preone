import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP, hashPassword } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

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

    const { email, code, newPassword } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Verify the OTP
    const isOtpValid = await verifyOTP(normalizedEmail, code, 'FORGOT_PASSWORD');

    if (!isOtpValid) {
      return NextResponse.json(
        { error: true, message: 'Invalid or expired OTP code' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: true, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: true, message: 'Account has been deactivated' },
        { status: 403 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and create audit log
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'RESET_PASSWORD',
          entity: 'User',
          entityId: user.id,
          details: 'Password reset via forgot password flow',
        },
      }),
    ]);

    return NextResponse.json({
      error: false,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[RESET_PASSWORD] Error:', error);
    return NextResponse.json(
      { error: true, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
