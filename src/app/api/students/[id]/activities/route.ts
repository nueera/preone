import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranchFromRequest, withBranchViaRelationFilter } from '@/lib/branch';

// GET /api/students/[id]/activities — Activities for the student's class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const branchScope = getBranchFromRequest(request, authResult);

    const student = await db.student.findFirst({
      where: { id, ...withBranchViaRelationFilter(branchScope) },
      select: { id: true, classId: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.classId) {
      return NextResponse.json({ activities: [] });
    }

    const activities = await db.activity.findMany({
      where: { classId: student.classId },
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Get student activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
