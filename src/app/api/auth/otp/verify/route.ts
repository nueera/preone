import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, purpose = 'login' } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and OTP code are required' },
        { status: 400 }
      );
    }

    // Find user by phone
    const user = await db.user.findFirst({
      where: { phone },
      include: { branch: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this phone number' },
        { status: 404 }
      );
    }

    // Find valid OTP
    const otp = await db.otp.findFirst({
      where: {
        userId: user.id,
        purpose,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await db.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Handle different purposes
    if (purpose === 'login') {
      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Account is deactivated' },
          { status: 403 }
        );
      }

      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      });

      const { passwordHash: _, ...userWithoutPassword } = user;

      return NextResponse.json({
        message: 'OTP verified successfully',
        token,
        user: userWithoutPassword,
      });
    }

    if (purpose === 'verify_email' || purpose === 'reset_password') {
      await db.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });

      return NextResponse.json({
        message: 'OTP verified successfully',
        verified: true,
      });
    }

    return NextResponse.json({
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
