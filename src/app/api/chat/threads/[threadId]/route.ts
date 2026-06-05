// ============================================================
// PreOne — Chat Thread Detail API
// GET /api/chat/threads/[threadId] — Get thread details with participants
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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

    // Get thread details with participants
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        school: { select: { id: true, name: true, logo: true } },
        branch: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, name: true, avatar: true, role: true, email: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json({
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
        isActive: thread.isActive,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
        school: thread.school,
        branch: thread.branch,
        class: thread.class,
        participants: thread.participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          role: p.role,
          isMuted: p.isMuted,
          isPinned: p.isPinned,
          joinedAt: p.joinedAt.toISOString(),
          user: p.user,
        })),
      },
      currentUserParticipation: {
        id: participation.id,
        role: participation.role,
        unreadCount: participation.unreadCount,
        isMuted: participation.isMuted,
        isPinned: participation.isPinned,
        lastReadAt: participation.lastReadAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Get chat thread error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
