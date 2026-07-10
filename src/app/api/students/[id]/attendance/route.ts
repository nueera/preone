import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranchFromRequest, withBranchViaRelationFilter } from '@/lib/branch';

// GET /api/students/[id]/attendance — Attendance history for a student
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

    // Enough history to cover the monthly view + 6-month trend the page renders.
    const attendance = await db.studentAttendance.findMany({
      where: { studentId: id },
      orderBy: { date: 'desc' },
      take: 400,
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Get student attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
