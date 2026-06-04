import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  // Set onboardingComplete = true on School
  await db.school.update({
    where: { id: schoolId },
    data: { onboardingComplete: true },
  });

  // Delete OnboardingDraft (cleanup)
  await db.onboardingDraft.deleteMany({
    where: { schoolId },
  });

  return NextResponse.json({ success: true, message: 'Onboarding complete!' });
}
