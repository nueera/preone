// ============================================================
// PreOne — GET /api/parent/chat/threads
// Get chat threads for the parent's children's teachers
// POST /api/parent/chat/threads
// Create a new chat thread with a teacher
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    const parentUserId = auth.userId;

    // Get all threads where this parent user is a participant
    const participations = await db.chatParticipant.findMany({
      where: { userId: parentUserId, leftAt: null },
      include: {
        thread: {
          include: {
            participants: {
              where: { leftAt: null },
              include: {
                user: { select: { id: true, name: true, avatar: true, role: true } },
              },
            },
            messages: {
              where: { isDeleted: false },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    // Filter threads by child's class if childId provided
    let teacherIds: string[] | null = null;
    if (childId) {
      const child = auth.children.find(c => c.id === childId);
      if (child?.class?.teacher) {
        teacherIds = [child.class.teacher.id];
      }
    }

    const threads: {
      id: string;
      type: string;
      name: string | null;
      teacher: {
        id: string;
        name: string;
        photo: string | null;
        className: string | null;
        phone: string;
      };
      lastMessage: {
        content: string;
        createdAt: string;
        senderId: string;
      } | null;
      unreadCount: number;
      isPinned: boolean;
      isMuted: boolean;
      lastMessageAt: string | null;
    }[] = [];

    for (const participation of participations) {
      const thread = participation.thread;

      // Find the other participant(s)
      const otherParticipants = thread.participants.filter(p => p.userId !== parentUserId);
      if (otherParticipants.length === 0) continue;

      // For DMs, find the teacher
      const otherUser = otherParticipants[0].user;
      if (!otherUser) continue;

      const teacher = await db.teacher.findFirst({
        where: { userId: otherUser.id },
        include: {
          assignedClass: {
            select: { name: true },
          },
        },
      });

      if (!teacher) continue;

      // If filtering by child, check if this teacher teaches the child's class
      if (teacherIds && !teacherIds.includes(teacher.id)) continue;

      const lastMessage = thread.messages[0];

      threads.push({
        id: thread.id,
        type: thread.type,
        name: thread.name,
        teacher: {
          id: teacher.id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          photo: teacher.photo,
          className: teacher.assignedClass?.name || null,
          phone: teacher.phone,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt.toISOString(),
              senderId: lastMessage.senderId,
            }
          : null,
        unreadCount: participation.unreadCount,
        isPinned: participation.isPinned,
        isMuted: participation.isMuted,
        lastMessageAt: thread.lastMessageAt?.toISOString() || null,
      });
    }

    // Sort: pinned first, then by last message time (most recent first)
    threads.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '');
    });

    return NextResponse.json({ threads });
  } catch (error) {
    console.error('Parent chat threads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const body = await request.json();
    const { teacherId, childId } = body;

    if (!teacherId || !childId) {
      return NextResponse.json({ error: 'teacherId and childId are required' }, { status: 400 });
    }

    // Verify child belongs to parent
    const accessError = auth.childIds.includes(childId)
      ? null
      : NextResponse.json({ error: 'Access denied. This child is not linked to your account.' }, { status: 403 });

    if (accessError) return accessError;

    // Verify teacher teaches the child's class
    const child = auth.children.find(c => c.id === childId);
    if (!child?.class?.teacher || child.class.teacher.id !== teacherId) {
      return NextResponse.json({ error: 'You can only chat with your child\'s class teacher' }, { status: 403 });
    }

    const parentUserId = auth.userId;

    // Get teacher's user record
    const teacher = await db.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Check if thread already exists between these two users
    const allParentParticipations = await db.chatParticipant.findMany({
      where: { userId: parentUserId, leftAt: null },
      include: {
        thread: {
          include: {
            participants: { where: { leftAt: null } },
          },
        },
      },
    });

    for (const p of allParentParticipations) {
      const hasTeacher = p.thread.participants.some(pp => pp.userId === teacher.userId);
      if (hasTeacher) {
        // Thread already exists
        return NextResponse.json({
          threadId: p.threadId,
          message: 'Thread already exists',
        });
      }
    }

    // Get schoolId from parent user
    const parentUser = await db.user.findUnique({
      where: { id: parentUserId },
      select: { schoolId: true },
    });

    // Create new thread
    const thread = await db.chatThread.create({
      data: {
        type: 'DIRECT',
        name: `${auth.parent.firstName} ${auth.parent.lastName} - ${teacher.firstName} ${teacher.lastName}`,
        schoolId: parentUser?.schoolId || '',
        classId: child.class?.id,
        participants: {
          create: [
            { userId: parentUserId, role: 'member' },
            ...(teacher.userId ? [{ userId: teacher.userId, role: 'admin' as const }] : []),
          ],
        },
      },
    });

    if (!teacher.userId) {
      return NextResponse.json({ error: 'Teacher has no user account' }, { status: 400 });
    }

    return NextResponse.json({
      threadId: thread.id,
      message: 'Thread created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create chat thread error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
