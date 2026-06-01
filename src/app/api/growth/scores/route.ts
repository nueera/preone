import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// POST /api/growth/scores — Add/update growth scores (bulk upsert)
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { scores } = body;

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json({ error: 'scores array is required' }, { status: 400 });
    }

    const results = [];

    for (const score of scores) {
      const { studentId, period, creativity, communication, social, confidence, cognitive, physical, comments, assessedBy } = score;

      if (!studentId || !period) {
        results.push({ studentId, error: 'studentId and period are required' });
        continue;
      }

      // Calculate overall
      const dims = [creativity || 0, communication || 0, social || 0, confidence || 0, cognitive || 0, physical || 0];
      const overall = Math.round(dims.reduce((a: number, b: number) => a + b, 0) / dims.length * 10) / 10;

      // Upsert: update if exists for same studentId + period, create otherwise
      try {
        const upserted = await db.growthScore.upsert({
          where: {
            studentId_period: { studentId, period },
          },
          update: {
            creativity: creativity ?? undefined,
            communication: communication ?? undefined,
            social: social ?? undefined,
            confidence: confidence ?? undefined,
            cognitive: cognitive ?? undefined,
            physical: physical ?? undefined,
            overall,
            comments: comments ?? undefined,
            assessedBy: assessedBy ?? undefined,
          },
          create: {
            studentId,
            period,
            creativity: creativity || 0,
            communication: communication || 0,
            social: social || 0,
            confidence: confidence || 0,
            cognitive: cognitive || 0,
            physical: physical || 0,
            overall,
            comments: comments || null,
            assessedBy: assessedBy || null,
          },
        });
        results.push({ studentId, id: upserted.id, success: true });
      } catch (err) {
        results.push({ studentId, error: 'Failed to upsert score' });
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} scores`,
      results,
    });
  } catch (error) {
    console.error('Bulk growth scores error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
