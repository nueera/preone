// ============================================================
// PreOne — Chat Mark Read API
// PUT /api/chat/threads/[threadId]/read — Mark thread as read
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(
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

    const now = new Date();

    // Reset unreadCount to 0 and update lastReadAt
    await prisma.chatParticipant.update({
      where: { id: participation.id },
      data: {
        unreadCount: 0,
        lastReadAt: now,
      },
    });

    // Find all unread messages in this thread that this user hasn't read yet
    const unreadMessages = await prisma.message.findMany({
      where: {
        threadId,
        isDeleted: false,
        senderId: { not: user.userId },
        NOT: {
          readReceipts: {
            some: { userId: user.userId },
          },
        },
      },
      select: { id: true },
    });

    // Create MessageReadReceipt entries for all unread messages
    if (unreadMessages.length > 0) {
      await prisma.messageReadReceipt.createMany({
        data: unreadMessages.map((msg) => ({
          messageId: msg.id,
          userId: user.userId,
          readAt: now,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      message: 'Thread marked as read',
      readCount: unreadMessages.length,
      readAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Mark thread read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
