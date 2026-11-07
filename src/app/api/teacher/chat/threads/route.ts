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
      where: { userId: user.userId, leftAt: null },
      select: { threadId: true, unreadCount: true, isPinned: true },
    });

    const threadIds = teacherParticipants.map((p) => p.threadId);

    if (threadIds.length === 0) {
      return NextResponse.json({ threads: [] });
    }

    const unreadMap = new Map(teacherParticipants.map((p) => [p.threadId, p.unreadCount]));
    const pinnedSet = new Set(teacherParticipants.filter((p) => p.isPinned).map((p) => p.threadId));

    // Get thread details with other participant and last message
    const threads = await db.chatThread.findMany({
      where: { id: { in: threadIds }, isActive: true },
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
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });

    // Build response with other participant info
    const formattedThreads = await Promise.all(
      threads.map(async (thread) => {
        // Find the other participant(s)
        const otherParticipants = thread.participants.filter((p) => p.userId !== user.userId);

        let participantInfo: {
          userId: string;
          name: string;
          avatar: string | null;
          role: string;
          childName: string | null;
        } | null = null;
        let childName: string | null = null;

        if (otherParticipants.length === 1) {
          const other = otherParticipants[0];
          const otherUser = other.user;

          if (otherUser && otherUser.role === 'PARENT') {
            const parentRecord = await db.parent.findFirst({
              where: {
                OR: [
                  { email: otherUser.name },
                  { phone: otherUser.name },
                ],
              },
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

          participantInfo = otherUser
            ? {
                userId: otherUser.id,
                name: otherUser.name,
                avatar: otherUser.avatar,
                role: otherUser.role,
                childName,
              }
            : null;
        }

        const lastMessage = thread.messages[0] || null;

        return {
          id: thread.id,
          type: thread.type,
          name: thread.name,
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
          isPinned: pinnedSet.has(thread.id),
          lastMessageAt: thread.lastMessageAt?.toISOString() || null,
        };
      })
    );

    // Sort: pinned first, then unread, then by last message time
    formattedThreads.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '');
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
    const { parentId, type, name } = body;

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
      select: { id: true, branchId: true },
    });

    if (!assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 403 });
    }

    // Verify parent exists and has a child in teacher's class
    const parentUser = await db.user.findUnique({
      where: { id: parentId },
      select: { email: true, name: true, schoolId: true },
    });

    if (!parentUser) {
      return NextResponse.json({ error: 'Parent user not found' }, { status: 404 });
    }

    const parentRecord = await db.parent.findFirst({
      where: {
        OR: [
          { email: parentUser.email },
          { phone: parentUser.email },
        ],
      },
      select: { id: true },
    });

    if (!parentRecord) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
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
      where: { userId: user.userId, leftAt: null },
      select: { threadId: true },
    });

    const teacherThreadIds = existingTeacherThreads.map((p) => p.threadId);

    if (teacherThreadIds.length > 0) {
      const existingParentInThread = await db.chatParticipant.findFirst({
        where: {
          userId: parentId,
          threadId: { in: teacherThreadIds },
          leftAt: null,
        },
      });

      if (existingParentInThread) {
        const existingThread = await db.chatThread.findUnique({
          where: { id: existingParentInThread.threadId },
          include: { participants: { where: { leftAt: null } } },
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
        type: type || 'DIRECT',
        name: name || `${user.name} - ${parentUser.name}`,
        schoolId: parentUser.schoolId || user.schoolId || '',
        branchId: assignedClass.branchId,
        participants: {
          create: [
            { userId: user.userId, role: 'admin' },
            { userId: parentId, role: 'member' },
          ],
        },
      },
      include: { participants: { where: { leftAt: null } } },
    });

    return NextResponse.json(
      {
        message: 'Chat thread created',
        thread: {
          id: thread.id,
          type: thread.type,
          name: thread.name,
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
