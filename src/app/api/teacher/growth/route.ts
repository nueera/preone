import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/growth — Get class-wide growth data
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Teacher);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId') || '';
    const period = searchParams.get('period') || '';
    const studentId = searchParams.get('studentId') || '';

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, branchId: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // If no classId provided, find teacher's assigned class
    let effectiveClassId = classId;
    if (!effectiveClassId) {
      const assignedClass = await db.class.findFirst({
        where: { teacherId: teacher.id },
        select: { id: true },
      });
      effectiveClassId = assignedClass?.id || '';
    }

    // Build where clause
    const where: Record<string, unknown> = {};

    if (studentId) {
      where.studentId = studentId;
    } else if (effectiveClassId) {
      where.student = { classId: effectiveClassId };
    }

    if (period) {
      where.period = period;
    }

    const growthScores = await db.growthScore.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
            classId: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { student: { firstName: 'asc' } },
    });

    // Calculate class averages if we have data
    let classAverages = null;
    if (growthScores.length > 0) {
      const sum = growthScores.reduce(
        (acc, g) => ({
          creativity: acc.creativity + g.creativity,
          communication: acc.communication + g.communication,
          socialSkills: acc.socialSkills + g.socialSkills,
          confidence: acc.confidence + g.confidence,
          cognitive: acc.cognitive + g.cognitive,
          physical: acc.physical + g.physical,
          overall: acc.overall + g.overall,
        }),
        { creativity: 0, communication: 0, socialSkills: 0, confidence: 0, cognitive: 0, physical: 0, overall: 0 }
      );
      const n = growthScores.length;
      classAverages = {
        creativity: Math.round((sum.creativity / n) * 10) / 10,
        communication: Math.round((sum.communication / n) * 10) / 10,
        socialSkills: Math.round((sum.socialSkills / n) * 10) / 10,
        confidence: Math.round((sum.confidence / n) * 10) / 10,
        cognitive: Math.round((sum.cognitive / n) * 10) / 10,
        physical: Math.round((sum.physical / n) * 10) / 10,
        overall: Math.round((sum.overall / n) * 10) / 10,
      };
    }

    return NextResponse.json({
      growthScores,
      classAverages,
      count: growthScores.length,
      classId: effectiveClassId,
    });
  } catch (error) {
    console.error('Get growth scores error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teacher/growth — Update growth score for a student
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Teacher);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      studentId,
      period,
      creativity,
      communication,
      socialSkills,
      confidence,
      cognitive,
      physical,
      overall,
      comments,
    } = body;

    if (!studentId || !period) {
      return NextResponse.json(
        { error: 'studentId and period are required' },
        { status: 400 }
      );
    }

    // Validate score ranges (0-100)
    const scores = { creativity, communication, socialSkills, confidence, cognitive, physical, overall };
    for (const [key, value] of Object.entries(scores)) {
      if (value !== undefined && (value < 0 || value > 100)) {
        return NextResponse.json(
          { error: `${key} must be between 0 and 100` },
          { status: 400 }
        );
      }
    }

    // Compute overall if not provided
    const providedScores = [creativity, communication, socialSkills, confidence, cognitive, physical].filter(
      v => v !== undefined
    ) as number[];
    const computedOverall =
      overall ??
      (providedScores.length > 0
        ? Math.round((providedScores.reduce((a, b) => a + b, 0) / providedScores.length) * 10) / 10
        : 0);

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
        socialSkills: socialSkills ?? 0,
        confidence: confidence ?? 0,
        cognitive: cognitive ?? 0,
        physical: physical ?? 0,
        overall: computedOverall,
        assessedBy: teacher.id,
        assessmentDate: new Date(),
        comments: comments || null,
      },
      update: {
        creativity: creativity ?? undefined,
        communication: communication ?? undefined,
        socialSkills: socialSkills ?? undefined,
        confidence: confidence ?? undefined,
        cognitive: cognitive ?? undefined,
        physical: physical ?? undefined,
        overall: computedOverall,
        assessedBy: teacher.id,
        assessmentDate: new Date(),
        comments: comments !== undefined ? comments : undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Growth score saved successfully',
        growthScore,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Save growth score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
