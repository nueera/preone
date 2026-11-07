import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// PATCH /api/teacher/observations/[id] — Update an observation
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

    // Find observation and verify it belongs to a student in teacher's class
    const existing = await db.observation.findUnique({
      where: { id },
      include: { student: { select: { classId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    if (existing.student.classId !== teacher.assignedClass.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { category, content, priority, isShared, media } = body;

    // Validate category if provided
    if (category) {
      const validCategories = ['BEHAVIORAL', 'ACADEMIC', 'SOCIAL', 'EMOTIONAL', 'PHYSICAL', 'COGNITIVE'];
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    // Validate priority if provided
    if (priority) {
      const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'CONCERN'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
      }
    }

    // Validate content length if provided
    if (content !== undefined && content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (category) updateData.category = category;
    if (content) updateData.content = content.trim();
    if (priority) updateData.priority = priority;
    if (isShared !== undefined) updateData.isShared = isShared;
    if (media !== undefined) updateData.media = media;

    const updated = await db.observation.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Observation updated successfully',
      observation: updated,
    });
  } catch (error) {
    console.error('Update observation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teacher/observations/[id] — Delete an observation
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

    const existing = await db.observation.findUnique({
      where: { id },
      include: { student: { select: { classId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    if (existing.student.classId !== teacher.assignedClass.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.observation.delete({ where: { id } });

    return NextResponse.json({ message: 'Observation deleted successfully' });
  } catch (error) {
    console.error('Delete observation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
