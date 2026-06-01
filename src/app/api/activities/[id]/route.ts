import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/activities/[id] — Get activity by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const activity = await db.activity.findUnique({
      where: { id },
      include: {
        class: {
          select: { id: true, name: true, program: { select: { name: true } } },
        },
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/activities/[id] — Update activity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.activity.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    const allowedFields = [
      'title', 'type', 'description', 'date', 'startTime', 'endTime',
      'classId', 'location', 'materials', 'learningOutcomes', 'media',
      'isPublished', 'publishedAt', 'status', 'createdBy',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'date' && body[field]) {
          updateData[field] = new Date(body[field]);
        } else if (field === 'publishedAt' && body[field]) {
          updateData[field] = new Date(body[field]);
        } else if (field === 'isPublished') {
          updateData[field] = body[field];
          // Set publishedAt when publishing
          if (body[field] === true && !existing.publishedAt) {
            updateData.publishedAt = new Date();
          }
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const activity = await db.activity.update({
      where: { id },
      data: updateData,
      include: {
        class: {
          select: { id: true, name: true, program: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ message: 'Activity updated successfully', activity });
  } catch (error) {
    console.error('Update activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/activities/[id] — Delete activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const existing = await db.activity.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    await db.activity.delete({ where: { id } });

    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
