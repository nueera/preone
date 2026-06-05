// ============================================================
// PreOne — Chat Threads API
// GET  /api/chat/threads  — List user's chat threads
// POST /api/chat/threads  — Create new thread
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, Role } from '@/lib/auth';

// ============================================================
// Helper: Authenticate any user and return user info
// ============================================================
function authenticateRequest(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  return user;
}

// ============================================================
// GET /api/chat/threads — List user's chat threads
// Sorted by lastMessageAt (most recent first)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (user instanceof NextResponse) return user;

    const userId = user.userId;

    // Get all active participations for this user
    const participations = await prisma.chatParticipant.findMany({
      where: { userId, leftAt: null },
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
              include: {
                sender: { select: { id: true, name: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    let totalUnread = 0;

    const threads = participations
      .map((p) => {
        const thread = p.thread;
        const lastMessage = thread.messages[0] || null;

        totalUnread += p.unreadCount;

        return {
          id: thread.id,
          type: thread.type,
          name: thread.name,
          schoolId: thread.schoolId,
          branchId: thread.branchId,
          classId: thread.classId,
          lastMessagePreview: thread.lastMessagePreview,
          lastMessageAt: thread.lastMessageAt?.toISOString() || null,
          onlyAdminsCanMessage: thread.onlyAdminsCanMessage,
          isActive: thread.isActive,
          createdAt: thread.createdAt.toISOString(),
          participants: thread.participants.map((tp) => ({
            id: tp.id,
            userId: tp.userId,
            role: tp.role,
            isMuted: tp.isMuted,
            isPinned: tp.isPinned,
            joinedAt: tp.joinedAt.toISOString(),
            user: tp.user,
          })),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                type: lastMessage.type,
                senderId: lastMessage.senderId,
                sender: lastMessage.sender,
                createdAt: lastMessage.createdAt.toISOString(),
              }
            : null,
          unreadCount: p.unreadCount,
          isMuted: p.isMuted,
          isPinned: p.isPinned,
          lastReadAt: p.lastReadAt?.toISOString() || null,
        };
      })
      // Sort: pinned first, then by lastMessageAt desc
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '');
      });

    return NextResponse.json({ threads, totalUnread });
  } catch (error) {
    console.error('List chat threads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// POST /api/chat/threads — Create new thread
// Body: { type, name?, participantIds, branchId?, classId?, onlyAdminsCanMessage? }
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const {
      type,
      name,
      participantIds,
      branchId,
      classId,
      onlyAdminsCanMessage = false,
    } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json({ error: 'Thread type is required' }, { status: 400 });
    }

    const validTypes = ['DIRECT', 'CLASS_GROUP', 'BRANCH_GROUP', 'CUSTOM_GROUP'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid thread type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'participantIds must be a non-empty array' }, { status: 400 });
    }

    // Include the creator in participantIds if not already there
    const allParticipantIds = [...new Set([...participantIds, user.userId])];

    // For DIRECT threads: exactly 2 participants
    if (type === 'DIRECT' && allParticipantIds.length !== 2) {
      return NextResponse.json({ error: 'DIRECT threads must have exactly 2 participants' }, { status: 400 });
    }

    // For DIRECT: check if thread already exists between the 2 users
    if (type === 'DIRECT') {
      const otherUserId = allParticipantIds.find((id: string) => id !== user.userId);

      // Find threads where both users are participants
      const userThreads = await prisma.chatParticipant.findMany({
        where: { userId: user.userId, leftAt: null },
        select: { threadId: true },
      });

      const threadIds = userThreads.map((t) => t.threadId);

      if (threadIds.length > 0 && otherUserId) {
        const existingParticipation = await prisma.chatParticipant.findFirst({
          where: {
            userId: otherUserId,
            threadId: { in: threadIds },
            leftAt: null,
          },
          include: {
            thread: {
              include: {
                participants: {
                  where: { leftAt: null },
                  include: {
                    user: { select: { id: true, name: true, avatar: true, role: true } },
                  },
                },
              },
            },
          },
        });

        if (existingParticipation && existingParticipation.thread.type === 'DIRECT') {
          // Return existing thread
          return NextResponse.json({
            thread: {
              id: existingParticipation.thread.id,
              type: existingParticipation.thread.type,
              name: existingParticipation.thread.name,
              schoolId: existingParticipation.thread.schoolId,
              branchId: existingParticipation.thread.branchId,
              classId: existingParticipation.thread.classId,
              lastMessagePreview: existingParticipation.thread.lastMessagePreview,
              lastMessageAt: existingParticipation.thread.lastMessageAt?.toISOString() || null,
              onlyAdminsCanMessage: existingParticipation.thread.onlyAdminsCanMessage,
              participants: existingParticipation.thread.participants.map((p) => ({
                id: p.id,
                userId: p.userId,
                role: p.role,
                user: p.user,
              })),
            },
            message: 'Thread already exists',
          });
        }
      }
    }

    // For CLASS_GROUP: verify teacher or admin is creating
    if (type === 'CLASS_GROUP') {
      if (user.role !== Role.ADMIN && user.role !== Role.TEACHER) {
        return NextResponse.json(
          { error: 'Only admins and teachers can create class group threads' },
          { status: 403 }
        );
      }
      if (!classId) {
        return NextResponse.json({ error: 'classId is required for CLASS_GROUP threads' }, { status: 400 });
      }
    }

    // For BRANCH_GROUP: verify admin is creating
    if (type === 'BRANCH_GROUP') {
      if (user.role !== Role.ADMIN) {
        return NextResponse.json(
          { error: 'Only admins can create branch group threads' },
          { status: 403 }
        );
      }
      if (!branchId) {
        return NextResponse.json({ error: 'branchId is required for BRANCH_GROUP threads' }, { status: 400 });
      }
    }

    // Validate that all participantIds exist
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: allParticipantIds }, isActive: true },
      select: { id: true },
    });

    const existingUserIds = new Set(existingUsers.map((u) => u.id));
    const invalidIds = allParticipantIds.filter((id: string) => !existingUserIds.has(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Users not found or inactive: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Determine schoolId
    const schoolId = user.schoolId || '';

    if (!schoolId) {
      return NextResponse.json({ error: 'User must belong to a school' }, { status: 400 });
    }

    // Create the thread
    const thread = await prisma.chatThread.create({
      data: {
        type,
        name: name || null,
        schoolId,
        branchId: branchId || null,
        classId: classId || null,
        onlyAdminsCanMessage,
        participants: {
          create: allParticipantIds.map((participantId: string) => ({
            userId: participantId,
            role: participantId === user.userId ? 'admin' : 'member',
          })),
        },
      },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, name: true, avatar: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        thread: {
          id: thread.id,
          type: thread.type,
          name: thread.name,
          schoolId: thread.schoolId,
          branchId: thread.branchId,
          classId: thread.classId,
          lastMessagePreview: thread.lastMessagePreview,
          lastMessageAt: thread.lastMessageAt?.toISOString() || null,
          onlyAdminsCanMessage: thread.onlyAdminsCanMessage,
          participants: thread.participants.map((p) => ({
            id: p.id,
            userId: p.userId,
            role: p.role,
            user: p.user,
          })),
        },
        message: 'Thread created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create chat thread error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
