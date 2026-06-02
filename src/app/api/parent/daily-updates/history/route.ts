// ============================================================
// PreOne — GET /api/parent/daily-updates/history
// Monthly history of published daily updates for a child
// Query params: childId (required), month (1-12), year (YYYY)
// Returns: array of published updates for the month
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

    const now = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()));

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid month or year parameter' },
        { status: 400 }
      );
    }

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const updates = await db.dailyUpdate.findMany({
      where: {
        studentId: childId,
        status: 'PUBLISHED',
        date: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { date: 'desc' },
    });

    // ── Calculate weekly summary stats ──
    const totalDays = updates.length;
    const breakfastEaten = updates.filter((u) => u.breakfast === 'EATEN').length;
    const breakfastPartial = updates.filter((u) => u.breakfast === 'PARTIAL').length;
    const lunchEaten = updates.filter((u) => u.lunch === 'EATEN').length;
    const lunchPartial = updates.filter((u) => u.lunch === 'PARTIAL').length;
    const snacksEaten = updates.filter((u) => u.snacks === 'EATEN').length;
    const snacksPartial = updates.filter((u) => u.snacks === 'PARTIAL').length;

    const moodCounts: Record<string, number> = {};
    updates.forEach((u) => {
      if (u.moodMorning) moodCounts[u.moodMorning] = (moodCounts[u.moodMorning] || 0) + 1;
      if (u.moodAfternoon) moodCounts[u.moodAfternoon] = (moodCounts[u.moodAfternoon] || 0) + 1;
    });

    const waterAvg = totalDays > 0
      ? Math.round(updates.reduce((sum, u) => sum + u.waterGlasses, 0) / totalDays * 10) / 10
      : 0;

    const sleepDurations: number[] = [];
    updates.forEach((u) => {
      if (u.sleepStart && u.sleepEnd) {
        try {
          const [inH, inM] = u.sleepStart.split(':').map(Number);
          const [outH, outM] = u.sleepEnd.split(':').map(Number);
          let inMinutes = inH * 60 + inM;
          let outMinutes = outH * 60 + outM;
          if (outMinutes < inMinutes) outMinutes += 24 * 60;
          const diff = outMinutes - inMinutes;
          if (diff > 0) sleepDurations.push(diff / 60); // hours
        } catch { /* skip */ }
      }
    });

    const sleepAvg = sleepDurations.length > 0
      ? Math.round(sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length * 10) / 10
      : 0;

    // Collect highlights for the period
    const highlightsCollection = updates
      .filter((u) => u.highlights)
      .map((u) => ({
        date: u.date.toISOString().split('T')[0],
        text: u.highlights!,
      }));

    // Mood trend per day
    const moodTrend = updates.map((u) => ({
      date: u.date.toISOString().split('T')[0],
      moodMorning: u.moodMorning,
      moodAfternoon: u.moodAfternoon,
    }));

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
      summary: {
        totalDays,
        food: {
          breakfast: { eaten: breakfastEaten, partial: breakfastPartial, total: totalDays },
          lunch: { eaten: lunchEaten, partial: lunchPartial, total: totalDays },
          snacks: { eaten: snacksEaten, partial: snacksPartial, total: totalDays },
        },
        moodCounts,
        moodTrend,
        sleepAvgHours: sleepAvg,
        waterAvgGlasses: waterAvg,
        highlights: highlightsCollection,
      },
      month,
      year,
    });
  } catch (error) {
    console.error('Parent daily-updates/history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
