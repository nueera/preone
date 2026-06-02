// ============================================================
// PreOne — GET /api/parent/daily-updates
// Daily updates for parent's children (only PUBLISHED)
// Query params: childId, date (YYYY-MM-DD)
// Uses requireParent for consistent auth
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
    const date = searchParams.get('date');

    // Determine target child
    let targetChildId = auth.childIds[0];
    if (childId) {
      const accessError = verifyChildAccess(auth, childId);
      if (accessError) return accessError;
      targetChildId = childId;
    }

    if (!targetChildId) {
      return NextResponse.json({ updates: [], date: date || new Date().toISOString().split('T')[0] });
    }

    // Build date filter
    let dateFilter: Record<string, Date> = {};
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);
      dateFilter = { gte: targetDate, lte: dayEnd };
    }

    const where: Record<string, unknown> = {
      studentId: targetChildId,
      status: 'PUBLISHED',
    };
    if (date) {
      where.date = dateFilter;
    }

    const updates = await db.dailyUpdate.findMany({
      where,
      orderBy: { date: 'desc' },
      take: date ? 1 : 10,
    });

    return NextResponse.json({
      updates: updates.map((u) => ({
        id: u.id,
        date: u.date.toISOString().split('T')[0],
        breakfast: u.breakfast,
        breakfastMenu: u.breakfastMenu,
        lunch: u.lunch,
        lunchMenu: u.lunchMenu,
        snacks: u.snacks,
        snacksMenu: u.snacksMenu,
        sleepStart: u.sleepStart,
        sleepEnd: u.sleepEnd,
        sleepQuality: u.sleepQuality,
        moodMorning: u.moodMorning,
        moodAfternoon: u.moodAfternoon,
        pottyCount: u.pottyCount,
        pottyType: u.pottyType,
        waterGlasses: u.waterGlasses,
        highlights: u.highlights,
        publishedAt: u.publishedAt?.toISOString() || null,
      })),
      date: date || new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Parent daily updates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
