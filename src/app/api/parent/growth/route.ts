// ============================================================
// PreOne — GET /api/parent/growth
// Enhanced Growth API with period filtering, class average,
// trend data, milestones with age group detection, AI insights
// Query params: childId, period (Q1/Q2/Q3/Q4/Annual)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError, verifyChildAccess } from '@/lib/api-auth';

const DIMENSIONS = ['creativity', 'communication', 'social', 'confidence', 'cognitive', 'physical'] as const;

function getAgeGroup(dob: Date): string {
  const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (age < 3) return '2-3';
  if (age < 4) return '3-4';
  if (age < 5) return '4-5';
  if (age < 6) return '5-6';
  return '6+';
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');
    const period = searchParams.get('period'); // Q1, Q2, Q3, Q4, Annual

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

    // Get child info
    const child = auth.children.find(c => c.id === targetChildId);
    const childName = child ? `${child.firstName} ${child.lastName}` : 'Child';
    const classId = child?.class?.id || null;

    // Get growth scores for the requested period (or all)
    const periodFilter = period && period !== 'Annual' ? { period } : {};
    const growthScores = await db.growthScore.findMany({
      where: { studentId: targetChildId, ...periodFilter },
      orderBy: { createdAt: 'desc' },
      take: period === 'Annual' ? 10 : 1,
    });

    // If specific period requested but no score, try to find any score
    let scoresToUse = growthScores;
    if (period && period !== 'Annual' && growthScores.length === 0) {
      const anyScore = await db.growthScore.findFirst({
        where: { studentId: targetChildId },
        orderBy: { createdAt: 'desc' },
      });
      if (anyScore) scoresToUse = [anyScore];
    }

    // Get all periods for trend data
    const allScores = await db.growthScore.findMany({
      where: { studentId: targetChildId },
      orderBy: { period: 'asc' },
    });

    // Calculate class average for the same period
    let classAverage: Record<string, number> = {};
    if (classId && scoresToUse.length > 0) {
      const targetPeriod = scoresToUse[0].period;
      // Get all students in the same class
      const classmates = await db.student.findMany({
        where: { classId, status: 'ACTIVE' },
        select: { id: true },
      });
      const classmateIds = classmates.map(s => s.id);

      // Get growth scores for classmates in the same period
      const classScores = await db.growthScore.findMany({
        where: {
          studentId: { in: classmateIds },
          period: targetPeriod,
        },
      });

      if (classScores.length > 0) {
        for (const dim of DIMENSIONS) {
          const sum = classScores.reduce((acc, s) => acc + (s[dim] || 0), 0);
          classAverage[dim] = Math.round(sum / classScores.length);
        }
        const overallSum = classScores.reduce((acc, s) => acc + (s.overall || 0), 0);
        classAverage.overall = Math.round(overallSum / classScores.length);
      }
    }

    // Format trend data
    const trend = allScores.map(s => ({
      period: s.period,
      creativity: s.creativity,
      communication: s.communication,
      social: s.social,
      confidence: s.confidence,
      cognitive: s.cognitive,
      physical: s.physical,
      overall: s.overall ? Math.round(s.overall) : null,
    }));

    // Get achievements
    const achievements = await db.achievement.findMany({
      where: { studentId: targetChildId },
      orderBy: { date: 'desc' },
      take: 10,
    });

    // Get milestones with age group detection
    const ageGroup = child?.dob ? getAgeGroup(child.dob) : '3-4';

    // Get milestone definitions for this age group
    const milestoneDefs = await db.milestone.findMany({
      where: { ageGroup },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Get milestone timelines for this student
    const milestoneTimelines = await db.milestoneTimeline.findMany({
      where: { studentId: targetChildId },
      orderBy: { achievedDate: 'desc' },
    });

    const milestoneMap = new Map(milestoneTimelines.map(m => [m.milestoneId, m]));

    // Combine: for each milestone def, check if student has a timeline entry
    const milestoneItems = milestoneDefs.map(md => {
      const timeline = milestoneMap.get(md.id);
      return {
        id: timeline?.id || md.id,
        milestoneId: md.id,
        name: md.name,
        category: md.category,
        ageGroup: md.ageGroup,
        description: md.description || null,
        achievedDate: timeline?.achievedDate?.toISOString().split('T')[0] || null,
        status: timeline?.status || 'PENDING',
        notes: timeline?.notes || null,
      };
    });

    const achievedCount = milestoneItems.filter(m => m.status === 'ACHIEVED').length;

    // Get AI observations
    const aiObservations = await db.aIObservation.findMany({
      where: { studentId: targetChildId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Format the response
    const latestScore = scoresToUse[0] || allScores[allScores.length - 1] || null;

    // Build scores object for the latest period
    const scores: Record<string, number> = {};
    if (latestScore) {
      for (const dim of DIMENSIONS) {
        scores[dim] = latestScore[dim] || 0;
      }
      scores.overall = latestScore.overall ? Math.round(latestScore.overall) : 0;
    }

    return NextResponse.json({
      childId: targetChildId,
      childName,
      period: latestScore?.period || period || 'N/A',
      scores,
      classAverage,
      trend,
      growthScores: allScores.map(gs => ({
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
      achievements: achievements.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        date: a.date?.toISOString().split('T')[0] || null,
      })),
      milestones: {
        ageGroup,
        total: milestoneItems.length,
        achieved: achievedCount,
        items: milestoneItems,
      },
      aiInsights: aiObservations.map(o => ({
        insight: o.insight,
        dimension: o.dimension,
        severity: o.severity,
      })),
    });
  } catch (error) {
    console.error('Parent growth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
