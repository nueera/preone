import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/growth/students/[id] — Get student growth data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(request, Role.Admin, Role.Teacher);
    if (user instanceof NextResponse) return user;

    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, dob: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Growth scores over time
    const growthScores = await db.growthScore.findMany({
      where: { studentId: id },
      orderBy: { assessmentDate: 'asc' },
    });

    // AI Observations
    const aiObservations = await db.aIObservation.findMany({
      where: { studentId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Teacher observations
    const observations = await db.observation.findMany({
      where: { studentId: id },
      orderBy: { date: 'desc' },
      take: 20,
      include: {
        teacher: { select: { firstName: true, lastName: true } },
      },
    });

    // Milestones achieved
    const milestones = await db.milestoneTimeline.findMany({
      where: { studentId: id },
      orderBy: { achievedDate: 'desc' },
      include: {
        milestone: { select: { name: true, category: true, ageRange: true } },
      },
    });

    // Latest growth summary
    const latestScore = growthScores[growthScores.length - 1] || null;
    const previousScore = growthScores.length > 1 ? growthScores[growthScores.length - 2] : null;

    // Calculate growth deltas
    const growthDeltas = latestScore && previousScore ? {
      creativity: latestScore.creativity - previousScore.creativity,
      communication: latestScore.communication - previousScore.communication,
      socialSkills: latestScore.socialSkills - previousScore.socialSkills,
      confidence: latestScore.confidence - previousScore.confidence,
      cognitive: latestScore.cognitive - previousScore.cognitive,
      physical: latestScore.physical - previousScore.physical,
      overall: latestScore.overall - previousScore.overall,
    } : null;

    return NextResponse.json({
      student,
      growthScores,
      latestScore,
      growthDeltas,
      aiObservations,
      observations,
      milestones,
    });
  } catch (error) {
    console.error('Get student growth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
