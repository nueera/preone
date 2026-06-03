import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/crm/leads/[id] — Get lead by ID with follow-ups (Admin + TaskMaster)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { dateTime: 'desc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Get lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/crm/leads/[id] — Update lead (including stage change for drag-drop) (Admin + TaskMaster)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();

    // Verify lead exists
    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Allowed update fields
    const allowedFields = [
      'parentName', 'parentPhone', 'parentEmail', 'childName', 'childAge',
      'source', 'stage', 'priority', 'programInterest', 'estimatedValue',
      'assignedTo', 'notes', 'nextFollowUp', 'convertedStudentId', 'lostReason',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'nextFollowUp' && body[field]) {
          updateData[field] = new Date(body[field]);
        } else if (field === 'estimatedValue' && body[field] !== null) {
          updateData[field] = parseFloat(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const lead = await db.lead.update({
      where: { id },
      data: updateData,
      include: {
        followUps: {
          orderBy: { dateTime: 'desc' },
        },
      },
    });

    return NextResponse.json({ message: 'Lead updated successfully', lead });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/crm/leads/[id] — Delete a lead (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireRole(request, Role.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    // Verify lead exists
    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Delete follow-ups first (cascade)
    await db.followUp.deleteMany({ where: { leadId: id } });
    await db.lead.delete({ where: { id } });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
