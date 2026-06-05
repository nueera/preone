// ============================================================
// PreOne — Chat Messages API
// GET  /api/chat/threads/[threadId]/messages — Get messages with cursor pagination
// POST /api/chat/threads/[threadId]/messages — Send a message
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, Role } from '@/lib/auth';

// ============================================================
// GET /api/chat/threads/[threadId]/messages
// Query params: ?cursor=msgId&limit=50
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { threadId } = await params;

    // Verify user is a participant in this thread
    const participation = await prisma.chatParticipant.findFirst({
      where: { threadId, userId: user.userId, leftAt: null },
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Access denied. You are not a participant in this thread.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
    const cursor = searchParams.get('cursor'); // message ID for cursor-based pagination

    // Build where clause
    const where: Record<string, unknown> = {
      threadId,
      isDeleted: false,
    };

    if (cursor) {
      // Get the cursor message to find its createdAt
      const cursorMsg = await prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });

      if (cursorMsg) {
        where.createdAt = { lt: cursorMsg.createdAt };
      }
    }

    // Fetch messages (newest first for cursor-based pagination)
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Take one extra to determine hasMore
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            type: true,
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    // Reverse for display order (oldest first)
    const displayMessages = resultMessages.reverse();

    // Determine nextCursor (oldest message in the batch)
    const nextCursor = hasMore && resultMessages.length > 0 ? resultMessages[0].id : null;

    return NextResponse.json({
      messages: displayMessages.map((m) => ({
        id: m.id,
        threadId: m.threadId,
        senderId: m.senderId,
        sender: m.sender,
        content: m.content,
        type: m.type,
        mediaUrl: m.mediaUrl,
        mediaThumbnail: m.mediaThumbnail,
        mediaType: m.mediaType,
        mediaSize: m.mediaSize,
        replyToId: m.replyToId,
        replyTo: m.replyTo
          ? {
              id: m.replyTo.id,
              content: m.replyTo.content,
              senderId: m.replyTo.senderId,
              sender: m.replyTo.sender,
              type: m.replyTo.type,
            }
          : null,
        isEdited: m.isEdited,
        reactions: m.reactions ? JSON.parse(m.reactions) : {},
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// POST /api/chat/threads/[threadId]/messages
// Body: { content, type?, mediaUrl?, replyToId? }
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { threadId } = await params;

    // Verify user is a participant in this thread
    const participation = await prisma.chatParticipant.findFirst({
      where: { threadId, userId: user.userId, leftAt: null },
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Access denied. You are not a participant in this thread.' },
        { status: 403 }
      );
    }

    // Get thread details for permission checks
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (!thread.isActive) {
      return NextResponse.json({ error: 'Thread is not active' }, { status: 400 });
    }

    // Check if onlyAdminsCanMessage and user is not an admin in this thread
    if (thread.onlyAdminsCanMessage && participation.role !== 'admin' && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can send messages in this thread' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, type = 'TEXT', mediaUrl, replyToId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Validate message type
    const validTypes = ['TEXT', 'IMAGE', 'FILE', 'VOICE', 'ANNOUNCEMENT', 'SYSTEM'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid message type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate replyToId if provided
    if (replyToId) {
      const replyToMessage = await prisma.message.findFirst({
        where: { id: replyToId, threadId, isDeleted: false },
      });
      if (!replyToMessage) {
        return NextResponse.json({ error: 'Reply-to message not found in this thread' }, { status: 400 });
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: user.userId,
        content: content.trim(),
        type,
        mediaUrl: mediaUrl || null,
        replyToId: replyToId || null,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            type: true,
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    // Update thread's last message cache
    await prisma.chatThread.update({
      where: { id: threadId },
      data: {
        lastMessagePreview: content.trim().substring(0, 100),
        lastMessageAt: new Date(),
      },
    });

    // Increment unread count for other participants
    await prisma.chatParticipant.updateMany({
      where: {
        threadId,
        userId: { not: user.userId },
        leftAt: null,
      },
      data: { unreadCount: { increment: 1 } },
    });

    // Create notifications for other participants
    const otherParticipants = await prisma.chatParticipant.findMany({
      where: {
        threadId,
        userId: { not: user.userId },
        leftAt: null,
        isMuted: false,
      },
      select: { userId: true },
    });

    if (otherParticipants.length > 0) {
      const threadName = thread.name || 'Chat';
      await prisma.notification.createMany({
        data: otherParticipants.map((op) => ({
          schoolId: thread.schoolId,
          userId: op.userId,
          title: 'New Message',
          message: `${user.name} sent a message in ${threadName}`,
          type: 'CHAT',
          category: 'COMMUNICATION',
          link: `/chat?thread=${threadId}`,
          senderId: user.userId,
        })),
      });
    }

    return NextResponse.json(
      {
        message: {
          id: message.id,
          threadId: message.threadId,
          senderId: message.senderId,
          sender: message.sender,
          content: message.content,
          type: message.type,
          mediaUrl: message.mediaUrl,
          replyToId: message.replyToId,
          replyTo: message.replyTo
            ? {
                id: message.replyTo.id,
                content: message.replyTo.content,
                senderId: message.replyTo.senderId,
                sender: message.replyTo.sender,
                type: message.replyTo.type,
              }
            : null,
          isEdited: message.isEdited,
          reactions: {},
          createdAt: message.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send chat message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
