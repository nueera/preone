import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { markStepComplete } from '../_helpers';

interface DailyUpdatesInput {
  sendAttendance?: boolean;
  sendMood?: boolean;
  sendActivities?: boolean;
  sendMeals?: boolean;
  sendNap?: boolean;
  sendPhotos?: boolean;
  sendNotes?: boolean;
  sendTime?: string;
  sendAt?: string;
  notifyVia?: string;
}

export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  const body = await request.json();
  const { sendAttendance, sendMood, sendActivities, sendMeals, sendNap, sendPhotos, sendNotes, sendTime, sendAt, notifyVia } = body as DailyUpdatesInput;

  // Create or update DailyUpdateConfig
  const config = await db.dailyUpdateConfig.upsert({
    where: { schoolId },
    update: {
      sendAttendance: sendAttendance ?? undefined,
      sendMood: sendMood ?? undefined,
      sendActivities: sendActivities ?? undefined,
      sendMeals: sendMeals ?? undefined,
      sendNap: sendNap ?? undefined,
      sendPhotos: sendPhotos ?? undefined,
      sendNotes: sendNotes ?? undefined,
      sendTime: sendTime ?? undefined,
      sendAt: sendAt ?? undefined,
      notifyVia: notifyVia ?? undefined,
    },
    create: {
      schoolId,
      sendAttendance: sendAttendance ?? true,
      sendMood: sendMood ?? true,
      sendActivities: sendActivities ?? true,
      sendMeals: sendMeals ?? true,
      sendNap: sendNap ?? true,
      sendPhotos: sendPhotos ?? true,
      sendNotes: sendNotes ?? true,
      sendTime: sendTime ?? 'end_of_day',
      sendAt: sendAt ?? null,
      notifyVia: notifyVia ?? 'app,email',
    },
  });

  // Save to onboarding draft
  await db.onboardingDraft.upsert({
    where: { schoolId },
    update: { step7Updates: JSON.stringify(body) },
    create: { schoolId, step7Updates: JSON.stringify(body) },
  });

  // Mark step 6 as completed
  await markStepComplete(schoolId, 6);

  return NextResponse.json({ success: true, config });
}
