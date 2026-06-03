// ============================================================
// GET /api/passport/[studentId] — Full passport data for a student
// Auth: Admin sees all, Teacher sees students in their class,
//       Parent sees only their own children
// Returns parallel queries for performance
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, Role } from '@/lib/auth';
import { requireTeacher, requireParent, isAuthError } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // ── Role-based access ──
  if (user.role === Role.ADMIN) {
    // Admin can see everything — no further check
  } else if (user.role === Role.TEACHER) {
    // Teacher can only see students in their class
    const teacherAuth = await requireTeacher(request);
    if (isAuthError(teacherAuth)) return teacherAuth.error;
    if (teacherAuth.classId) {
      const student = await db.student.findFirst({
        where: { id: studentId, classId: teacherAuth.classId },
        select: { id: true },
      });
      if (!student) {
        return NextResponse.json({ error: 'Student not found in your class' }, { status: 403 });
      }
    }
  } else if (user.role === Role.PARENT) {
    // Parent can only see their own children
    const parentAuth = await requireParent(request);
    if (isAuthError(parentAuth)) return parentAuth.error;
    if (!parentAuth.childIds.includes(studentId)) {
      return NextResponse.json({ error: 'Access denied. This child is not linked to your account.' }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // ── Verify student exists ──
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photo: true,
      dob: true,
      gender: true,
      bloodGroup: true,
      rollNumber: true,
      status: true,
      admissionDate: true,
      class: {
        select: {
          id: true,
          name: true,
          program: { select: { id: true, name: true } },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // ── Parallel queries for performance ──
  const [memories, achievements, certificates, milestoneTimelines, growthScores, recentUpdates, recentObservations, reactions] = await Promise.all([
    // Memories
    db.memory.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 50,
    }),

    // Achievements
    db.achievement.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    }),

    // Certificates
    db.certificate.findMany({
      where: { studentId },
      orderBy: { issuedAt: 'desc' },
    }),

    // Milestone timelines
    db.milestoneTimeline.findMany({
      where: { studentId },
      orderBy: { achievedDate: 'desc' },
    }),

    // Growth scores (latest)
    db.growthScore.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),

    // Recent daily updates
    db.dailyUpdate.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 7,
    }),

    // Recent observations (shared ones only for parents)
    db.observation.findMany({
      where: {
        studentId,
        ...(user.role === Role.PARENT ? { isShared: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),

    // Reactions
    db.reaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // ── Get all milestone definitions for reference ──
  const allMilestones = await db.milestone.findMany({
    orderBy: [{ ageGroup: 'asc' }, { category: 'asc' }],
  });

  // ── Build milestones with achieved/pending status ──
  const achievedMap = new Map(milestoneTimelines.map((mt) => [mt.milestoneId, mt]));
  const milestones = allMilestones.map((m) => ({
    id: m.id,
    name: m.name,
    ageGroup: m.ageGroup,
    category: m.category,
    description: m.description,
    achieved: achievedMap.has(m.id),
    achievedDate: achievedMap.get(m.id)?.achievedDate || null,
    status: achievedMap.get(m.id)?.status || 'PENDING',
    notes: achievedMap.get(m.id)?.notes || null,
    timelineId: achievedMap.get(m.id)?.id || null,
  }));

  // ── Growth summary (latest score) ──
  const latestGrowth = growthScores[0] || null;

  return NextResponse.json({
    student,
    memories,
    achievements,
    certificates,
    milestones,
    growthSummary: latestGrowth,
    growthHistory: growthScores,
    recentUpdates,
    recentObservations,
    reactions,
  });
}
