import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/onboarding/sessions/[sessionId] — Get a specific session with parsed step data
export async function GET(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;
  const { sessionId } = await params;

  const session = await db.onboardingDraft.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (session.schoolId !== user.schoolId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parseJSON = (str: string | null, fallback: unknown = null) => {
    if (!str) return fallback;
    try { return JSON.parse(str); } catch { return fallback; }
  };

  return NextResponse.json({
    session: {
      ...session,
      completedSteps: parseJSON(session.completedSteps, []),
      step1School: parseJSON(session.step1School),
      step2Branch: parseJSON(session.step2Branch),
      step3Academic: parseJSON(session.step3Academic),
      step4Subjects: parseJSON(session.step4Subjects),
      step5Teachers: parseJSON(session.step5Teachers),
      step6Students: parseJSON(session.step6Students),
      step7Updates: parseJSON(session.step7Updates),
    },
  });
}

// PUT /api/onboarding/sessions/[sessionId] — Update session (name, status, academicYear)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;
  const { sessionId } = await params;

  const session = await db.onboardingDraft.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (session.schoolId !== user.schoolId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const updated = await db.onboardingDraft.update({
    where: { id: sessionId },
    data: {
      name: body.name ?? undefined,
      academicYear: body.academicYear ?? undefined,
      status: body.status ?? undefined,
    },
  });

  return NextResponse.json({ session: updated });
}

// DELETE /api/onboarding/sessions/[sessionId] — Delete a session
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;
  const { sessionId } = await params;

  const session = await db.onboardingDraft.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (session.schoolId !== user.schoolId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.onboardingDraft.delete({ where: { id: sessionId } });
  return NextResponse.json({ success: true });
}
