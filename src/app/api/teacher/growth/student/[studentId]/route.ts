import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/growth/student/[studentId] — Detailed growth data for one student with trend
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { studentId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '';

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Find teacher's assigned class
    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      select: { id: true, name: true },
    });

    if (!assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 403 });
    }

    // Verify student belongs to teacher's class
    const student = await db.student.findFirst({
      where: { id: studentId, classId: assignedClass.id, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photo: true,
        rollNumber: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found in your class' }, { status: 404 });
    }

    // Get all growth scores for the student (trend data)
    const allScores = await db.growthScore.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
    });

    // Find current period score
    const currentScore = period
      ? allScores.find((s) => s.period === period)
      : allScores[allScores.length - 1] || null;

    // Build trend data
    const trend = allScores.map((s) => ({
      period: s.period,
      overall: s.overall ?? Math.round((s.creativity + s.communication + s.social + s.confidence + s.cognitive + s.physical) / 6),
      creativity: s.creativity,
      communication: s.communication,
      social: s.social,
      confidence: s.confidence,
      cognitive: s.cognitive,
      physical: s.physical,
      comments: s.comments,
      updatedAt: s.updatedAt,
    }));

    // Calculate class averages for the requested period
    let classAverage = null;
    if (currentScore) {
      const classScores = await db.growthScore.findMany({
        where: {
          student: { classId: assignedClass.id, status: 'ACTIVE' },
          period: currentScore.period,
        },
      });

      if (classScores.length > 0) {
        const n = classScores.length;
        const sum = classScores.reduce(
          (acc, g) => ({
            creativity: acc.creativity + g.creativity,
            communication: acc.communication + g.communication,
            social: acc.social + g.social,
            confidence: acc.confidence + g.confidence,
            cognitive: acc.cognitive + g.cognitive,
            physical: acc.physical + g.physical,
          }),
          { creativity: 0, communication: 0, social: 0, confidence: 0, cognitive: 0, physical: 0 }
        );
        classAverage = {
          creativity: Math.round((sum.creativity / n) * 10) / 10,
          communication: Math.round((sum.communication / n) * 10) / 10,
          social: Math.round((sum.social / n) * 10) / 10,
          confidence: Math.round((sum.confidence / n) * 10) / 10,
          cognitive: Math.round((sum.cognitive / n) * 10) / 10,
          physical: Math.round((sum.physical / n) * 10) / 10,
          overall: Math.round((((sum.creativity + sum.communication + sum.social + sum.confidence + sum.cognitive + sum.physical) / 6) / n) * 10) / 10,
        };
      }
    }

    const currentPeriod = currentScore
      ? {
          period: currentScore.period,
          creativity: currentScore.creativity,
          communication: currentScore.communication,
          social: currentScore.social,
          confidence: currentScore.confidence,
          cognitive: currentScore.cognitive,
          physical: currentScore.physical,
          overall: currentScore.overall ?? Math.round((currentScore.creativity + currentScore.communication + currentScore.social + currentScore.confidence + currentScore.cognitive + currentScore.physical) / 6),
          comments: currentScore.comments,
        }
      : null;

    return NextResponse.json({
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        photo: student.photo,
        rollNumber: student.rollNumber,
      },
      className: assignedClass.name,
      currentPeriod,
      trend,
      classAverage,
    });
  } catch (error) {
    console.error('Get student growth detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
