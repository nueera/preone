import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, purpose = 'login' } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Find user by phone
    const user = await db.user.findFirst({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this phone number' },
        { status: 404 }
      );
    }

    // Invalidate any existing OTPs for this user and purpose
    await db.otp.updateMany({
      where: {
        userId: user.id,
        purpose,
        isUsed: false,
      },
      data: { isUsed: true },
    });

    // Generate 6-digit OTP
    const code = randomBytes(3).toString('hex').toUpperCase().substring(0, 6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    await db.otp.create({
      data: {
        code,
        purpose,
        expiresAt,
        userId: user.id,
      },
    });

    // In production, send OTP via SMS/WhatsApp
    // For now, return it in the response (dev only)
    return NextResponse.json({
      message: 'OTP sent successfully',
      // Remove this in production!
      otp: code,
      expiresIn: '5 minutes',
    });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
