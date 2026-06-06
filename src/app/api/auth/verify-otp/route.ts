import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP } from '@/lib/auth-utils';

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  purpose: z.enum(['LOGIN', 'FORGOT_PASSWORD'], {
    message: 'Purpose must be LOGIN or FORGOT_PASSWORD',
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifyOtpSchema.safeParse(body);

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

    const { email, code, purpose } = result.data;
    const normalizedEmail = email.toLowerCase();

    const valid = await verifyOTP(normalizedEmail, code, purpose);

    return NextResponse.json({
      error: false,
      valid,
    });
  } catch (error) {
    console.error('[VERIFY_OTP] Error:', error);
    return NextResponse.json(
      { error: true, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
