import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendOtpSms, sendOtpEmail } from '@/lib/messaging';

// ============================================================
// POST /api/auth/otp/send
// Generates a 6-digit OTP, stores it keyed by the user's email,
// and delivers it via SMS (for phone identifiers) or email
// (for email identifiers).
//
// Request body (any of these shapes — backward compatible):
//   { identifier: "user@example.com" | "+91..." }   ← preferred
//   { email: "user@example.com" }                    ← alias for identifier
//   { phone: "+91..." }                              ← alias for identifier
//   { purpose?: "login" | "verify_email" | "reset_password" }  (default "login")
//
// The `identifier` is auto-detected: if it contains "@", it's treated
// as an email; otherwise as a phone. This lets the login page's OTP
// tab send an OTP to whatever the user typed in the email field.
//
// In development (no SMS/email provider configured) the code is logged
// to the server console AND returned in the response as `devOtpCode`
// so the OTP flow is testable end-to-end without credentials.
// ============================================================

function looksLikeEmail(value: string): boolean {
  return value.includes('@');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, purpose = 'login' } = body;

    // Accept `identifier` (preferred) OR `email` OR `phone` (backward compat)
    const identifier: string | undefined = body.identifier ?? email ?? phone;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    const normalized = identifier.trim();
    const isEmail = looksLikeEmail(normalized);

    // Find user by email OR phone
    const user = await db.user.findFirst({
      where: isEmail
        ? { email: normalized.toLowerCase() }
        : { phone: normalized },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: isEmail
            ? 'No account found with this email'
            : 'No account found with this phone number',
        },
        { status: 404 }
      );
    }

    // Invalidate any existing OTPs for this user and purpose.
    // The Otp model is keyed by email (see prisma/schema.prisma).
    await db.otp.updateMany({
      where: {
        email: user.email,
        purpose,
        isUsed: false,
      },
      data: { isUsed: true },
    });

    // Generate 6-digit OTP
    const code = randomBytes(3).toString('hex').toUpperCase().substring(0, 6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP (keyed by user's email — see Otp model)
    await db.otp.create({
      data: {
        email: user.email,
        code,
        purpose,
        expiresAt,
      },
    });

    // Deliver via the right channel. If the user supplied an email,
    // deliver via email; if phone, via SMS. If the user has a phone
    // but supplied an email (and we have no email provider), we still
    // try email — the dev console will log the code.
    const delivery = isEmail
      ? await sendOtpEmail(user.email, code, purpose)
      : await sendOtpSms(user.phone ?? normalized, code, purpose);

    const response: Record<string, unknown> = {
      message: 'OTP sent successfully',
      expiresIn: '5 minutes',
      deliveredTo: isEmail
        ? `email ending in @${user.email.split('@').pop()}`
        : `phone ending in ${(user.phone ?? normalized).slice(-4)}`,
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
