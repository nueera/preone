import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/chat/threads — Get all chat threads for the teacher
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    // Find all chat threads where the teacher is a participant
    const teacherParticipants = await db.chatParticipant.findMany({
      where: { userId: user.userId },
      select: { threadId: true },
    });

    const threadIds = teacherParticipants.map((p) => p.threadId);

    if (threadIds.length === 0) {
      return NextResponse.json({ threads: [] });
    }

    // Get thread details with other participant and last message
    const threads = await db.chatThread.findMany({
      where: { id: { in: threadIds } },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get unread counts for the teacher in each thread
    const unreadCounts = await db.message.groupBy({
      by: ['threadId'],
      where: {
        threadId: { in: threadIds },
        senderId: { not: user.userId },
        isRead: false,
      },
      _count: { id: true },
    });

    const unreadMap = new Map(unreadCounts.map((u) => [u.threadId, u._count.id]));

    // Build response with other participant info
    const formattedThreads = await Promise.all(
      threads.map(async (thread) => {
        // Find the other participant (parent)
        const otherParticipant = thread.participants.find((p) => p.userId !== user.userId);

        let participantInfo = null;
        let childName = null;

        if (otherParticipant) {
          // Get user info for the other participant
          const otherUser = await db.user.findUnique({
            where: { id: otherParticipant.userId },
            select: { id: true, name: true, role: true },
          });

          if (otherUser) {
            // If parent, find their child
            if (otherUser.role === 'PARENT') {
              const parentRecord = await db.parent.findFirst({
                where: { userId: otherUser.id },
                select: { id: true, firstName: true, lastName: true },
              });

              if (parentRecord) {
                const studentParent = await db.studentParent.findFirst({
                  where: { parentId: parentRecord.id },
                  include: {
                    student: {
                      select: { firstName: true, lastName: true, class: { select: { name: true } } },
                    },
                  },
                });
                if (studentParent) {
                  childName = `${studentParent.student.firstName} ${studentParent.student.lastName}`;
                }
              }
            }

            participantInfo = {
              userId: otherUser.id,
              name: otherUser.name,
              role: otherUser.role,
              childName,
            };
          }
        }

        const lastMessage = thread.messages[0] || null;

        return {
          id: thread.id,
          type: thread.type,
          title: thread.title,
          participant: participantInfo,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt.toISOString(),
                senderId: lastMessage.senderId,
                type: lastMessage.type,
              }
            : null,
          unreadCount: unreadMap.get(thread.id) || 0,
          updatedAt: thread.updatedAt.toISOString(),
        };
      })
    );

    // Sort: unread first, then by last message time
    formattedThreads.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json({ threads: formattedThreads });
  } catch (error) {
    console.error('Get chat threads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teacher/chat/threads — Create a new chat thread with a parent
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { parentId, type } = body;

    if (!parentId) {
      return NextResponse.json({ error: 'parentId is required' }, { status: 400 });
    }

    // Verify the parent has a child in the teacher's class
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      select: { id: true },
    });

    if (!assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 403 });
    }

    // Verify parent exists and has a child in teacher's class
    const parentRecord = await db.parent.findFirst({
      where: { userId: parentId },
      select: { id: true },
    });

    if (!parentRecord) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const studentParent = await db.studentParent.findFirst({
      where: {
        parentId: parentRecord.id,
        student: { classId: assignedClass.id, status: 'ACTIVE' },
      },
    });

    if (!studentParent) {
      return NextResponse.json(
        { error: 'This parent does not have a child in your class' },
        { status: 403 }
      );
    }

    // Check if a thread already exists between this teacher and parent
    const existingTeacherThreads = await db.chatParticipant.findMany({
      where: { userId: user.userId },
      select: { threadId: true },
    });

    const teacherThreadIds = existingTeacherThreads.map((p) => p.threadId);

    if (teacherThreadIds.length > 0) {
      const existingParentInThread = await db.chatParticipant.findFirst({
        where: {
          userId: parentId,
          threadId: { in: teacherThreadIds },
        },
      });

      if (existingParentInThread) {
        // Thread already exists, return it
        const existingThread = await db.chatThread.findUnique({
          where: { id: existingParentInThread.threadId },
          include: { participants: true },
        });

        return NextResponse.json({
          message: 'Thread already exists',
          thread: {
            id: existingThread!.id,
            type: existingThread!.type,
            participantId: parentId,
          },
        });
      }
    }

    // Create new thread
    const thread = await db.chatThread.create({
      data: {
        type: type || 'PARENT_TEACHER',
        participants: {
          create: [
            { userId: user.userId, role: 'TEACHER' },
            { userId: parentId, role: 'PARENT' },
          ],
        },
      },
      include: { participants: true },
    });

    return NextResponse.json(
      {
        message: 'Chat thread created',
        thread: {
          id: thread.id,
          type: thread.type,
          participantId: parentId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create chat thread error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
