import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';

const registerSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

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

    const { schoolName, name, email, phone, password } = result.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: true, message: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create school + admin user in a transaction
    const { school, user } = await prisma.$transaction(async (tx) => {
      // Create the school
      const school = await tx.school.create({
        data: {
          name: schoolName,
          phone,
          email: email.toLowerCase(),
        },
      });

      // Create the admin user
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          phone,
          password: hashedPassword,
          role: 'ADMIN',
          schoolId: school.id,
          isActive: true,
        },
      });

      // Create an audit log for the registration
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          entity: 'User',
          entityId: user.id,
          details: JSON.stringify({
            schoolName,
            email: email.toLowerCase(),
          }),
        },
      });

      return { school, user };
    });

    const response: Record<string, unknown> = {
      error: false,
      message: 'Registration successful',
      userId: user.id,
      schoolId: school.id,
    };

    // In development mode, also return the OTP code for testing
    if (process.env.NODE_ENV === 'development') {
      const { createOTP } = await import('@/lib/auth-utils');
      const otp = await createOTP(email.toLowerCase(), 'LOGIN');
      response.devOtpCode = otp.code;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[REGISTER] Error:', error);
    return NextResponse.json(
      { error: true, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
