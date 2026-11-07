import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/growth/students/[id] — Get student growth data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(request, Role.ADMIN, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const period = request.nextUrl.searchParams.get('period') || '';

    const student = await db.student.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, dob: true, classId: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Growth scores
    const where: Record<string, unknown> = { studentId: id };
    if (period) where.period = period;

    const growthScores = await db.growthScore.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // AI Observations
    const aiObservations = await db.aIObservation.findMany({
      where: { studentId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Milestones
    const milestones = await db.milestoneTimeline.findMany({
      where: { studentId: id },
      orderBy: { achievedDate: 'desc' },
      include: {
        milestone: { select: { name: true, category: true, ageGroup: true } },
      },
    });

    const latestScore = growthScores[growthScores.length - 1] || null;
    const previousScore = growthScores.length > 1 ? growthScores[growthScores.length - 2] : null;

    // Calculate growth deltas
    const growthDeltas = latestScore && previousScore
      ? {
          creativity: latestScore.creativity - previousScore.creativity,
          communication: latestScore.communication - previousScore.communication,
          social: latestScore.social - previousScore.social,
          confidence: latestScore.confidence - previousScore.confidence,
          cognitive: latestScore.cognitive - previousScore.cognitive,
          physical: latestScore.physical - previousScore.physical,
          overall: (latestScore.overall || 0) - (previousScore.overall || 0),
        }
      : null;

    return NextResponse.json({
      student,
      growthScores,
      latestScore,
      growthDeltas,
      aiObservations,
      milestones,
    });
  } catch (error) {
    console.error('Get student growth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
