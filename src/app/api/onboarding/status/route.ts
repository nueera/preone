import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/onboarding/status
 * Returns the onboarding status and draft data for the current school.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const school = await db.school.findFirst({
      where: { id: payload.schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const draft = await db.onboardingDraft.findUnique({
      where: { schoolId: school.id },
    });

    // Parse draft data from JSON strings
    const parseJSON = (str: string | null | undefined, fallback: unknown = null) => {
      if (!str) return fallback;
      try { return JSON.parse(str); } catch { return fallback; }
    };

    return NextResponse.json({
      onboardingComplete: school.onboardingComplete,
      currentStep: draft?.currentStep ?? 1,
      completedSteps: parseJSON(draft?.completedSteps, []),
      draft: draft ? {
        schoolName: school.name ?? '',
        schoolLogo: school.logo ?? '',
        schoolPhone: school.phone ?? '',
        schoolEmail: school.email ?? '',
        schoolAddress: school.address ?? '',
        schoolType: school.board ?? '',
        schoolBoard: school.board ?? '',
        schoolWebsite: school.website ?? '',
        branches: parseJSON(draft.step2Branch, []),
        academicYear: parseJSON(draft.step3Academic, {}).name ?? '',
        academicYearStart: parseJSON(draft.step3Academic, {}).startDate ?? '',
        academicYearEnd: parseJSON(draft.step3Academic, {}).endDate ?? '',
        classes: parseJSON(draft.step3Academic, {}).classes ?? [],
        subjects: parseJSON(draft.step4Subjects, []),
        teachers: parseJSON(draft.step5Teachers, []),
        students: parseJSON(draft.step6Students, []),
        dailyUpdatesEnabled: !!draft.step7Updates,
        updateCategories: parseJSON(draft.step7Updates, {}).categories ?? [],
      } : {
        schoolName: school.name ?? '',
        schoolLogo: school.logo ?? '',
        schoolPhone: school.phone ?? '',
        schoolEmail: school.email ?? '',
        schoolAddress: school.address ?? '',
        schoolType: school.board ?? '',
        schoolBoard: school.board ?? '',
        schoolWebsite: school.website ?? '',
        branches: [],
        academicYear: '',
        academicYearStart: '',
        academicYearEnd: '',
        classes: [],
        subjects: [],
        teachers: [],
        students: [],
        dailyUpdatesEnabled: false,
        updateCategories: [],
      },
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
