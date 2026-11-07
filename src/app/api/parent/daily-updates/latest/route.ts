// ============================================================
// PreOne — GET /api/parent/daily-updates/latest
// Returns the most recent published daily update (for dashboard quick view)
// Query params: childId (required)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError, verifyChildAccess } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json(
        { error: 'childId query parameter is required' },
        { status: 400 }
      );
    }

    const accessError = verifyChildAccess(auth, childId);
    if (accessError) return accessError;

    const update = await db.dailyUpdate.findFirst({
      where: {
        studentId: childId,
        status: 'PUBLISHED',
      },
      orderBy: { date: 'desc' },
    });

    if (!update) {
      return NextResponse.json({ update: null });
    }

    // Fetch teacher name
    let teacherName: string | null = null;
    if (update.teacherId) {
      const teacher = await db.teacher.findUnique({
        where: { id: update.teacherId },
        select: { firstName: true, lastName: true },
      });
      if (teacher) {
        teacherName = `${teacher.firstName} ${teacher.lastName}`;
      }
    }

    return NextResponse.json({
      update: {
        id: update.id,
        date: update.date.toISOString().split('T')[0],
        breakfast: update.breakfast,
        lunch: update.lunch,
        snacks: update.snacks,
        moodMorning: update.moodMorning,
        moodAfternoon: update.moodAfternoon,
        highlights: update.highlights,
        waterGlasses: update.waterGlasses,
        sleepQuality: update.sleepQuality,
        publishedAt: update.publishedAt?.toISOString() || null,
        teacherName,
      },
    });
  } catch (error) {
    console.error('Parent daily-updates/latest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
