import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/chat/[threadId]/messages — Get messages for a thread
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { threadId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before') || '';

    // Verify teacher is a participant in this thread
    const participant = await db.chatParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: user.userId,
        },
      },
    });

    if (!participant || participant.leftAt) {
      return NextResponse.json({ error: 'You are not a participant in this thread' }, { status: 403 });
    }

    // Build where clause for pagination
    const where: Record<string, unknown> = { threadId, isDeleted: false };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    // Get messages
    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Mark thread as read for this teacher (reset unread count)
    await db.chatParticipant.update({
      where: { threadId_userId: { threadId, userId: user.userId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      sender: m.sender,
      content: m.content,
      type: m.type,
      mediaUrl: m.mediaUrl,
      replyToId: m.replyToId,
      isEdited: m.isEdited,
      reactions: m.reactions ? JSON.parse(m.reactions) : {},
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ messages: formatted });
  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teacher/chat/[threadId]/messages — Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { threadId } = await params;

    // Verify teacher is a participant in this thread
    const participant = await db.chatParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: user.userId,
        },
      },
    });

    if (!participant || participant.leftAt) {
      return NextResponse.json({ error: 'You are not a participant in this thread' }, { status: 403 });
    }

    const body = await request.json();
    const { content, type, mediaUrl, replyToId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Create message
    const message = await db.message.create({
      data: {
        threadId,
        senderId: user.userId,
        content: content.trim(),
        type: type || 'TEXT',
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
        userId: { not: user.userId },
        leftAt: null,
      },
      data: { unreadCount: { increment: 1 } },
    });

    // Create notification for other participants
    const otherParticipants = await db.chatParticipant.findMany({
      where: {
        threadId,
        userId: { not: user.userId },
        leftAt: null,
      },
      select: { userId: true },
    });

    const thread = await db.chatThread.findUnique({
      where: { id: threadId },
      select: { schoolId: true, type: true, name: true },
    });

    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { firstName: true, lastName: true },
    });

    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher';

    if (thread) {
      for (const other of otherParticipants) {
        await db.notification.create({
          data: {
            schoolId: thread.schoolId,
            userId: other.userId,
            title: `Message from ${teacherName}`,
            message: content.trim().length > 100 ? content.trim().substring(0, 100) + '...' : content.trim(),
            type: 'CHAT',
            category: 'COMMUNICATION',
            link: `/parent/communication`,
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: 'Message sent',
        msg: {
          id: message.id,
          senderId: message.senderId,
          sender: message.sender,
          content: message.content,
          type: message.type,
          mediaUrl: message.mediaUrl,
          replyToId: message.replyToId,
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
