import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';
import { getParentUserId } from '@/lib/api-auth';

// PATCH /api/teacher/daily-updates/[id]/publish — Publish a draft update
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
      include: { student: { select: { id: true, classId: true, firstName: true, lastName: true } } },
    });

    if (!dailyUpdate) {
      return NextResponse.json({ error: 'Daily update not found' }, { status: 404 });
    }

    if (dailyUpdate.student.classId !== teacher.assignedClass.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (dailyUpdate.status === 'PUBLISHED') {
      return NextResponse.json({ error: 'Update is already published' }, { status: 400 });
    }

    const now = new Date();
    const updated = await db.dailyUpdate.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: now },
    });

    // Send notification to parent
    try {
      const parentLink = await db.studentParent.findFirst({
        where: { studentId: dailyUpdate.studentId, isPrimary: true },
        select: { parentId: true },
      });

      if (parentLink?.parentId) {
        const notifyUserId = await getParentUserId(parentLink.parentId);
        if (notifyUserId) {
          await db.notification.create({
            data: {
              userId: notifyUserId,
              schoolId: user.schoolId || '',
              title: `Daily Update - ${dailyUpdate.student.firstName} ${dailyUpdate.student.lastName}`,
              message: `Today's update is now available`,
              type: 'DAILY_UPDATE',
              category: 'COMMUNICATION',
              link: `/parent/daily-updates?student=${dailyUpdate.studentId}&date=${dailyUpdate.date.toISOString().split('T')[0]}`,
            },
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    return NextResponse.json({
      message: 'Daily update published successfully',
      dailyUpdate: updated,
    });
  } catch (error) {
    console.error('Publish daily update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
