import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// PATCH /api/teacher/observations/[id]/share — Toggle share with parent
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

    const existing = await db.observation.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            classId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    if (existing.student.classId !== teacher.assignedClass.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const isShared = body.isShared ?? !existing.isShared;

    const updated = await db.observation.update({
      where: { id },
      data: { isShared },
    });

    // If sharing, send notification to parent
    if (isShared && !existing.isShared) {
      try {
        const parentLink = await db.studentParent.findFirst({
          where: { studentId: existing.studentId, isPrimary: true },
          select: { parent: { select: { userId: true } } },
        });

        if (parentLink?.parent?.userId) {
          await db.notification.create({
            data: {
              userId: parentLink.parent.userId,
              title: `New Observation - ${existing.student.firstName} ${existing.student.lastName}`,
              message: `Your child's teacher has shared a ${existing.category.toLowerCase()} observation`,
              type: 'OBSERVATION',
              actionUrl: '/parent/observations',
            },
          });
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }

    return NextResponse.json({
      message: isShared ? 'Observation shared with parent' : 'Observation unshared from parent',
      observation: updated,
    });
  } catch (error) {
    console.error('Share observation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
