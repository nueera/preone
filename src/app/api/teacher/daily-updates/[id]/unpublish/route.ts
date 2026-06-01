import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// PATCH /api/teacher/daily-updates/[id]/unpublish — Revert a published update to draft
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { id } = await params;

    // Find the teacher's assigned class
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true } } },
    });

    if (!teacher || !teacher.assignedClass) {
      return NextResponse.json({ error: 'Teacher or class not found' }, { status: 404 });
    }

    // Find the daily update and verify student belongs to teacher's class
    const dailyUpdate = await db.dailyUpdate.findUnique({
      where: { id },
      include: { student: { select: { classId: true } } },
    });

    if (!dailyUpdate) {
      return NextResponse.json({ error: 'Daily update not found' }, { status: 404 });
    }

    if (dailyUpdate.student.classId !== teacher.assignedClass.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (dailyUpdate.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Update is not published' }, { status: 400 });
    }

    const updated = await db.dailyUpdate.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
    });

    return NextResponse.json({
      message: 'Daily update unpublished successfully',
      dailyUpdate: updated,
    });
  } catch (error) {
    console.error('Unpublish daily update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
