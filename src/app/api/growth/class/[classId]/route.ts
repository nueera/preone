import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized, Role } from '@/lib/auth';

// GET /api/growth/class/[classId] — Class growth overview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    if (user.role !== Role.ADMIN && user.role !== Role.TEACHER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { classId } = await params;
    const period = request.nextUrl.searchParams.get('period') || '';

    const classInfo = await db.class.findUnique({
      where: { id: classId },
      include: {
        program: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
    });

    if (!classInfo) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const students = await db.student.findMany({
      where: { classId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true },
    });

    // Get growth scores for each student
    const studentGrowth = await Promise.all(
      students.map(async (student) => {
        const where: Record<string, unknown> = { studentId: student.id };
        if (period) where.period = period;

        const latestScore = await db.growthScore.findFirst({
          where,
          orderBy: { createdAt: 'desc' },
        });

        return { ...student, growthScore: latestScore };
      })
    );

    // Class averages
    const studentsWithScores = studentGrowth.filter((s) => s.growthScore);
    const classAverages = studentsWithScores.length > 0
      ? {
          creativity: Math.round(
            (studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.creativity || 0), 0) / studentsWithScores.length) * 10
          ) / 10,
          communication: Math.round(
            (studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.communication || 0), 0) / studentsWithScores.length) * 10
          ) / 10,
          social: Math.round(
            (studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.social || 0), 0) / studentsWithScores.length) * 10
          ) / 10,
          confidence: Math.round(
            (studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.confidence || 0), 0) / studentsWithScores.length) * 10
          ) / 10,
          cognitive: Math.round(
            (studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.cognitive || 0), 0) / studentsWithScores.length) * 10
          ) / 10,
          physical: Math.round(
            (studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.physical || 0), 0) / studentsWithScores.length) * 10
          ) / 10,
          overall: Math.round(
            (studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.overall || 0), 0) / studentsWithScores.length) * 10
          ) / 10,
        }
      : null;

    // Students needing attention (any dimension < 40)
    const needsAttention = studentGrowth
      .filter((s) => {
        if (!s.growthScore) return false;
        const sc = s.growthScore;
        return (
          sc.creativity < 40 ||
          sc.communication < 40 ||
          sc.social < 40 ||
          sc.confidence < 40 ||
          sc.cognitive < 40 ||
          sc.physical < 40
        );
      })
      .map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        weakestArea: getWeakestArea(s.growthScore!),
        weakestScore: getWeakestScore(s.growthScore!),
      }))
      .sort((a, b) => a.weakestScore - b.weakestScore);

    // Top performers (overall >= 80)
    const topPerformers = studentGrowth
      .filter((s) => s.growthScore && s.growthScore.overall >= 80)
      .sort((a, b) => (b.growthScore?.overall || 0) - (a.growthScore?.overall || 0))
      .map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        strongestArea: getStrongestArea(s.growthScore!),
        overall: s.growthScore!.overall,
      }));

    return NextResponse.json({
      class: classInfo,
      students: studentGrowth,
      classAverages,
      needsAttention,
      topPerformers,
      assessedCount: studentsWithScores.length,
      totalStudents: students.length,
    });
  } catch (error) {
    console.error('Class growth overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getWeakestArea(score: {
  creativity: number; communication: number; social: number;
  confidence: number; cognitive: number; physical: number;
}): string {
  const areas = [
    { name: 'Creativity', value: score.creativity },
    { name: 'Communication', value: score.communication },
    { name: 'Social Skills', value: score.social },
    { name: 'Confidence', value: score.confidence },
    { name: 'Cognitive', value: score.cognitive },
    { name: 'Physical', value: score.physical },
  ];
  areas.sort((a, b) => a.value - b.value);
  return areas[0].name;
}

function getWeakestScore(score: {
  creativity: number; communication: number; social: number;
  confidence: number; cognitive: number; physical: number;
}): number {
  return Math.min(score.creativity, score.communication, score.social, score.confidence, score.cognitive, score.physical);
}

function getStrongestArea(score: {
  creativity: number; communication: number; social: number;
  confidence: number; cognitive: number; physical: number;
}): string {
  const areas = [
    { name: 'Creativity', value: score.creativity },
    { name: 'Communication', value: score.communication },
    { name: 'Social Skills', value: score.social },
    { name: 'Confidence', value: score.confidence },
    { name: 'Cognitive', value: score.cognitive },
    { name: 'Physical', value: score.physical },
  ];
  areas.sort((a, b) => b.value - a.value);
  return areas[0].name;
}
