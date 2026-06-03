// ============================================================
// GET  /api/passport/[studentId]/memories — List memories (paginated)
// POST /api/passport/[studentId]/memories — Add a new memory (teacher/admin)
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

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const [memories, total] = await Promise.all([
    db.memory.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    db.memory.count({ where: { studentId } }),
  ]);

  return NextResponse.json({
    memories,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
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

  // Only teachers and admins can add memories
  if (user.role !== Role.TEACHER && user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Only teachers and admins can add memories' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, mediaUrl, mediaType, date } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Verify student exists
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const memory = await db.memory.create({
      data: {
        studentId,
        title: title.trim(),
        description: description?.trim() || null,
        mediaUrl: mediaUrl?.trim() || null,
        mediaType: mediaType?.trim() || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    // ── Notify parent ──
    try {
      const studentParents = await db.studentParent.findMany({
        where: { studentId },
        select: { parentId: true },
      });

      for (const sp of studentParents) {
        // Find the User record for this parent
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
              title: 'New Memory Added! 📸',
              message: `A new memory "${title}" has been added to ${student.firstName}'s passport.`,
              type: 'INFO',
              category: 'PASSPORT',
              link: `/parent/children/${studentId}/passport`,
            },
          });
        }
      }
    } catch {
      // Notification failure should not block the operation
    }

    return NextResponse.json({ memory }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
