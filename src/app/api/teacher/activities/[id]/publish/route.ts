import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';
import { getParentUserId } from '@/lib/api-auth';

// PATCH /api/teacher/activities/[id]/publish — Toggle publish status
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
      select: { id: true, assignedClass: { select: { id: true, name: true } } },
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

    const body = await request.json();
    const isPublished = body.isPublished ?? !existing.isPublished;
    const now = new Date();

    const updated = await db.activity.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? now : null,
      },
    });

    // If publishing, notify all parents in the class
    if (isPublished && !existing.isPublished && existing.classId) {
      try {
        const students = await db.student.findMany({
          where: { classId: existing.classId, status: 'ACTIVE' },
          select: { id: true },
        });

        for (const student of students) {
          const parentLink = await db.studentParent.findFirst({
            where: { studentId: student.id, isPrimary: true },
            select: { parentId: true },
          });

          if (parentLink?.parentId) {
            const notifyUserId = await getParentUserId(parentLink.parentId);
            if (notifyUserId) {
              await db.notification.create({
                data: {
                  userId: notifyUserId,
                  schoolId: user.schoolId || '',
                  title: `New Activity: ${existing.title}`,
                  message: `Your child has a ${existing.type.toLowerCase()} activity scheduled`,
                  type: 'ACTIVITY',
                  category: 'ACTIVITY',
                  link: '/parent/activities',
                },
              });
            }
          }
        }
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
      }
    }

    return NextResponse.json({
      message: isPublished ? 'Activity published — parents notified' : 'Activity unpublished',
      activity: updated,
    });
  } catch (error) {
    console.error('Publish activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
