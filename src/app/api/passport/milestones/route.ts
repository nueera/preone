// ============================================================
// GET /api/passport/milestones — List all milestone definitions
// Returns milestones grouped by ageGroup
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const milestones = await db.milestone.findMany({
    orderBy: [{ ageGroup: 'asc' }, { category: 'asc' }],
  });

  // Group by ageGroup
  const grouped = milestones.reduce<Record<string, typeof milestones>>((acc, m) => {
    const group = m.ageGroup || 'Unspecified';
    if (!acc[group]) acc[group] = [];
    acc[group].push(m);
    return acc;
  }, {});

  return NextResponse.json({ milestones, grouped });
}
