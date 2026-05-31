import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// PUT /api/crm/leads/[id] — Update lead (change stage, add follow-up)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Update lead fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'parentName', 'parentPhone', 'parentEmail', 'parentOccupation',
      'parentAddress', 'childName', 'childGender', 'programInterest',
      'source', 'sourceDetail', 'stage', 'assignedTo', 'notes',
      'priority', 'lostReason', 'estimatedFee', 'convertedStudentId',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle date fields
    if (body.childDob !== undefined) updateData.childDob = body.childDob ? new Date(body.childDob) : null;
    if (body.nextFollowUpDate !== undefined) updateData.nextFollowUpDate = body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null;
    if (body.expectedEnrollmentDate !== undefined) updateData.expectedEnrollmentDate = body.expectedEnrollmentDate ? new Date(body.expectedEnrollmentDate) : null;

    // If stage changed to Enrolled, increment interaction count
    if (body.stage && body.stage !== existing.stage) {
      updateData.interactionCount = existing.interactionCount + 1;
    }

    const lead = await db.lead.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true } },
        followUps: { orderBy: { followUpDate: 'desc' }, take: 10 },
      },
    });

    // If a follow-up is provided, create it
    if (body.followUp) {
      const { type, notes: followUpNotes, outcome, followUpDate, nextFollowUpDate: nfDate, duration } = body.followUp;

      if (type && followUpNotes && followUpDate) {
        await db.followUp.create({
          data: {
            leadId: id,
            type,
            notes: followUpNotes,
            outcome,
            followUpDate: new Date(followUpDate),
            conductedBy: authUser.userId,
            nextFollowUpDate: nfDate ? new Date(nfDate) : undefined,
            duration,
          },
        });

        // Update lead's next follow-up date and interaction count
        await db.lead.update({
          where: { id },
          data: {
            interactionCount: lead.interactionCount + 1,
            nextFollowUpDate: nfDate ? new Date(nfDate) : undefined,
          },
        });
      }
    }

    return NextResponse.json({ message: 'Lead updated successfully', lead });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
