import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/onboarding/draft
 * Returns the onboarding draft for the current school.
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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
  } catch (error) {
    console.error('Draft GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 });
  }
}

/**
 * POST /api/onboarding/draft
 * Save the current onboarding draft (auto-save).
 * Also syncs school profile data from the draft's step1 fields.
 */
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const schoolId = user.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      currentStep,
      completedSteps,
      step1School,
      step2Branch,
      step3Academic,
      step4Subjects,
      step5Teachers,
      step6Students,
      step7Updates,
    } = body;

    // Only update the draft (school profile is updated separately via /api/settings/school or on completion)
    await db.onboardingDraft.upsert({
      where: { schoolId },
      update: {
        currentStep: (currentStep as number) ?? undefined,
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
        currentStep: (currentStep as number) ?? 0,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Draft POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save draft', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/onboarding/draft
 * Update the onboarding draft.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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
  } catch (error) {
    console.error('Draft PUT error:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}
