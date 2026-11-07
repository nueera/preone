// ============================================================
// GET  /api/passport/[studentId]/achievements — List achievements
// POST /api/passport/[studentId]/achievements — Add achievement (teacher/admin)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, Role } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const achievements = await db.achievement.findMany({
    where: { studentId },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ achievements });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== Role.TEACHER && user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Only teachers and admins can add achievements' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, icon, date } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const achievement = await db.achievement.create({
      data: {
        studentId,
        title: title.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    // ── Notify parent using milestoneAchieved template ──
    try {
      const studentParents = await db.studentParent.findMany({
        where: { studentId },
        select: { parentId: true },
      });

      for (const sp of studentParents) {
        const parent = await db.parent.findUnique({
          where: { id: sp.parentId },
          select: { email: true, phone: true },
        });
        if (!parent) continue;

        const parentUser = await db.user.findFirst({
          where: {
            role: 'PARENT',
            OR: [
              ...(parent.email ? [{ email: parent.email }] : []),
              { email: parent.phone },
            ],
          },
          select: { id: true, schoolId: true },
        });

        if (parentUser) {
          await db.notification.create({
            data: {
              schoolId: parentUser.schoolId || 'default',
              userId: parentUser.id,
              title: 'New Achievement Unlocked! 🏆',
              message: `${student.firstName} has achieved "${title}"! Celebrate this milestone!`,
              type: 'SUCCESS',
              category: 'PASSPORT',
              link: `/parent/children/${studentId}/passport`,
            },
          });
        }
      }
    } catch {
      // Notification failure should not block
    }

    return NextResponse.json({ achievement }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
