import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/growth/attention — Students needing attention (any dimension < 40)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const period = request.nextUrl.searchParams.get('period') || '';
    const classId = request.nextUrl.searchParams.get('classId') || '';

    // Get all growth scores
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

    // Filter students with any dimension < 40
    const attentionStudents = growthScores
      .filter((gs) => {
        if (classId && gs.student.classId !== classId) return false;
        return (
          gs.creativity < 40 ||
          gs.communication < 40 ||
          gs.social < 40 ||
          gs.confidence < 40 ||
          gs.cognitive < 40 ||
          gs.physical < 40
        );
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
        dims.sort((a, b) => a.value - b.value);
        return {
          studentId: gs.student.id,
          studentName: `${gs.student.firstName} ${gs.student.lastName}`,
          className: gs.student.class?.name || 'Unassigned',
          weakDimension: dims[0].name,
          score: dims[0].value,
          period: gs.period,
        };
      })
      .sort((a, b) => a.score - b.score);

    return NextResponse.json({ students: attentionStudents });
  } catch (error) {
    console.error('Get attention students error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
