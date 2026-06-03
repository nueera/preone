import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// PATCH /api/crm/followups/[followUpId]/complete — Mark follow-up as completed
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ followUpId: string }> }
) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { followUpId } = await params;
    const body = await request.json();
    const { outcome, nextAction } = body;

    // Verify follow-up exists
    const existing = await db.followUp.findUnique({
      where: { id: followUpId },
      include: { lead: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    if (existing.completedAt) {
      return NextResponse.json(
        { error: 'Follow-up is already completed' },
        { status: 400 },
      );
    }

    // Mark as completed
    const followUp = await db.followUp.update({
      where: { id: followUpId },
      data: {
        outcome: outcome || existing.outcome,
        completedAt: new Date(),
      },
      include: {
        lead: { select: { id: true, parentName: true, childName: true, stage: true } },
      },
    });

    // If nextAction provided, update lead's nextFollowUp
    if (nextAction) {
      const updateData: Record<string, unknown> = {};
      // If nextAction is a date string, set as next follow-up
      if (typeof nextAction === 'string' && !isNaN(Date.parse(nextAction))) {
        updateData.nextFollowUp = new Date(nextAction);
      }
      // Auto-advance lead stage based on outcome
      if (outcome === 'VISITED' && followUp.lead.stage === 'CONTACTED') {
        updateData.stage = 'VISITED';
      } else if (outcome === 'ENROLLED') {
        updateData.stage = 'ENROLLED';
      } else if (outcome === 'APPLIED') {
        updateData.stage = 'APPLIED';
      }

      if (Object.keys(updateData).length > 0) {
        await db.lead.update({
          where: { id: followUp.lead.id },
          data: updateData,
        });
      }
    }

    return NextResponse.json({ message: 'Follow-up completed successfully', followUp });
  } catch (error) {
    console.error('Complete follow-up error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
