// ============================================================
// PreOne — GET /api/parent/daily-updates
// Daily update for a specific date (only PUBLISHED)
// Query params: childId (required), date (YYYY-MM-DD, optional — defaults to today)
// Returns: single update with teacherName, or null if none published
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

    // Verify this child belongs to this parent
    const accessError = verifyChildAccess(auth, childId);
    if (accessError) return accessError;

    // Get child info
    const childInfo = auth.children.find((c) => c.id === childId);
    const childName = childInfo
      ? `${childInfo.firstName} ${childInfo.lastName}`
      : '';

    // Parse date or default to today
    const dateParam = searchParams.get('date');
    const targetDate = dateParam
      ? new Date(dateParam)
      : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Fetch the PUBLISHED update for this date
    const update = await db.dailyUpdate.findFirst({
      where: {
        studentId: childId,
        status: 'PUBLISHED',
        date: { gte: targetDate, lte: dayEnd },
      },
    });

    // If no update for the requested date, also find the latest published update
    // so we can show "last update was on X date"
    const latestUpdate = await db.dailyUpdate.findFirst({
      where: {
        studentId: childId,
        status: 'PUBLISHED',
      },
      orderBy: { date: 'desc' },
      select: { date: true, id: true },
    });

    // If there's an update, fetch teacher name
    let teacherName: string | null = null;
    if (update?.teacherId) {
      const teacher = await db.teacher.findUnique({
        where: { id: update.teacherId },
        select: { firstName: true, lastName: true },
      });
      if (teacher) {
        teacherName = `${teacher.firstName} ${teacher.lastName}`;
      }
    }

    // Calculate sleep duration if both start and end exist
    let sleepDuration: string | null = null;
    if (update?.sleepStart && update?.sleepEnd) {
      try {
        const [inH, inM] = update.sleepStart.split(':').map(Number);
        const [outH, outM] = update.sleepEnd.split(':').map(Number);
        let inMinutes = inH * 60 + inM;
        let outMinutes = outH * 60 + outM;
        // Handle overnight sleep (e.g., 23:00 → 06:00)
        if (outMinutes < inMinutes) {
          outMinutes += 24 * 60;
        }
        const diff = outMinutes - inMinutes;
        if (diff > 0) {
          const hours = Math.floor(diff / 60);
          const mins = diff % 60;
          sleepDuration = mins > 0 ? `${hours}.${mins * 10 / 6 < 5 ? '' : '5'} hours` : `${hours} hours`;
          // More precise: show "1h 30m" format
          sleepDuration = hours > 0
            ? mins > 0
              ? `${hours}h ${mins}m`
              : `${hours}h`
            : `${mins}m`;
        }
      } catch {
        sleepDuration = null;
      }
    }

    return NextResponse.json({
      childId,
      childName,
      date: targetDate.toISOString().split('T')[0],
      update: update
        ? {
            id: update.id,
            date: update.date.toISOString().split('T')[0],
            breakfast: update.breakfast,
            breakfastMenu: update.breakfastMenu,
            lunch: update.lunch,
            lunchMenu: update.lunchMenu,
            snacks: update.snacks,
            snacksMenu: update.snacksMenu,
            sleepStart: update.sleepStart,
            sleepEnd: update.sleepEnd,
            sleepDuration,
            sleepQuality: update.sleepQuality,
            moodMorning: update.moodMorning,
            moodAfternoon: update.moodAfternoon,
            pottyCount: update.pottyCount,
            pottyType: update.pottyType,
            waterGlasses: update.waterGlasses,
            highlights: update.highlights,
            status: update.status,
            publishedAt: update.publishedAt?.toISOString() || null,
            teacherName,
          }
        : null,
      latestUpdateDate: latestUpdate?.date.toISOString().split('T')[0] || null,
    });
  } catch (error) {
    console.error('Parent daily-updates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
