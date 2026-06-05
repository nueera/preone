// ============================================================
// PreOne — GET /api/parent/chat/[threadId]/messages
// Get messages for a chat thread
// POST /api/parent/chat/[threadId]/messages
// Send a message in a chat thread
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const { threadId } = await params;

    const parentUserId = auth.userId;

    const participation = await db.chatParticipant.findFirst({
      where: { threadId, userId: parentUserId, leftAt: null },
    });

    if (!participation) {
      return NextResponse.json({ error: 'Access denied. You are not a participant in this thread.' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // cursor for pagination

    // Fetch messages with correct cursor-based pagination
    const messages = await db.message.findMany({
      where: {
        threadId,
        isDeleted: false,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: before ? 'desc' : 'asc' },
      take: limit,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Reverse for display order (oldest first) when using cursor
    const displayMessages = before ? messages.reverse() : messages;

    // Mark thread as read for this parent (reset unread count)
    await db.chatParticipant.update({
      where: { threadId_userId: { threadId, userId: parentUserId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });

    // Get teacher info for the thread
    const otherParticipant = await db.chatParticipant.findFirst({
      where: { threadId, userId: { not: parentUserId }, leftAt: null },
    });

    let teacherInfo: {
      id: string;
      name: string;
      photo: string | null;
      className: string | null;
      phone: string;
    } | null = null;
    if (otherParticipant) {
      const teacher = await db.teacher.findFirst({
        where: { userId: otherParticipant.userId },
        include: { assignedClass: { select: { name: true } } },
      });
      if (teacher) {
        teacherInfo = {
          id: teacher.id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          photo: teacher.photo,
          className: teacher.assignedClass?.name || null,
          phone: teacher.phone,
        };
      }
    }

    return NextResponse.json({
      threadId,
      teacher: teacherInfo,
      messages: displayMessages.map(m => ({
        id: m.id,
        content: m.content,
        type: m.type,
        senderId: m.senderId,
        sender: m.sender,
        mediaUrl: m.mediaUrl,
        replyToId: m.replyToId,
        isEdited: m.isEdited,
        reactions: m.reactions ? JSON.parse(m.reactions) : {},
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const { threadId } = await params;
    const body = await request.json();
    const { content, type = 'TEXT', mediaUrl, replyToId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const parentUserId = auth.userId;

    const participation = await db.chatParticipant.findFirst({
      where: { threadId, userId: parentUserId, leftAt: null },
    });

    if (!participation) {
      return NextResponse.json({ error: 'Access denied. You are not a participant in this thread.' }, { status: 403 });
    }

    // Create the message
    const message = await db.message.create({
      data: {
        threadId,
        senderId: parentUserId,
        content: content.trim(),
        type,
        mediaUrl: mediaUrl || null,
        replyToId: replyToId || null,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update thread's last message cache
    await db.chatThread.update({
      where: { id: threadId },
      data: {
        lastMessagePreview: content.trim().substring(0, 100),
        lastMessageAt: new Date(),
      },
    });

    // Increment unread for other participants
    await db.chatParticipant.updateMany({
      where: {
        threadId,
        userId: { not: parentUserId },
        leftAt: null,
      },
      data: { unreadCount: { increment: 1 } },
    });

    // Create notification for teacher
    const otherParticipant = await db.chatParticipant.findFirst({
      where: { threadId, userId: { not: parentUserId }, leftAt: null },
    });

    const thread = await db.chatThread.findUnique({
      where: { id: threadId },
      select: { schoolId: true },
    });

    if (otherParticipant && thread) {
      await db.notification.create({
        data: {
          schoolId: thread.schoolId,
          userId: otherParticipant.userId,
          title: 'New Message',
          message: `${auth.parent.firstName} ${auth.parent.lastName} sent you a message`,
          type: 'CHAT',
          category: 'COMMUNICATION',
          link: `/teacher/communication?thread=${threadId}`,
        },
      });
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        senderId: message.senderId,
        sender: message.sender,
        mediaUrl: message.mediaUrl,
        replyToId: message.replyToId,
        createdAt: message.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Send chat message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
