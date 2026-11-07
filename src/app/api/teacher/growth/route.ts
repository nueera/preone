import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/growth — Get class-wide growth data with averages, needs attention, top performers
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

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
      return NextResponse.json({
        period: period || null,
        classAverage: null,
        students: [],
        needsAttention: [],
        topPerformers: [],
        classId: null,
        className: null,
      });
    }

    // Get all students in the class
    const students = await db.student.findMany({
      where: { classId: assignedClass.id, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photo: true,
        rollNumber: true,
        growthScores: {
          where: period ? { period } : undefined,
          select: {
            id: true,
            period: true,
            creativity: true,
            communication: true,
            social: true,
            confidence: true,
            cognitive: true,
            physical: true,
            overall: true,
            comments: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { firstName: 'asc' },
    });

    // Build student score list
    const studentScores = students.map((s) => {
      const g = s.growthScores[0];
      const scores = g
        ? {
            creativity: g.creativity,
            communication: g.communication,
            social: g.social,
            confidence: g.confidence,
            cognitive: g.cognitive,
            physical: g.physical,
            overall: g.overall ?? Math.round((g.creativity + g.communication + g.social + g.confidence + g.cognitive + g.physical) / 6),
          }
        : null;

      return {
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        studentPhoto: s.photo,
        rollNumber: s.rollNumber,
        period: g?.period || null,
        scores,
        comments: g?.comments || null,
        updatedAt: g?.updatedAt || null,
      };
    });

    // Calculate class averages (only for students with scores)
    const scoredStudents = studentScores.filter((s) => s.scores !== null);
    let classAverage = null;

    if (scoredStudents.length > 0) {
      const n = scoredStudents.length;
      const sum = scoredStudents.reduce(
        (acc, s) => ({
          creativity: acc.creativity + (s.scores!.creativity || 0),
          communication: acc.communication + (s.scores!.communication || 0),
          social: acc.social + (s.scores!.social || 0),
          confidence: acc.confidence + (s.scores!.confidence || 0),
          cognitive: acc.cognitive + (s.scores!.cognitive || 0),
          physical: acc.physical + (s.scores!.physical || 0),
          overall: acc.overall + (s.scores!.overall || 0),
        }),
        { creativity: 0, communication: 0, social: 0, confidence: 0, cognitive: 0, physical: 0, overall: 0 }
      );
      classAverage = {
        creativity: Math.round((sum.creativity / n) * 10) / 10,
        communication: Math.round((sum.communication / n) * 10) / 10,
        social: Math.round((sum.social / n) * 10) / 10,
        confidence: Math.round((sum.confidence / n) * 10) / 10,
        cognitive: Math.round((sum.cognitive / n) * 10) / 10,
        physical: Math.round((sum.physical / n) * 10) / 10,
        overall: Math.round((sum.overall / n) * 10) / 10,
      };
    }

    // Needs Attention: students with any dimension < 40
    const needsAttention: { studentId: string; studentName: string; dimension: string; score: number }[] = [];
    for (const s of scoredStudents) {
      const dims: [string, number][] = [
        ['Creativity', s.scores!.creativity],
        ['Communication', s.scores!.communication],
        ['Social', s.scores!.social],
        ['Confidence', s.scores!.confidence],
        ['Cognitive', s.scores!.cognitive],
        ['Physical', s.scores!.physical],
      ];
      for (const [dimension, score] of dims) {
        if (score < 40) {
          needsAttention.push({
            studentId: s.studentId,
            studentName: s.studentName,
            dimension,
            score,
          });
        }
      }
    }

    // Top Performers: students with overall > 80
    const topPerformers = scoredStudents
      .filter((s) => (s.scores!.overall || 0) > 80)
      .map((s) => {
        // Find top dimension
        const dims: [string, number][] = [
          ['Creativity', s.scores!.creativity],
          ['Communication', s.scores!.communication],
          ['Social', s.scores!.social],
          ['Confidence', s.scores!.confidence],
          ['Cognitive', s.scores!.cognitive],
          ['Physical', s.scores!.physical],
        ];
        const top = dims.reduce((a, b) => (b[1] > a[1] ? b : a), dims[0]);
        return {
          studentId: s.studentId,
          studentName: s.studentName,
          overall: s.scores!.overall,
          topDimension: top[0],
          topScore: top[1],
        };
      })
      .sort((a, b) => b.overall - a.overall);

    return NextResponse.json({
      period: period || null,
      classAverage,
      students: studentScores,
      needsAttention,
      topPerformers,
      classId: assignedClass.id,
      className: assignedClass.name,
      totalStudents: students.length,
      assessedCount: scoredStudents.length,
    });
  } catch (error) {
    console.error('Get growth scores error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teacher/growth — Upsert a single growth score for a student
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

    const body = await request.json();
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
    } = body;

    if (!studentId || !period) {
      return NextResponse.json(
        { error: 'studentId and period are required' },
        { status: 400 }
      );
    }

    // Verify student belongs to teacher's class
    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      select: { id: true },
    });

    if (!assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 403 });
    }

    const student = await db.student.findFirst({
      where: { id: studentId, classId: assignedClass.id },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found in your class' }, { status: 404 });
    }

    // Validate score ranges (0-100)
    const scores = { creativity, communication, social, confidence, cognitive, physical };
    for (const [key, value] of Object.entries(scores)) {
      if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 100)) {
        return NextResponse.json(
          { error: `${key} must be a number between 0 and 100` },
          { status: 400 }
        );
      }
    }

    // Compute overall as average of 6 dimensions
    const dims = [creativity, communication, social, confidence, cognitive, physical].map((v) =>
      typeof v === 'number' ? v : 0
    );
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
      { status: 200 }
    );
  } catch (error) {
    console.error('Save growth score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
