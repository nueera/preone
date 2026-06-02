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

    // Use the userId from requireParent (already resolved)
    const parentUserId = auth.userId;

    const participation = await db.chatParticipant.findFirst({
      where: { threadId, userId: parentUserId },
    });

    if (!participation) {
      return NextResponse.json({ error: 'Access denied. You are not a participant in this thread.' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // cursor for pagination

    // Fetch messages with correct cursor-based pagination
    // When loading older messages (before cursor), query desc then reverse for display
    const messages = await db.message.findMany({
      where: {
        threadId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: before ? 'desc' : 'asc' },
      take: limit,
    });

    // Reverse for display order (oldest first) when using cursor
    const displayMessages = before ? messages.reverse() : messages;

    // Mark unread messages from teacher as read
    await db.message.updateMany({
      where: {
        threadId,
        senderId: { not: parentUserId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Get teacher info for the thread
    const otherParticipant = await db.chatParticipant.findFirst({
      where: { threadId, userId: { not: parentUserId } },
    });

    let teacherInfo = null;
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
        isRead: m.isRead,
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
    const { content, type = 'TEXT' } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Use the userId from requireParent (already resolved)
    const parentUserId = auth.userId;

    const participation = await db.chatParticipant.findFirst({
      where: { threadId, userId: parentUserId },
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
        isRead: false,
      },
    });

    // Update thread's updatedAt
    await db.chatThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    // Create notification for teacher
    const otherParticipant = await db.chatParticipant.findFirst({
      where: { threadId, userId: { not: parentUserId } },
    });

    if (otherParticipant) {
      await db.notification.create({
        data: {
          userId: otherParticipant.userId,
          title: 'New Message',
          message: `${auth.parent.firstName} ${auth.parent.lastName} sent you a message`,
          type: 'CHAT',
          actionUrl: `/teacher/communication?thread=${threadId}`,
        },
      });
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        senderId: message.senderId,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Send chat message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
