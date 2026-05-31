import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, phone, role, branchId, firstName, lastName } = body;

    // Validation
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    const validRoles = ['SuperAdmin', 'Owner', 'Admin', 'Teacher', 'Parent'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const passwordHash = hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        phone,
        role,
        branchId,
        isVerified: role === 'SuperAdmin', // Auto-verify super admin
      },
      include: {
        branch: true,
      },
    });

    // If registering as Teacher, create Teacher profile
    if (role === 'Teacher' && firstName && lastName && branchId) {
      await db.teacher.create({
        data: {
          userId: user.id,
          branchId,
          firstName,
          lastName,
          phone,
          email,
        },
      });
    }

    // If registering as Parent, create Parent profile
    if (role === 'Parent' && firstName && lastName) {
      await db.parent.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone: phone || '',
          email,
        },
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: 'Registration successful',
        token,
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
