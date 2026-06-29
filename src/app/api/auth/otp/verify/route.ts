import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';

// ============================================================
// POST /api/auth/otp/verify
// Verifies a 6-digit OTP against the stored record and, for
// `purpose: "login"`, returns a JWT token + user object identical
// to the password login flow.
//
// Request body (any of these shapes — backward compatible):
//   { identifier: "user@example.com" | "+91...", code: "123456" }  ← preferred
//   { email: "user@example.com", code: "123456" }                  ← alias
//   { phone: "+91...", code: "123456" }                            ← alias
//   { purpose?: "login" | "verify_email" | "reset_password" }      (default "login")
//
// The `identifier` is auto-detected: if it contains "@", it's treated
// as an email; otherwise as a phone.
// ============================================================

function looksLikeEmail(value: string): boolean {
  return value.includes('@');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, code, purpose = 'login' } = body;

    // Accept `identifier` (preferred) OR `email` OR `phone` (backward compat)
    const identifier: string | undefined = body.identifier ?? email ?? phone;

    if (!identifier || !code) {
      return NextResponse.json(
        { error: 'Email/phone and OTP code are required' },
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
      include: { branch: true },
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

    // Find valid OTP (keyed by email — see Otp model)
    const otp = await db.otp.findFirst({
      where: {
        email: user.email,
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
        data: { lastLogin: new Date() },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.branchId,
        schoolId: user.schoolId,
      });

      const { password: _password, ...userWithoutPassword } = user;

      return NextResponse.json({
        message: 'OTP verified successfully',
        token,
        user: userWithoutPassword,
      });
    }

    if (purpose === 'verify_email' || purpose === 'reset_password') {
      // The OTP itself being marked as used (above) is the verification
      // signal. The User model has no `isVerified` field, so we don't
      // persist anything additional here — callers (e.g. forgot-password
      // flow) rely on the OTP record's `isUsed: true` state instead.
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
