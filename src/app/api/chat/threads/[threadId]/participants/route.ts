// ============================================================
// PreOne — Chat Thread Participants API
// GET    /api/chat/threads/[threadId]/participants — List participants
// POST   /api/chat/threads/[threadId]/participants — Add participants
// DELETE /api/chat/threads/[threadId]/participants — Remove participant
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, Role } from '@/lib/auth';

// ============================================================
// GET /api/chat/threads/[threadId]/participants — List thread participants
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

    // Get all active participants
    const participants = await prisma.chatParticipant.findMany({
      where: { threadId, leftAt: null },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true, email: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({
      participants: participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        role: p.role,
        isMuted: p.isMuted,
        isPinned: p.isPinned,
        joinedAt: p.joinedAt.toISOString(),
        user: p.user,
      })),
    });
  } catch (error) {
    console.error('List thread participants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// POST /api/chat/threads/[threadId]/participants — Add participants
// Body: { userIds: string[] }
// Only admin or thread creator can add participants
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

    // Check if user is an admin in this thread or a system admin
    const participation = await prisma.chatParticipant.findFirst({
      where: { threadId, userId: user.userId, leftAt: null },
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Access denied. You are not a participant in this thread.' },
        { status: 403 }
      );
    }

    if (participation.role !== 'admin' && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Only thread admins or system admins can add participants' },
        { status: 403 }
      );
    }

    // Get thread to check type
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // DIRECT threads can only have 2 participants
    if (thread.type === 'DIRECT') {
      return NextResponse.json(
        { error: 'Cannot add participants to a DIRECT thread' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds must be a non-empty array' }, { status: 400 });
    }

    // Validate that all userIds exist and are active
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true },
      select: { id: true },
    });

    const existingUserIds = new Set(existingUsers.map((u) => u.id));
    const invalidIds = userIds.filter((id: string) => !existingUserIds.has(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Users not found or inactive: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for users who are already participants (active or left)
    const existingParticipants = await prisma.chatParticipant.findMany({
      where: { threadId, userId: { in: userIds } },
    });

    const alreadyActive = existingParticipants.filter((p) => !p.leftAt);
    const previouslyLeft = existingParticipants.filter((p) => p.leftAt);

    // Cannot add users who are already active participants
    if (alreadyActive.length > 0) {
      const activeNames = alreadyActive.map((p) => p.userId);
      return NextResponse.json(
        { error: `Users are already participants: ${activeNames.join(', ')}` },
        { status: 400 }
      );
    }

    // Re-add users who previously left (clear leftAt)
    if (previouslyLeft.length > 0) {
      await prisma.chatParticipant.updateMany({
        where: {
          threadId,
          id: { in: previouslyLeft.map((p) => p.id) },
        },
        data: {
          leftAt: null,
          joinedAt: new Date(),
        },
      });
    }

    // Add new users who were never participants
    const newUserIds = userIds.filter(
      (id: string) => !existingParticipants.some((p) => p.userId === id)
    );

    if (newUserIds.length > 0) {
      await prisma.chatParticipant.createMany({
        data: newUserIds.map((userId: string) => ({
          threadId,
          userId,
          role: 'member',
        })),
      });
    }

    // Create system message about new participants
    const addedNames = userIds.length;
    await prisma.message.create({
      data: {
        threadId,
        senderId: user.userId,
        content: `added ${addedNames} participant${addedNames > 1 ? 's' : ''} to the group`,
        type: 'SYSTEM',
        metadata: JSON.stringify({ addedUserIds: userIds }),
      },
    });

    return NextResponse.json({
      message: 'Participants added successfully',
      addedCount: userIds.length,
      reAddedCount: previouslyLeft.length,
      newCount: newUserIds.length,
    });
  } catch (error) {
    console.error('Add thread participants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/chat/threads/[threadId]/participants — Remove participant
// Body: { userId: string }
// Only admin or thread creator can remove participants
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { threadId } = await params;

    const body = await request.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Check if user is an admin in this thread or a system admin
    const participation = await prisma.chatParticipant.findFirst({
      where: { threadId, userId: user.userId, leftAt: null },
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Access denied. You are not a participant in this thread.' },
        { status: 403 }
      );
    }

    // Users can remove themselves, or admins can remove others
    const isSelfRemoval = targetUserId === user.userId;
    const isAdmin = participation.role === 'admin' || user.role === Role.ADMIN;

    if (!isSelfRemoval && !isAdmin) {
      return NextResponse.json(
        { error: 'Only thread admins or system admins can remove other participants' },
        { status: 403 }
      );
    }

    // Check if the thread exists
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // For DIRECT threads, participants cannot be removed
    if (thread.type === 'DIRECT') {
      return NextResponse.json(
        { error: 'Cannot remove participants from a DIRECT thread' },
        { status: 400 }
      );
    }

    // Find the target participant
    const targetParticipation = await prisma.chatParticipant.findFirst({
      where: { threadId, userId: targetUserId, leftAt: null },
    });

    if (!targetParticipation) {
      return NextResponse.json(
        { error: 'Target user is not an active participant in this thread' },
        { status: 404 }
      );
    }

    // Cannot remove another admin unless you are a system admin
    if (targetParticipation.role === 'admin' && !isSelfRemoval && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Cannot remove another admin from the thread' },
        { status: 403 }
      );
    }

    // Soft-remove: set leftAt instead of deleting
    await prisma.chatParticipant.update({
      where: { id: targetParticipation.id },
      data: { leftAt: new Date() },
    });

    // Create system message about participant removal
    const removalType = isSelfRemoval ? 'left' : 'was removed from';
    await prisma.message.create({
      data: {
        threadId,
        senderId: isSelfRemoval ? user.userId : user.userId,
        content: `${isSelfRemoval ? 'A participant' : 'A participant'} ${removalType} the group`,
        type: 'SYSTEM',
        metadata: JSON.stringify({ removedUserId: targetUserId, selfRemoval: isSelfRemoval }),
      },
    });

    // If the removed user was the last admin, promote the longest-standing member
    if (targetParticipation.role === 'admin') {
      const remainingAdmins = await prisma.chatParticipant.count({
        where: { threadId, role: 'admin', leftAt: null },
      });

      if (remainingAdmins === 0) {
        const longestMember = await prisma.chatParticipant.findFirst({
          where: { threadId, leftAt: null, role: 'member' },
          orderBy: { joinedAt: 'asc' },
        });

        if (longestMember) {
          await prisma.chatParticipant.update({
            where: { id: longestMember.id },
            data: { role: 'admin' },
          });
        }
      }
    }

    return NextResponse.json({
      message: isSelfRemoval ? 'You have left the thread' : 'Participant removed successfully',
    });
  } catch (error) {
    console.error('Remove thread participant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
