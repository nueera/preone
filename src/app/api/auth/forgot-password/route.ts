// ============================================================
// POST /api/auth/forgot-password
// Generates a 6-digit OTP, saves to Otp table with 10min expiry
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account with this email exists, an OTP has been sent',
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP to database (invalidate any existing unused OTPs for this email first)
    await db.otp.updateMany({
      where: {
        email: email.toLowerCase().trim(),
        purpose: 'PASSWORD_RESET',
        isUsed: false,
      },
      data: { isUsed: true },
    });

    await db.otp.create({
      data: {
        email: email.toLowerCase().trim(),
        code: otp,
        purpose: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    // In production, send OTP via email/SMS
    // For now, log it to the console
    console.log(`[FORGOT PASSWORD] OTP for ${email}: ${otp}`);

    return NextResponse.json({
      message: 'If an account with this email exists, an OTP has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
