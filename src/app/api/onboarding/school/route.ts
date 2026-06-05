import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { markStepComplete } from '../_helpers';

export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;
  const schoolId = user.schoolId;
  if (!schoolId) return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });

  const body = await request.json();
  const { sessionId, name, address, city, state, pincode, country, phone, email, website, board, schoolCode, subdomain, theme } = body;

  if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });

  const session = await db.onboardingDraft.findUnique({ where: { id: sessionId } });
  if (!session || session.schoolId !== schoolId) return NextResponse.json({ error: 'Invalid session' }, { status: 403 });

  if (name) {
    await db.school.update({
      where: { id: schoolId },
      data: {
        name, address: address || undefined, city: city || undefined, state: state || undefined,
        pincode: pincode || undefined, country: country || undefined, phone: phone || undefined,
        email: email || undefined, website: website || undefined, board: board || undefined,
        schoolCode: schoolCode || undefined, theme: theme || undefined,
      },
    });
  }

  await db.onboardingDraft.update({
    where: { id: sessionId },
    data: { step1School: JSON.stringify(body) },
  });

  await markStepComplete(sessionId, 0);
  return NextResponse.json({ success: true });
}
