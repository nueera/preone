import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranchFromRequest, withBranchViaRelationFilter } from '@/lib/branch';

// GET /api/classes/[id] — Get a single class by id
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
      include: {
        program: { select: { id: true, name: true, ageMin: true, ageMax: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });

    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json({ class: cls });
  } catch (error) {
    console.error('Get class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
