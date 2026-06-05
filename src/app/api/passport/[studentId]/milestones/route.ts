// ============================================================
// GET  /api/passport/[studentId]/milestones — Milestone timeline for a student
// POST /api/passport/[studentId]/milestones — Mark milestone as achieved
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, Role } from '@/lib/auth';
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

  // Get all milestone definitions
  const allMilestones = await db.milestone.findMany({
    orderBy: [{ ageGroup: 'asc' }, { category: 'asc' }],
  });

  // Get achieved milestones for this student
  const timelines = await db.milestoneTimeline.findMany({
    where: { studentId },
  });

  const achievedMap = new Map(timelines.map((t) => [t.milestoneId, t]));

  const milestones = allMilestones.map((m) => ({
    ...m,
    achieved: achievedMap.has(m.id),
    achievedDate: achievedMap.get(m.id)?.achievedDate || null,
    status: achievedMap.get(m.id)?.status || 'PENDING',
    notes: achievedMap.get(m.id)?.notes || null,
    timelineId: achievedMap.get(m.id)?.id || null,
  }));

  // Group by ageGroup
  const grouped = milestones.reduce<Record<string, typeof milestones>>((acc, m) => {
    const group = m.ageGroup || 'Unspecified';
    if (!acc[group]) acc[group] = [];
    acc[group].push(m);
    return acc;
  }, {});

  return NextResponse.json({ milestones, grouped });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Teachers and admins can mark milestones
  if (user.role !== Role.TEACHER && user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Only teachers and admins can mark milestones' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { milestoneId, achievedDate, notes } = body;

    if (!milestoneId) {
      return NextResponse.json({ error: 'milestoneId is required' }, { status: 400 });
    }

    // Verify milestone exists
    const milestone = await db.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Upsert the timeline entry
    const timeline = await db.milestoneTimeline.upsert({
      where: {
        id: (await db.milestoneTimeline.findFirst({
          where: { studentId, milestoneId },
          select: { id: true },
        }))?.id || '__none__',
      },
      update: {
        achievedDate: achievedDate ? new Date(achievedDate) : new Date(),
        status: 'ACHIEVED',
        notes: notes?.trim() || null,
      },
      create: {
        studentId,
        milestoneId,
        achievedDate: achievedDate ? new Date(achievedDate) : new Date(),
        status: 'ACHIEVED',
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ timeline }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
