import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/growth/top-performers — Students with overall > 80
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const period = request.nextUrl.searchParams.get('period') || '';
    const classId = request.nextUrl.searchParams.get('classId') || '';

    const where: Record<string, unknown> = {};
    if (period) where.period = period;

    const growthScores = await db.growthScore.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            classId: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    const topPerformers = growthScores
      .filter((gs) => {
        if (classId && gs.student.classId !== classId) return false;
        return gs.overall && gs.overall >= 80;
      })
      .map((gs) => {
        const dims = [
          { name: 'Creativity', value: gs.creativity },
          { name: 'Communication', value: gs.communication },
          { name: 'Social Skills', value: gs.social },
          { name: 'Confidence', value: gs.confidence },
          { name: 'Cognitive', value: gs.cognitive },
          { name: 'Physical', value: gs.physical },
        ];
        dims.sort((a, b) => b.value - a.value);
        return {
          studentId: gs.student.id,
          studentName: `${gs.student.firstName} ${gs.student.lastName}`,
          className: gs.student.class?.name || 'Unassigned',
          strongDimension: dims[0].name,
          overall: gs.overall,
          period: gs.period,
        };
      })
      .sort((a, b) => b.overall - a.overall);

    return NextResponse.json({ students: topPerformers });
  } catch (error) {
    console.error('Get top performers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
