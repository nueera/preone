// ============================================================
// PreOne — /api/announcements/[id]
// Get single (GET), update (PUT), delete (DELETE) announcement
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, requireAdmin, Role } from '@/lib/auth';
import { requireTeacher, isAuthError } from '@/lib/api-auth';

// ── GET /api/announcements/[id] — Get single announcement ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatar: true, email: true } },
        _count: { select: { reads: true } },
        reads: {
          where: { userId: user.userId },
          select: { id: true },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // School isolation check
    if (announcement.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Non-admin users can only see published announcements
    if (user.role !== Role.ADMIN && announcement.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    return NextResponse.json({
      announcement: {
        id: announcement.id,
        schoolId: announcement.schoolId,
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        priority: announcement.priority,
        target: announcement.target,
        targetIds: announcement.targetIds,
        branchId: announcement.branchId,
        classId: announcement.classId,
        coverImage: announcement.coverImage,
        attachments: announcement.attachments,
        status: announcement.status,
        publishedAt: announcement.publishedAt?.toISOString() || null,
        scheduledAt: announcement.scheduledAt?.toISOString() || null,
        expiresAt: announcement.expiresAt?.toISOString() || null,
        channels: announcement.channels,
        sendAsChat: announcement.sendAsChat,
        createdBy: announcement.createdBy,
        totalRecipients: announcement.totalRecipients,
        createdAt: announcement.createdAt.toISOString(),
        updatedAt: announcement.updatedAt.toISOString(),
        creator: announcement.creator,
        readCount: announcement._count.reads,
        isRead: announcement.reads.length > 0,
      },
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT /api/announcements/[id] — Update announcement (creator or admin only) ──
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (user.role !== Role.ADMIN && user.role !== Role.TEACHER) {
      return NextResponse.json(
        { error: 'Access denied. Admin or Teacher role required.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: { schoolId: true, createdBy: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // School isolation
    if (existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only creator or admin can edit
    if (user.role !== Role.ADMIN && existing.createdBy !== user.userId) {
      return NextResponse.json(
        { error: 'Only the creator or an admin can edit this announcement' },
        { status: 403 }
      );
    }

    // Cannot edit published announcements (must unpublish first)
    if (existing.status === 'PUBLISHED' && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Cannot edit a published announcement. Unpublish it first.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      type,
      priority,
      target,
      branchId,
      classId,
      targetIds,
      coverImage,
      attachments,
      channels,
      sendAsChat,
      scheduledAt,
      status: bodyStatus,
      expiresAt,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (target !== undefined) updateData.target = target;
    if (branchId !== undefined) updateData.branchId = branchId;
    if (classId !== undefined) updateData.classId = classId;
    if (targetIds !== undefined) updateData.targetIds = targetIds ? JSON.stringify(targetIds) : null;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (attachments !== undefined) updateData.attachments = attachments ? JSON.stringify(attachments) : undefined;
    if (channels !== undefined) updateData.channels = channels ? JSON.stringify(channels) : undefined;
    if (sendAsChat !== undefined) updateData.sendAsChat = sendAsChat;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;

    // Handle status transitions
    if (bodyStatus !== undefined) {
      if (bodyStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
        updateData.status = 'PUBLISHED';
        updateData.publishedAt = new Date();
      } else if (bodyStatus === 'DRAFT') {
        updateData.status = 'DRAFT';
        updateData.publishedAt = null;
      } else if (bodyStatus === 'SCHEDULED') {
        updateData.status = 'SCHEDULED';
        updateData.publishedAt = null;
      } else {
        updateData.status = bodyStatus;
      }
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { reads: true } },
      },
    });

    return NextResponse.json({
      message: 'Announcement updated successfully',
      announcement: {
        id: updated.id,
        schoolId: updated.schoolId,
        title: updated.title,
        content: updated.content,
        type: updated.type,
        priority: updated.priority,
        target: updated.target,
        targetIds: updated.targetIds,
        branchId: updated.branchId,
        classId: updated.classId,
        coverImage: updated.coverImage,
        attachments: updated.attachments,
        status: updated.status,
        publishedAt: updated.publishedAt?.toISOString() || null,
        scheduledAt: updated.scheduledAt?.toISOString() || null,
        expiresAt: updated.expiresAt?.toISOString() || null,
        channels: updated.channels,
        sendAsChat: updated.sendAsChat,
        createdBy: updated.createdBy,
        totalRecipients: updated.totalRecipients,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        creator: updated.creator,
        readCount: updated._count.reads,
      },
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE /api/announcements/[id] — Delete announcement (admin only) ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = requireAdmin(request);
    if (adminResult instanceof NextResponse) return adminResult;

    const { id } = await params;

    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: { schoolId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // School isolation
    if (existing.schoolId !== adminResult.schoolId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete reads first (should cascade, but explicit for safety)
    await prisma.announcementRead.deleteMany({
      where: { announcementId: id },
    });

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
