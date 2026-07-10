import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranchFromRequest, withBranchViaRelationFilter } from '@/lib/branch';

// GET /api/students/[id]/observations — Observation timeline for a student
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
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const observationRows = await db.observation.findMany({
      where: { studentId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Observation has only a teacherId (no relation) — resolve names in one query
    const teacherIds = [
      ...new Set(observationRows.map((o) => o.teacherId).filter((t): t is string => !!t)),
    ];
    const teacherMap = new Map<string, { id: string; firstName: string; lastName: string }>();
    if (teacherIds.length > 0) {
      const teachers = await db.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, firstName: true, lastName: true },
      });
      for (const t of teachers) teacherMap.set(t.id, t);
    }

    const observations = observationRows.map((o) => ({
      ...o,
      teacher: o.teacherId ? teacherMap.get(o.teacherId) ?? null : null,
    }));

    return NextResponse.json({ observations });
  } catch (error) {
    console.error('Get student observations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
