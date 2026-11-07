import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/growth/milestones/[studentId] — Milestone tracking for a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { studentId } = await params;
    const ageGroup = request.nextUrl.searchParams.get('ageGroup') || '';

    // Verify student exists
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, lastName: true, dob: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get all milestones (optionally filtered by age group)
    const milestoneWhere: Record<string, unknown> = {};
    if (ageGroup) milestoneWhere.ageGroup = ageGroup;

    const allMilestones = await db.milestone.findMany({
      where: milestoneWhere,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // If no milestones exist yet, create default ones
    if (allMilestones.length === 0) {
      const defaultMilestones = [
        // 2-3 years
        { name: 'Walks steadily', ageGroup: '2-3', category: 'Physical' },
        { name: 'Runs with coordination', ageGroup: '2-3', category: 'Physical' },
        { name: 'Stacks 4+ blocks', ageGroup: '2-3', category: 'Cognitive' },
        { name: 'Identifies 3 colors', ageGroup: '2-3', category: 'Cognitive' },
        { name: 'Uses 2-word sentences', ageGroup: '2-3', category: 'Language' },
        { name: 'Follows simple instructions', ageGroup: '2-3', category: 'Language' },
        { name: 'Plays alongside others', ageGroup: '2-3', category: 'Social' },
        { name: 'Shows empathy', ageGroup: '2-3', category: 'Social' },
        // 3-4 years
        { name: 'Hops on one foot', ageGroup: '3-4', category: 'Physical' },
        { name: 'Catches a bounced ball', ageGroup: '3-4', category: 'Physical' },
        { name: 'Counts to 10', ageGroup: '3-4', category: 'Cognitive' },
        { name: 'Recognizes shapes', ageGroup: '3-4', category: 'Cognitive' },
        { name: 'Tells simple stories', ageGroup: '3-4', category: 'Language' },
        { name: 'Asks "why" questions', ageGroup: '3-4', category: 'Language' },
        { name: 'Takes turns in games', ageGroup: '3-4', category: 'Social' },
        { name: 'Shows independence', ageGroup: '3-4', category: 'Social' },
        // 4-5 years
        { name: 'Skips alternating feet', ageGroup: '4-5', category: 'Physical' },
        { name: 'Writes some letters', ageGroup: '4-5', category: 'Cognitive' },
        { name: 'Understands time concepts', ageGroup: '4-5', category: 'Cognitive' },
        { name: 'Speaks in complete sentences', ageGroup: '4-5', category: 'Language' },
        { name: 'Tells name and address', ageGroup: '4-5', category: 'Language' },
        { name: 'Plays cooperatively', ageGroup: '4-5', category: 'Social' },
        { name: 'Resolves conflicts', ageGroup: '4-5', category: 'Social' },
      ];

      for (const m of defaultMilestones) {
        await db.milestone.create({ data: m });
      }

      // Re-fetch after creating
      const newMilestones = await db.milestone.findMany({
        where: milestoneWhere,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      // Get existing timeline entries
      const timeline = await db.milestoneTimeline.findMany({
        where: { studentId },
      });

      const timelineMap = new Map(timeline.map((t) => [t.milestoneId, t]));

      const result = newMilestones.map((milestone) => {
        const entry = timelineMap.get(milestone.id);
        return {
          milestoneId: milestone.id,
          name: milestone.name,
          ageGroup: milestone.ageGroup,
          category: milestone.category,
          achievedDate: entry?.achievedDate?.toISOString() || null,
          status: entry?.status || 'PENDING',
          notes: entry?.notes || null,
        };
      });

      const achieved = result.filter((r) => r.status === 'ACHIEVED').length;

      return NextResponse.json({
        student: { id: student.id, name: `${student.firstName} ${student.lastName}` },
        milestones: result,
        progress: { achieved, total: result.length, percentage: result.length > 0 ? Math.round((achieved / result.length) * 100) : 0 },
      });
    }

    // Get existing timeline entries
    const timeline = await db.milestoneTimeline.findMany({
      where: { studentId },
    });

    const timelineMap = new Map(timeline.map((t) => [t.milestoneId, t]));

    const result = allMilestones.map((milestone) => {
      const entry = timelineMap.get(milestone.id);
      return {
        milestoneId: milestone.id,
        name: milestone.name,
        ageGroup: milestone.ageGroup,
        category: milestone.category,
        achievedDate: entry?.achievedDate?.toISOString() || null,
        status: entry?.status || 'PENDING',
        notes: entry?.notes || null,
      };
    });

    const achieved = result.filter((r) => r.status === 'ACHIEVED').length;

    return NextResponse.json({
      student: { id: student.id, name: `${student.firstName} ${student.lastName}` },
      milestones: result,
      progress: { achieved, total: result.length, percentage: result.length > 0 ? Math.round((achieved / result.length) * 100) : 0 },
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
