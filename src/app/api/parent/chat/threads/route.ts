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

    // Use the userId from requireParent (already resolved)
    const parentUserId = auth.userId;

    // Get all threads where this parent user is a participant
    const participations = await db.chatParticipant.findMany({
      where: { userId: parentUserId },
      include: {
        thread: {
          include: {
            participants: {
              include: {
                // We need to find the teacher among participants
              },
            },
            messages: {
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

    const threads = [];

    for (const participation of participations) {
      const thread = participation.thread;

      // Find the other participant (teacher)
      const otherParticipant = thread.participants.find(p => p.userId !== parentUserId);
      if (!otherParticipant) continue;

      // Get teacher info
      const teacher = await db.teacher.findFirst({
        where: { userId: otherParticipant.userId },
        include: {
          assignedClass: {
            select: { name: true },
          },
        },
      });

      if (!teacher) continue;

      // If filtering by child, check if this teacher teaches the child's class
      if (teacherIds && !teacherIds.includes(teacher.id)) continue;

      // Count unread messages (from teacher, not read by parent)
      const unreadCount = await db.message.count({
        where: {
          threadId: thread.id,
          senderId: otherParticipant.userId,
          isRead: false,
        },
      });

      const lastMessage = thread.messages[0];

      threads.push({
        id: thread.id,
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
        unreadCount,
      });
    }

    // Sort by last message time (most recent first)
    threads.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || '';
      const bTime = b.lastMessage?.createdAt || '';
      return bTime.localeCompare(aTime);
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

    // Use the userId from requireParent (already resolved)
    const parentUserId = auth.userId;

    // Get teacher's user record
    const teacher = await db.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Check if thread already exists between these two users
    const allParentParticipations = await db.chatParticipant.findMany({
      where: { userId: parentUserId },
      include: {
        thread: {
          include: {
            participants: true,
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

    // Create new thread
    const thread = await db.chatThread.create({
      data: {
        type: 'DIRECT',
        title: `${auth.parent.firstName} ${auth.parent.lastName} - ${teacher.firstName} ${teacher.lastName}`,
      },
    });

    await db.chatParticipant.create({
      data: { threadId: thread.id, userId: parentUserId, role: 'PARENT' },
    });

    // Teacher must have a linked User account to be a chat participant
    if (!teacher.userId) {
      return NextResponse.json({ error: 'Teacher has no user account' }, { status: 400 });
    }

    await db.chatParticipant.create({
      data: { threadId: thread.id, userId: teacher.userId, role: 'TEACHER' },
    });

    return NextResponse.json({
      threadId: thread.id,
      message: 'Thread created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create chat thread error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
