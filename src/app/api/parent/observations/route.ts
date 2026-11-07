// ============================================================
// PreOne — GET /api/parent/observations
// Teacher observations shared with parent
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
      return NextResponse.json({ observations: [], total: 0 });
    }

    // Only show observations that are shared with parent
    const observations = await db.observation.findMany({
      where: {
        studentId: targetChildId,
        isShared: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Count by category
    const categories: Record<string, number> = {};
    observations.forEach((o) => {
      categories[o.category] = (categories[o.category] || 0) + 1;
    });

    return NextResponse.json({
      observations: observations.map((o) => ({
        id: o.id,
        category: o.category,
        content: o.content,
        priority: o.priority,
        isShared: o.isShared,
        parentAck: o.parentAck,
        parentComment: o.parentComment,
        media: o.media,
        createdAt: o.createdAt.toISOString(),
      })),
      total: observations.length,
      categories,
    });
  } catch (error) {
    console.error('Parent observations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
