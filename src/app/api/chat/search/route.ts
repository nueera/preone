// ============================================================
// PreOne — Chat Search API
// GET /api/chat/search?q=keyword — Search messages across all user's threads
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query (q) is required' }, { status: 400 });
    }

    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const trimmedQuery = query.trim();

    // Get all thread IDs where the user is an active participant
    const participations = await prisma.chatParticipant.findMany({
      where: { userId: user.userId, leftAt: null },
      select: { threadId: true },
    });

    const threadIds = participations.map((p) => p.threadId);

    if (threadIds.length === 0) {
      return NextResponse.json({ messages: [], total: 0 });
    }

    // Search messages using contains (case-insensitive in SQLite)
    const messages = await prisma.message.findMany({
      where: {
        threadId: { in: threadIds },
        isDeleted: false,
        content: { contains: trimmedQuery },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
        thread: {
          select: {
            id: true,
            type: true,
            name: true,
            participants: {
              where: { leftAt: null },
              select: {
                userId: true,
                user: { select: { id: true, name: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    // Get total count for pagination info
    const total = await prisma.message.count({
      where: {
        threadId: { in: threadIds },
        isDeleted: false,
        content: { contains: trimmedQuery },
      },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        threadId: m.threadId,
        senderId: m.senderId,
        sender: m.sender,
        content: m.content,
        type: m.type,
        mediaUrl: m.mediaUrl,
        createdAt: m.createdAt.toISOString(),
        thread: {
          id: m.thread.id,
          type: m.thread.type,
          name: m.thread.name,
          participants: m.thread.participants.map((p) => ({
            userId: p.userId,
            name: p.user.name,
            avatar: p.user.avatar,
          })),
        },
      })),
      total,
      query: trimmedQuery,
    });
  } catch (error) {
    console.error('Chat search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
