import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranchFromRequest, withBranchViaRelationFilter } from '@/lib/branch';

// GET /api/classes/[id]/activities — Activities scoped to a single class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const branchScope = getBranchFromRequest(request, authResult);

    const cls = await db.class.findFirst({
      where: { id, ...withBranchViaRelationFilter(branchScope) },
      select: { id: true },
    });

    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const activities = await db.activity.findMany({
      where: { classId: id },
      orderBy: { date: 'desc' },
      take: 50,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Get class activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
