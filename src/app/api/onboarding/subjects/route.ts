import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { markStepComplete } from '../_helpers';

interface SubjectInput {
  name: string;
  type?: string;
  color?: string;
  classId?: string;
}

export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  const body = await request.json();
  const { subjects } = body as { subjects: SubjectInput[] };

  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json({ error: 'At least one subject is required' }, { status: 400 });
  }

  // Store subjects as JSON in SchoolSetting
  await db.schoolSetting.upsert({
    where: { schoolId_key: { schoolId, key: 'subjects' } },
    update: { value: JSON.stringify(subjects) },
    create: { schoolId, key: 'subjects', value: JSON.stringify(subjects) },
  });

  // Save to onboarding draft
  await db.onboardingDraft.upsert({
    where: { schoolId },
    update: { step4Subjects: JSON.stringify(body) },
    create: { schoolId, step4Subjects: JSON.stringify(body) },
  });

  // Mark step 3 as completed
  await markStepComplete(schoolId, 3);

  return NextResponse.json({ success: true, subjects });
}
