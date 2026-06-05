import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/onboarding/sessions — List all onboarding sessions for the school
export async function GET(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;
  const schoolId = user.schoolId;
  if (!schoolId) return NextResponse.json({ error: 'No school' }, { status: 400 });

  const sessions = await db.onboardingDraft.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ sessions });
}

// POST /api/onboarding/sessions — Create a new onboarding session
export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;
  const schoolId = user.schoolId;
  if (!schoolId) return NextResponse.json({ error: 'No school' }, { status: 400 });

  const body = await request.json();
  const name = body.name || 'New Setup';
  const academicYear = body.academicYear || null;

  const session = await db.onboardingDraft.create({
    data: {
      schoolId,
      name,
      academicYear,
      status: 'DRAFT',
      currentStep: 0,
      completedSteps: '[]',
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
