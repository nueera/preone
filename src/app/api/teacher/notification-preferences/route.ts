// ============================================================
// PreOne — GET/PATCH /api/teacher/notification-preferences
// Teacher notification preference management
// Stored as JSON in SchoolSetting with key teacher_notifications_{teacherId}
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// Default notification preferences
const DEFAULT_PREFERENCES: Record<string, { push: boolean; email: boolean }> = {
  NEW_ANNOUNCEMENT: { push: true, email: false },
  PARENT_MESSAGE: { push: true, email: true },
  LEAVE_STATUS: { push: true, email: true },
  ATTENDANCE_REMINDER: { push: true, email: false },
  FEE_PAYMENT: { push: false, email: false },
  DAILY_UPDATE_REMINDER: { push: true, email: false },
};

// GET /api/teacher/notification-preferences
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Get schoolId from user's token
    const schoolId = user.schoolId;
    if (!schoolId) {
      return NextResponse.json({
        preferences: DEFAULT_PREFERENCES,
      });
    }

    // Look up stored preferences
    const settingKey = `teacher_notifications_${teacher.id}`;
    const setting = await db.schoolSetting.findUnique({
      where: {
        schoolId_key: {
          schoolId,
          key: settingKey,
        },
      },
    });

    if (!setting) {
      return NextResponse.json({
        preferences: DEFAULT_PREFERENCES,
      });
    }

    // Parse stored preferences and merge with defaults (in case new types were added)
    try {
      const stored = JSON.parse(setting.value) as Record<string, { push: boolean; email: boolean }>;
      const merged = { ...DEFAULT_PREFERENCES };
      for (const [key, value] of Object.entries(stored)) {
        merged[key] = value;
      }
      return NextResponse.json({ preferences: merged });
    } catch {
      return NextResponse.json({
        preferences: DEFAULT_PREFERENCES,
      });
    }
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/teacher/notification-preferences
export async function PATCH(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Get schoolId from user's token
    const schoolId = user.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School not found for this teacher' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { preferences } = body as {
      preferences: Record<string, { push: boolean; email: boolean }>;
    };

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    // Validate each preference value
    for (const [key, value] of Object.entries(preferences)) {
      if (typeof value.push !== 'boolean' || typeof value.email !== 'boolean') {
        return NextResponse.json(
          { error: `Invalid preference value for ${key}` },
          { status: 400 }
        );
      }
    }

    // Upsert the setting
    const settingKey = `teacher_notifications_${teacher.id}`;
    const settingValue = JSON.stringify(preferences);

    await db.schoolSetting.upsert({
      where: {
        schoolId_key: {
          schoolId,
          key: settingKey,
        },
      },
      update: { value: settingValue },
      create: {
        schoolId,
        key: settingKey,
        value: settingValue,
      },
    });

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      preferences,
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
