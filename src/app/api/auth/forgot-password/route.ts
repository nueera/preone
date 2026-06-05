import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, createOTP } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

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

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    // But only actually send OTP if user exists
    if (!existingUser) {
      return NextResponse.json({
        error: false,
        message: 'If an account with this email exists, an OTP has been sent.',
      });
    }

    if (!existingUser.isActive) {
      return NextResponse.json({
        error: false,
        message: 'If an account with this email exists, an OTP has been sent.',
      });
    }

    // Rate limit check: max 5 OTP per 15 minutes per email
    const rateLimitKey = `otp:${normalizedEmail}:FORGOT_PASSWORD`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      // Don't reveal rate limiting to prevent enumeration
      return NextResponse.json({
        error: false,
        message: 'If an account with this email exists, an OTP has been sent.',
      });
    }

    // Create the OTP for password reset
    const otp = await createOTP(normalizedEmail, 'FORGOT_PASSWORD');

    const response: Record<string, unknown> = {
      error: false,
      message: 'If an account with this email exists, an OTP has been sent.',
    };

    // In development mode, return the OTP code for testing
    if (process.env.NODE_ENV === 'development') {
      response.devOtpCode = otp.code;
    }

    // TODO: Send OTP via email/SMS in production
    // await sendOtpEmail(normalizedEmail, otp.code);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[FORGOT_PASSWORD] Error:', error);
    return NextResponse.json(
      { error: true, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
