// ============================================================
// PreOne — POST /api/teacher/change-password
// Change password for logged-in teacher
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTeacher, isAuthError } from '@/lib/api-auth';
import { comparePassword, hashPassword } from '@/lib/auth';

// POST /api/teacher/change-password
export async function POST(request: NextRequest) {
  try {
    const auth = await requireTeacher(request);
    if (isAuthError(auth)) return auth.error;

    const { teacher } = auth;
    const body = await request.json();

    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'Invalid password format' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Get the linked User record to verify current password
    if (!teacher.userId) {
      return NextResponse.json(
        { error: 'No linked user account found' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: teacher.userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // Compare current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change teacher password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
