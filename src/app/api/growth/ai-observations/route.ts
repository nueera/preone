import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/growth/ai-observations — AI-generated insights
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const studentId = request.nextUrl.searchParams.get('studentId') || '';

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;

    const aiObservations = await db.aIObservation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            class: { select: { name: true } },
          },
        },
      },
    });

    // If no AI observations exist yet, generate mock insights from growth scores
    if (aiObservations.length === 0) {
      const growthScores = await db.growthScore.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              class: { select: { name: true } },
            },
          },
        },
      });

      const mockInsights = growthScores
        .filter((gs) => gs.overall && gs.overall < 60)
        .slice(0, 10)
        .map((gs) => {
          const dims = [
            { name: 'creativity', value: gs.creativity },
            { name: 'communication', value: gs.communication },
            { name: 'social skills', value: gs.social },
            { name: 'confidence', value: gs.confidence },
            { name: 'cognitive', value: gs.cognitive },
            { name: 'physical', value: gs.physical },
          ];
          dims.sort((a, b) => a.value - b.value);
          const weakest = dims[0];

          const suggestions: Record<string, string> = {
            creativity: 'Consider adding more art and free-play activities to boost creative thinking.',
            communication: 'Group discussions and show-and-tell sessions may help improve communication.',
            'social skills': 'More collaborative group activities could strengthen social interactions.',
            confidence: 'Positive reinforcement and leadership roles in small tasks can build confidence.',
            cognitive: 'Puzzle-solving and structured learning games may enhance cognitive development.',
            physical: 'Additional outdoor play and movement activities could improve physical development.',
          };

          return {
            id: `mock-${gs.id}`,
            studentId: gs.student.id,
            studentName: `${gs.student.firstName} ${gs.student.lastName}`,
            className: gs.student.class?.name || 'Unassigned',
            insight: `${gs.student.firstName} ${gs.student.lastName}'s ${weakest.name} score is ${weakest.value}/100, which is below the class average. ${suggestions[weakest.name] || 'Consider targeted interventions.'}`,
            dimension: weakest.name,
            severity: weakest.value < 30 ? 'high' : weakest.value < 40 ? 'medium' : 'low',
            isActioned: false,
            createdAt: gs.createdAt,
          };
        });

      return NextResponse.json({ observations: mockInsights });
    }

    const formatted = aiObservations.map((obs) => ({
      id: obs.id,
      studentId: obs.studentId,
      studentName: `${obs.student.firstName} ${obs.student.lastName}`,
      className: obs.student.class?.name || 'Unassigned',
      insight: obs.insight,
      dimension: obs.dimension,
      severity: obs.severity,
      isActioned: obs.isActioned,
      createdAt: obs.createdAt,
    }));

    return NextResponse.json({ observations: formatted });
  } catch (error) {
    console.error('Get AI observations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
