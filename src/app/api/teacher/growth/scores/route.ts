import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// POST /api/teacher/growth/scores — Bulk save growth scores (single or multiple students)
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

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
      select: { id: true },
    });

    if (!assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 403 });
    }

    const body = await request.json();
    const { scores } = body;

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json(
        { error: 'scores array is required with at least one entry' },
        { status: 400 }
      );
    }

    // Validate each entry
    for (let i = 0; i < scores.length; i++) {
      const entry = scores[i];
      if (!entry.studentId || !entry.period) {
        return NextResponse.json(
          { error: `Entry ${i + 1}: studentId and period are required` },
          { status: 400 }
        );
      }

      // Validate score ranges
      const dims = ['creativity', 'communication', 'social', 'confidence', 'cognitive', 'physical'];
      for (const dim of dims) {
        if (entry[dim] !== undefined && (typeof entry[dim] !== 'number' || entry[dim] < 0 || entry[dim] > 100)) {
          return NextResponse.json(
            { error: `Entry ${i + 1}: ${dim} must be a number between 0 and 100` },
            { status: 400 }
          );
        }
      }
    }

    // Verify all students belong to teacher's class
    const studentIds = scores.map((s: { studentId: string }) => s.studentId);
    const classStudents = await db.student.findMany({
      where: {
        id: { in: studentIds },
        classId: assignedClass.id,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    const validStudentIds = new Set(classStudents.map((s) => s.id));
    const invalidIds = studentIds.filter((id: string) => !validStudentIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Some students not found in your class: ${invalidIds.join(', ')}` },
        { status: 403 }
      );
    }

    // Upsert each score
    const savedScores = [];
    for (const entry of scores) {
      const {
        studentId,
        period,
        creativity,
        communication,
        social,
        confidence,
        cognitive,
        physical,
        comments,
      } = entry;

      // Compute overall as average of provided dimensions
      const dims = [
        creativity ?? 0,
        communication ?? 0,
        social ?? 0,
        confidence ?? 0,
        cognitive ?? 0,
        physical ?? 0,
      ];
      const computedOverall = Math.round((dims.reduce((a, b) => a + b, 0) / dims.length) * 10) / 10;

      const growthScore = await db.growthScore.upsert({
        where: {
          studentId_period: {
            studentId,
            period,
          },
        },
        create: {
          studentId,
          period,
          creativity: creativity ?? 0,
          communication: communication ?? 0,
          social: social ?? 0,
          confidence: confidence ?? 0,
          cognitive: cognitive ?? 0,
          physical: physical ?? 0,
          overall: computedOverall,
          assessedBy: teacher.id,
          comments: comments || null,
        },
        update: {
          creativity: creativity ?? undefined,
          communication: communication ?? undefined,
          social: social ?? undefined,
          confidence: confidence ?? undefined,
          cognitive: cognitive ?? undefined,
          physical: physical ?? undefined,
          overall: computedOverall,
          assessedBy: teacher.id,
          comments: comments !== undefined ? comments : undefined,
        },
      });

      savedScores.push(growthScore);
    }

    return NextResponse.json(
      {
        message: `${savedScores.length} growth score(s) saved successfully`,
        savedCount: savedScores.length,
        scores: savedScores,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk save growth scores error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
