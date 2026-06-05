import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/reports/growth — Growth report data
export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId') || '';
    const period = searchParams.get('period') || '';

    const where: Record<string, unknown> = {};
    if (period) where.period = period;

    const scores = await db.growthScore.findMany({
      where,
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, rollNumber: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by class
    let filtered = scores;
    if (classId) {
      filtered = scores.filter(s => s.student.classId === classId);
    }

    // Averages
    const dims = ['creativity', 'communication', 'social', 'confidence', 'cognitive', 'physical'] as const;
    const averages: Record<string, number> = {};
    for (const dim of dims) {
      const vals = filtered.map(s => s[dim]).filter(Boolean) as number[];
      averages[dim] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    }

    const overallVals = filtered.map(s => s.overall).filter(Boolean) as number[];
    averages.overall = overallVals.length > 0 ? Math.round(overallVals.reduce((a, b) => a + b, 0) / overallVals.length * 10) / 10 : 0;

    return NextResponse.json({
      summary: {
        totalStudents: new Set(filtered.map(s => s.studentId)).size,
        totalAssessments: filtered.length,
        averages,
      },
      records: filtered.map(s => ({
        studentName: `${s.student.firstName} ${s.student.lastName}`,
        rollNumber: s.student.rollNumber || '-',
        className: s.student.class?.name || '-',
        period: s.period,
        creativity: s.creativity,
        communication: s.communication,
        social: s.social,
        confidence: s.confidence,
        cognitive: s.cognitive,
        physical: s.physical,
        overall: s.overall || '-',
        comments: s.comments || '-',
      })),
      dateRange: { from: period || 'All periods', to: '' },
    });
  } catch (error) {
    console.error('Growth report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
