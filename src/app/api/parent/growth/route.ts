import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/parent/growth — Growth scores and milestones for parent's children
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.role !== 'Parent') {
      return NextResponse.json({ error: 'Access denied. Parent role required.' }, { status: 403 });
    }

    // Find the Parent record linked to this user
    const parent = await db.parent.findUnique({
      where: { userId: authUser.userId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    // Get all children of this parent
    const studentParents = await db.studentParent.findMany({
      where: { parentId: parent.id },
      select: { studentId: true },
    });
    const childIds = studentParents.map((sp) => sp.studentId);

    if (childIds.length === 0) {
      return NextResponse.json({
        growthScores: [],
        milestoneTimelines: [],
        aiObservations: [],
        achievements: [],
        memories: [],
      });
    }

    // Validate childId if provided
    if (childId && !childIds.includes(childId)) {
      return NextResponse.json(
        { error: 'Child not found or not associated with this parent' },
        { status: 403 }
      );
    }

    // Determine which children to query
    const targetChildIds = childId ? [childId] : childIds;

    // Fetch all growth-related data in parallel
    const [growthScores, milestoneTimelines, aiObservations, achievements, memories] =
      await Promise.all([
        // Growth scores history
        db.growthScore.findMany({
          where: { studentId: { in: targetChildIds } },
          orderBy: { assessmentDate: 'desc' },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
          },
        }),

        // Milestone timelines
        db.milestoneTimeline.findMany({
          where: { studentId: { in: targetChildIds } },
          orderBy: { achievedDate: 'desc' },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
            milestone: {
              select: {
                id: true,
                name: true,
                category: true,
                ageRange: true,
                indicators: true,
              },
            },
          },
        }),

        // AI observations (only reviewed ones for parents)
        db.aIObservation.findMany({
          where: {
            studentId: { in: targetChildIds },
            isReviewed: true,
          },
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
          },
        }),

        // Achievements
        db.achievement.findMany({
          where: { studentId: { in: targetChildIds } },
          orderBy: { date: 'desc' },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
          },
        }),

        // Memories (childhood passport) — only public ones
        db.memory.findMany({
          where: {
            studentId: { in: targetChildIds },
            isPublic: true,
          },
          orderBy: { date: 'desc' },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
          },
        }),
      ]);

    return NextResponse.json({
      growthScores,
      milestoneTimelines,
      aiObservations,
      achievements,
      memories,
    });
  } catch (error) {
    console.error('Parent growth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
