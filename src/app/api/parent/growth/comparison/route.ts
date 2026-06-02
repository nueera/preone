// ============================================================
// PreOne — GET /api/parent/growth/comparison
// Compare growth across multiple children of the same parent
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError } from '@/lib/api-auth';

const DIMENSIONS = ['creativity', 'communication', 'social', 'confidence', 'cognitive', 'physical'] as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    if (auth.children.length < 2) {
      return NextResponse.json({ children: [] });
    }

    const childrenData = [];

    for (const child of auth.children) {
      const latestScore = await db.growthScore.findFirst({
        where: { studentId: child.id },
        orderBy: { createdAt: 'desc' },
      });

      const scores: Record<string, number> = {};
      if (latestScore) {
        for (const dim of DIMENSIONS) {
          scores[dim] = latestScore[dim] || 0;
        }
        scores.overall = latestScore.overall ? Math.round(latestScore.overall) : 0;
      }

      childrenData.push({
        childId: child.id,
        name: `${child.firstName} ${child.lastName}`,
        className: child.class?.name || null,
        overall: scores.overall || 0,
        scores,
      });
    }

    return NextResponse.json({ children: childrenData });
  } catch (error) {
    console.error('Parent growth comparison error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
