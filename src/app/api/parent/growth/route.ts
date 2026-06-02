// ============================================================
// PreOne — GET /api/parent/growth
// Growth scores and milestones for parent's children
// Query params: childId
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

    // Determine target child
    let targetChildId = auth.childIds[0];
    if (childId) {
      const accessError = verifyChildAccess(auth, childId);
      if (accessError) return accessError;
      targetChildId = childId;
    }

    if (!targetChildId) {
      return NextResponse.json({ growthScores: [], achievements: [], milestones: [] });
    }

    // Get growth scores
    const growthScores = await db.growthScore.findMany({
      where: { studentId: targetChildId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get achievements
    const achievements = await db.achievement.findMany({
      where: { studentId: targetChildId },
      orderBy: { date: 'desc' },
      take: 10,
    });

    // Get milestone timelines (no milestone relation, just milestoneId)
    const milestones = await db.milestoneTimeline.findMany({
      where: { studentId: targetChildId },
      orderBy: { achievedDate: 'desc' },
      take: 20,
    });

    // If there are milestones, fetch the related milestone details
    const milestoneIds = milestones.map((m) => m.milestoneId).filter(Boolean);
    const milestoneDetails = milestoneIds.length > 0
      ? await db.milestone.findMany({
          where: { id: { in: milestoneIds } },
        })
      : [];

    const milestoneMap = new Map(milestoneDetails.map((m) => [m.id, m]));

    return NextResponse.json({
      growthScores: growthScores.map((gs) => ({
        id: gs.id,
        period: gs.period,
        creativity: gs.creativity,
        communication: gs.communication,
        social: gs.social,
        confidence: gs.confidence,
        cognitive: gs.cognitive,
        physical: gs.physical,
        overall: gs.overall ? Math.round(gs.overall) : null,
        comments: gs.comments,
        createdAt: gs.createdAt.toISOString(),
      })),
      achievements: achievements.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        date: a.date?.toISOString().split('T')[0] || null,
      })),
      milestones: milestones.map((m) => {
        const detail = milestoneMap.get(m.milestoneId);
        return {
          id: m.id,
          milestoneId: m.milestoneId,
          milestoneName: detail?.name || null,
          milestoneCategory: detail?.category || null,
          milestoneAgeGroup: detail?.ageGroup || null,
          achievedDate: m.achievedDate?.toISOString().split('T')[0] || null,
          status: m.status,
          notes: m.notes,
        };
      }),
    });
  } catch (error) {
    console.error('Parent growth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
