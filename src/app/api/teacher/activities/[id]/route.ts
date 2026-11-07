import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/activities/[id] — Get single activity detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { id } = await params;

    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true } } },
    });

    if (!teacher || !teacher.assignedClass) {
      return NextResponse.json({ error: 'Teacher or class not found' }, { status: 404 });
    }

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

    if (activity.classId !== teacher.assignedClass.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/teacher/activities/[id] — Update an activity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { id } = await params;

    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true } } },
    });

    if (!teacher || !teacher.assignedClass) {
      return NextResponse.json({ error: 'Teacher or class not found' }, { status: 404 });
    }

    const existing = await db.activity.findUnique({
      where: { id },
      include: { class: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    if (existing.classId !== teacher.assignedClass.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      type,
      description,
      date,
      startTime,
      endTime,
      location,
      materials,
      learningOutcomes,
      status,
      isPublished,
    } = body;

    // Validate type if provided
    if (type) {
      const validTypes = ['ART', 'MUSIC', 'DANCE', 'SPORTS', 'ACADEMIC', 'OUTDOOR', 'INDOOR', 'CRAFT'];
      if (!validTypes.includes(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date + 'T00:00:00.000Z');
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (location !== undefined) updateData.location = location;
    if (materials !== undefined) updateData.materials = materials;
    if (learningOutcomes !== undefined) updateData.learningOutcomes = learningOutcomes;
    if (status !== undefined) updateData.status = status;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished && !existing.isPublished) {
        updateData.publishedAt = new Date();
      } else if (!isPublished) {
        updateData.publishedAt = null;
      }
    }

    const updated = await db.activity.update({
      where: { id },
      data: updateData,
      include: {
        class: {
          select: { id: true, name: true, program: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({
      message: 'Activity updated successfully',
      activity: updated,
    });
  } catch (error) {
    console.error('Update activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teacher/activities/[id] — Delete an activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { id } = await params;

    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true } } },
    });

    if (!teacher || !teacher.assignedClass) {
      return NextResponse.json({ error: 'Teacher or class not found' }, { status: 404 });
    }

    const existing = await db.activity.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    if (existing.classId !== teacher.assignedClass.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.activity.delete({ where: { id } });

    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
