// ============================================================
// POST /api/auth/login
// Authenticates user with email + password, returns JWT token
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, generateToken, Role } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email OR username
    const identifier = email.toLowerCase().trim();

    let user = await db.user.findUnique({
      where: { email: identifier },
      include: {
        branch: true,
        teacher: true,
      },
    });

    // If not found by email, try username
    if (!user) {
      user = await db.user.findUnique({
        where: { username: identifier },
        include: {
          branch: true,
          teacher: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated. Contact administrator.' },
        { status: 403 }
      );
    }

    // Compare password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create audit log for login
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    });

    // Generate JWT token with HMAC-SHA256
    const userRole = user.role as Role;
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
      branchId: user.branchId,
      schoolId: user.schoolId,
    });

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        branchId: user.branchId,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        branch: user.branch,
        teacher: user.teacher,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
