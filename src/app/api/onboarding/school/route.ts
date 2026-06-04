import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { markStepComplete } from '../_helpers';

export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  const body = await request.json();
  const { name, address, city, state, pincode, country, phone, email, website, board, schoolCode, subdomain, theme } = body;

  if (!name) {
    return NextResponse.json({ error: 'School name is required' }, { status: 400 });
  }

  // Update school record
  const school = await db.school.update({
    where: { id: schoolId },
    data: {
      name,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      pincode: pincode || undefined,
      country: country || undefined,
      phone: phone || undefined,
      email: email || undefined,
      website: website || undefined,
      board: board || undefined,
      schoolCode: schoolCode || undefined,
      theme: theme || undefined,
    },
  });

  // Save to onboarding draft
  await db.onboardingDraft.upsert({
    where: { schoolId },
    update: { step1School: JSON.stringify(body) },
    create: { schoolId, step1School: JSON.stringify(body) },
  });

  // Mark step 0 as completed
  await markStepComplete(schoolId, 0);

  return NextResponse.json({ success: true, school });
}
