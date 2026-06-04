import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  const draft = await db.onboardingDraft.findUnique({ where: { schoolId } });
  if (!draft) {
    return NextResponse.json({ draft: null });
  }

  return NextResponse.json({
    draft: {
      currentStep: draft.currentStep,
      completedSteps: JSON.parse(draft.completedSteps || '[]'),
      step1School: draft.step1School ? JSON.parse(draft.step1School) : null,
      step2Branch: draft.step2Branch ? JSON.parse(draft.step2Branch) : null,
      step3Academic: draft.step3Academic ? JSON.parse(draft.step3Academic) : null,
      step4Subjects: draft.step4Subjects ? JSON.parse(draft.step4Subjects) : null,
      step5Teachers: draft.step5Teachers ? JSON.parse(draft.step5Teachers) : null,
      step6Students: draft.step6Students ? JSON.parse(draft.step6Students) : null,
      step7Updates: draft.step7Updates ? JSON.parse(draft.step7Updates) : null,
    },
  });
}

export async function PUT(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  const body = await request.json();
  const { currentStep, completedSteps, step1School, step2Branch, step3Academic, step4Subjects, step5Teachers, step6Students, step7Updates } = body;

  const draft = await db.onboardingDraft.upsert({
    where: { schoolId },
    update: {
      currentStep: currentStep ?? undefined,
      completedSteps: completedSteps ? JSON.stringify(completedSteps) : undefined,
      step1School: step1School ? JSON.stringify(step1School) : undefined,
      step2Branch: step2Branch ? JSON.stringify(step2Branch) : undefined,
      step3Academic: step3Academic ? JSON.stringify(step3Academic) : undefined,
      step4Subjects: step4Subjects ? JSON.stringify(step4Subjects) : undefined,
      step5Teachers: step5Teachers ? JSON.stringify(step5Teachers) : undefined,
      step6Students: step6Students ? JSON.stringify(step6Students) : undefined,
      step7Updates: step7Updates ? JSON.stringify(step7Updates) : undefined,
    },
    create: {
      schoolId,
      currentStep: currentStep ?? 0,
      completedSteps: completedSteps ? JSON.stringify(completedSteps) : '[]',
      step1School: step1School ? JSON.stringify(step1School) : null,
      step2Branch: step2Branch ? JSON.stringify(step2Branch) : null,
      step3Academic: step3Academic ? JSON.stringify(step3Academic) : null,
      step4Subjects: step4Subjects ? JSON.stringify(step4Subjects) : null,
      step5Teachers: step5Teachers ? JSON.stringify(step5Teachers) : null,
      step6Students: step6Students ? JSON.stringify(step6Students) : null,
      step7Updates: step7Updates ? JSON.stringify(step7Updates) : null,
    },
  });

  return NextResponse.json({ draft });
}
