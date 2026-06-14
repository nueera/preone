import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendOtpSms } from '@/lib/messaging';

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

    // Send the OTP via SMS (logs to the server console in dev when no
    // provider is configured — see src/lib/messaging.ts).
    const delivery = await sendOtpSms(phone, code, purpose);

    const response: Record<string, unknown> = {
      message: 'OTP sent successfully',
      expiresIn: '5 minutes',
    };
    // Only expose the code in development for testing — never in production.
    if (process.env.NODE_ENV === 'development') {
      response.devOtpCode = code;
      response.delivery = delivery;
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
