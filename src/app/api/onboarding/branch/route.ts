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
  const { sessionId, branches } = body;

  if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  const session = await db.onboardingDraft.findUnique({ where: { id: sessionId } });
  if (!session || session.schoolId !== schoolId) return NextResponse.json({ error: 'Invalid session' }, { status: 403 });

  await db.onboardingDraft.update({
    where: { id: sessionId },
    data: { step2Branch: JSON.stringify(body) },
  });

  await markStepComplete(sessionId, 1);
  return NextResponse.json({ success: true });
}
