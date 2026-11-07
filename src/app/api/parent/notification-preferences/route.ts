// ============================================================
// PreOne — GET/PATCH /api/parent/notification-preferences
// Get and update notification preferences for parent
// Creates default preferences on first GET if none exist
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireParent, isAuthError } from '@/lib/api-auth';
import { db } from '@/lib/db';

// All preference field names for validation
const PREF_FIELDS = [
  'dailyUpdateApp', 'dailyUpdateSms', 'dailyUpdateEmail',
  'observationApp', 'observationSms', 'observationEmail',
  'feeReminderApp', 'feeReminderSms', 'feeReminderEmail',
  'feeOverdueApp', 'feeOverdueSms', 'feeOverdueEmail',
  'attendanceApp', 'attendanceSms', 'attendanceEmail',
  'announcementApp', 'announcementSms', 'announcementEmail',
  'teacherMessageApp', 'teacherMessageSms', 'teacherMessageEmail',
  'leaveStatusApp', 'leaveStatusSms', 'leaveStatusEmail',
] as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    // Get or create notification preferences
    let preferences = await db.notificationPreference.findUnique({
      where: { parentId: auth.parent.id },
    });

    if (!preferences) {
      // Create default preferences
      preferences = await db.notificationPreference.create({
        data: {
          parentId: auth.parent.id,
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const body = await request.json();

    // Validate and extract allowed fields
    const updateData: Record<string, boolean> = {};
    for (const field of PREF_FIELDS) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'boolean') {
          return NextResponse.json(
            { error: `Field ${field} must be a boolean` },
            { status: 400 }
          );
        }
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Upsert preferences (create if doesn't exist)
    const preferences = await db.notificationPreference.upsert({
      where: { parentId: auth.parent.id },
      update: updateData,
      create: {
        parentId: auth.parent.id,
        ...updateData,
      },
    });

    return NextResponse.json({
      message: 'Notification preferences updated',
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
