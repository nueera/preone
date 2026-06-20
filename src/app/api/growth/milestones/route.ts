import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

// GET /api/growth/milestones — List the milestone catalog (templates).
// Milestones are global developmental templates (not student-scoped), so no
// branch filter is applied. Per-student progress lives at /[studentId].
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const milestones = await db.milestone.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ milestones });
  } catch (error) {
    console.error('List milestones error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
