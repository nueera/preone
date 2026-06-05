import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, createOTP } from '@/lib/auth-utils';

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['LOGIN', 'FORGOT_PASSWORD'], {
    message: 'Purpose must be LOGIN or FORGOT_PASSWORD',
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = sendOtpSchema.safeParse(body);

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

    const { email, purpose } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Rate limit check: max 5 OTP per 15 minutes per email+purpose
    const rateLimitKey = `otp:${normalizedEmail}:${purpose}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: true,
          message: 'Too many OTP requests. Please try again later.',
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // Create the OTP
    const otp = await createOTP(normalizedEmail, purpose);

    const response: Record<string, unknown> = {
      error: false,
      message: 'OTP sent successfully',
      remaining: rateLimit.remaining,
    };

    // In development mode, return the OTP code for testing
    if (process.env.NODE_ENV === 'development') {
      response.devOtpCode = otp.code;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SEND_OTP] Error:', error);
    return NextResponse.json(
      { error: true, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
