import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/growth/class/[classId] — Class growth overview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { classId } = await params;
    const period = request.nextUrl.searchParams.get('period') || '';

    // Get class info
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

    // Get all active students in the class
    const students = await db.student.findMany({
      where: { classId, status: 'Active' },
      select: { id: true, firstName: true, lastName: true },
    });

    // Get latest growth score for each student
    const studentGrowth = await Promise.all(
      students.map(async (student) => {
        const where: Record<string, unknown> = { studentId: student.id };
        if (period) where.period = period;

        const latestScore = await db.growthScore.findFirst({
          where,
          orderBy: { assessmentDate: 'desc' },
        });

        const observationCount = await db.observation.count({
          where: { studentId: student.id },
        });

        return {
          ...student,
          growthScore: latestScore,
          observationCount,
        };
      })
    );

    // Class averages
    const studentsWithScores = studentGrowth.filter(s => s.growthScore);
    const classAverages = studentsWithScores.length > 0 ? {
      creativity: studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.creativity || 0), 0) / studentsWithScores.length,
      communication: studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.communication || 0), 0) / studentsWithScores.length,
      socialSkills: studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.socialSkills || 0), 0) / studentsWithScores.length,
      confidence: studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.confidence || 0), 0) / studentsWithScores.length,
      cognitive: studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.cognitive || 0), 0) / studentsWithScores.length,
      physical: studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.physical || 0), 0) / studentsWithScores.length,
      overall: studentsWithScores.reduce((sum, s) => sum + (s.growthScore?.overall || 0), 0) / studentsWithScores.length,
    } : null;

    // Identify students needing attention (overall < 40)
    const needsAttention = studentGrowth.filter(
      s => s.growthScore && s.growthScore.overall < 40
    ).map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      overall: s.growthScore!.overall,
      weakestArea: getWeakestArea(s.growthScore!),
    }));

    // Top performers
    const topPerformers = studentGrowth
      .filter(s => s.growthScore && s.growthScore.overall >= 75)
      .sort((a, b) => (b.growthScore?.overall || 0) - (a.growthScore?.overall || 0))
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        overall: s.growthScore!.overall,
      }));

    return NextResponse.json({
      class: classInfo,
      students: studentGrowth,
      classAverages: classAverages ? {
        ...classAverages,
        creativity: Math.round(classAverages.creativity * 10) / 10,
        communication: Math.round(classAverages.communication * 10) / 10,
        socialSkills: Math.round(classAverages.socialSkills * 10) / 10,
        confidence: Math.round(classAverages.confidence * 10) / 10,
        cognitive: Math.round(classAverages.cognitive * 10) / 10,
        physical: Math.round(classAverages.physical * 10) / 10,
        overall: Math.round(classAverages.overall * 10) / 10,
      } : null,
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

function getWeakestArea(score: { creativity: number; communication: number; socialSkills: number; confidence: number; cognitive: number; physical: number }): string {
  const areas = [
    { name: 'Creativity', value: score.creativity },
    { name: 'Communication', value: score.communication },
    { name: 'Social Skills', value: score.socialSkills },
    { name: 'Confidence', value: score.confidence },
    { name: 'Cognitive', value: score.cognitive },
    { name: 'Physical', value: score.physical },
  ];
  areas.sort((a, b) => a.value - b.value);
  return areas[0].name;
}
