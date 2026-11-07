import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/crm/leads/[id]/followups — List follow-ups for a lead (Admin + TaskMaster)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const followUps = await db.followUp.findMany({
      where: { leadId: id },
      orderBy: { dateTime: 'desc' },
    });

    return NextResponse.json({ followUps });
  } catch (error) {
    console.error('Get follow-ups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/crm/leads/[id]/followups — Add a follow-up (Admin + TaskMaster)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const { type, dateTime, outcome, nextFollowUp, notes, createdBy } = body;

    // Verify lead exists
    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Validate required fields
    if (!type) {
      return NextResponse.json({ error: 'Follow-up type is required' }, { status: 400 });
    }
    if (!outcome) {
      return NextResponse.json({ error: 'Outcome is required' }, { status: 400 });
    }
    if (!notes || notes.trim().length === 0) {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
    }

    const followUp = await db.followUp.create({
      data: {
        leadId: id,
        type,
        dateTime: dateTime ? new Date(dateTime) : new Date(),
        outcome,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        notes: notes.trim(),
        createdBy: createdBy || authResult.name || null,
      },
    });

    // Update lead's next follow-up date
    const updateData: Record<string, unknown> = {};
    if (nextFollowUp) {
      updateData.nextFollowUp = new Date(nextFollowUp);
    }

    // Auto-update stage based on outcome
    if (outcome === 'VISITED' && lead.stage === 'CONTACTED') {
      updateData.stage = 'VISITED';
    } else if (outcome === 'ENROLLED') {
      updateData.stage = 'ENROLLED';
    }

    if (Object.keys(updateData).length > 0) {
      await db.lead.update({
        where: { id },
        data: updateData,
      });
    }

    return NextResponse.json(
      { message: 'Follow-up added successfully', followUp },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create follow-up error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
