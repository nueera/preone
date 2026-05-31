import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// ── Pipeline stage definitions ──
const PIPELINE_STAGES = [
  { name: 'NEW', color: '#9ca3af' },
  { name: 'CONTACTED', color: '#3b82f6' },
  { name: 'VISITED', color: '#8b5cf6' },
  { name: 'APPLIED', color: '#eab308' },
  { name: 'ENROLLED', color: '#10b981' },
] as const;

// GET /api/dashboard/pipeline — CRM pipeline data
// Groups leads by stage and sums estimated value.
// Requires ADMIN role.
export async function GET(request: NextRequest) {
  try {
    // ── Verify ADMIN role ──
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    // ── Fetch all active (non-LOST) leads ──
    const leads = await db.lead.findMany({
      where: { stage: { not: 'LOST' } },
      select: { stage: true, estimatedValue: true },
    });

    // ── Group by stage ──
    const stageMap = new Map<string, { count: number; value: number }>();

    // Initialize all stages with zero
    for (const s of PIPELINE_STAGES) {
      stageMap.set(s.name, { count: 0, value: 0 });
    }

    // Aggregate lead data
    for (const lead of leads) {
      const existing = stageMap.get(lead.stage) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += lead.estimatedValue || 0;
      stageMap.set(lead.stage, existing);
    }

    // ── Build response ──
    const stages = PIPELINE_STAGES.map((s) => {
      const data = stageMap.get(s.name) || { count: 0, value: 0 };
      return {
        name: s.name,
        count: data.count,
        value: Math.round(data.value),
        color: s.color,
      };
    });

    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Dashboard pipeline error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
