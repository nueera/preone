// ============================================================
// PreOne — /api/announcements/[id]/publish
// Publish a draft/scheduled announcement (POST)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, requireAdmin, Role } from '@/lib/auth';
import { requireTeacher, isAuthError } from '@/lib/api-auth';
import { createBulkNotifications, NotificationTemplates } from '@/lib/notifications';

// ── Helper: get recipients for an announcement ──
async function getAnnouncementRecipients(
  schoolId: string,
  target: string,
  branchId: string | null,
  classId: string | null,
  targetIds: string | null
): Promise<string[]> {
  if (target === 'SPECIFIC') {
    if (!targetIds) return [];
    try {
      return JSON.parse(targetIds) as string[];
    } catch {
      return [];
    }
  }

  const userWhere: Record<string, unknown> = {
    schoolId,
    isActive: true,
  };

  if (target === 'ALL') {
    userWhere.role = { in: ['TEACHER', 'PARENT'] };
  } else if (target === 'TEACHERS') {
    userWhere.role = 'TEACHER';
  } else if (target === 'PARENTS') {
    userWhere.role = 'PARENT';
  } else if (target === 'BRANCH') {
    if (branchId) {
      userWhere.branchId = branchId;
      userWhere.role = { in: ['TEACHER', 'PARENT'] };
    } else {
      userWhere.role = { in: ['TEACHER', 'PARENT'] };
    }
  } else if (target === 'CLASS') {
    if (classId) {
      const students = await prisma.student.findMany({
        where: { classId, status: 'ACTIVE' },
        select: { id: true },
      });
      const studentIds = students.map((s) => s.id);

      const studentParents = await prisma.studentParent.findMany({
        where: { studentId: { in: studentIds } },
        select: { parentId: true },
      });
      const parentIds = [...new Set(studentParents.map((sp) => sp.parentId))];

      const parentUsers = await prisma.parent.findMany({
        where: { id: { in: parentIds } },
        select: { email: true, phone: true },
      });

      const emailsPhones = parentUsers.flatMap((p) =>
        [p.email, p.phone].filter(Boolean)
      );

      const orConditions: Record<string, unknown>[] = [];
      if (emailsPhones.length > 0) {
        orConditions.push({ role: 'PARENT', email: { in: emailsPhones } });
      }

      const classTeacher = await prisma.class.findUnique({
        where: { id: classId },
        select: { teacherId: true },
      });
      if (classTeacher?.teacherId) {
        const teacherUser = await prisma.teacher.findUnique({
          where: { id: classTeacher.teacherId },
          select: { userId: true },
        });
        if (teacherUser?.userId) {
          orConditions.push({ id: teacherUser.userId });
        }
      }

      if (orConditions.length === 0) return [];

      const users = await prisma.user.findMany({
        where: { schoolId, isActive: true, OR: orConditions },
        select: { id: true },
      });
      return users.map((u) => u.id);
    }
    return [];
  } else {
    userWhere.role = { in: ['TEACHER', 'PARENT'] };
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true },
  });
  return users.map((u) => u.id);
}

// ── Helper: post announcement to class group chat ──
async function postToClassChat(
  schoolId: string,
  classId: string,
  announcementId: string,
  title: string,
  content: string,
  senderId: string
) {
  try {
    let thread = await prisma.chatThread.findFirst({
      where: { classId, type: 'CLASS_GROUP', schoolId, isActive: true },
    });

    if (!thread) {
      thread = await prisma.chatThread.create({
        data: {
          type: 'CLASS_GROUP',
          name: 'Class Group',
          schoolId,
          classId,
          isActive: true,
        },
      });

      const classRecord = await prisma.class.findUnique({
        where: { id: classId },
        select: { teacherId: true },
      });
      if (classRecord?.teacherId) {
        const teacherUser = await prisma.teacher.findUnique({
          where: { id: classRecord.teacherId },
          select: { userId: true },
        });
        if (teacherUser?.userId) {
          await prisma.chatParticipant.create({
            data: {
              threadId: thread.id,
              userId: teacherUser.userId,
              role: 'admin',
            },
          });
        }
      }
    }

    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId,
        content: `📢 ${title}\n\n${content}`,
        type: 'ANNOUNCEMENT',
        metadata: JSON.stringify({ announcementId }),
      },
    });

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: {
        lastMessagePreview: `📢 ${title}`,
        lastMessageAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Post to class chat error:', error);
  }
}

// ── POST /api/announcements/[id]/publish — Publish a draft/scheduled announcement ──
export async function POST(
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

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // School isolation
    if (announcement.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only creator or admin can publish
    if (user.role !== Role.ADMIN && announcement.createdBy !== user.userId) {
      return NextResponse.json(
        { error: 'Only the creator or an admin can publish this announcement' },
        { status: 403 }
      );
    }

    // Can only publish DRAFT or SCHEDULED
    if (announcement.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Announcement is already published' },
        { status: 400 }
      );
    }

    if (announcement.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Cannot publish an expired announcement' },
        { status: 400 }
      );
    }

    // Calculate recipients
    const recipientIds = await getAnnouncementRecipients(
      announcement.schoolId,
      announcement.target,
      announcement.branchId,
      announcement.classId,
      announcement.targetIds
    );

    // Update announcement to PUBLISHED
    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        totalRecipients: recipientIds.length,
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { reads: true } },
      },
    });

    // Create notifications for all recipients
    try {
      if (recipientIds.length > 0 && user.schoolId) {
        const template = NotificationTemplates.newAnnouncement(announcement.title);
        await createBulkNotifications(recipientIds, {
          schoolId: user.schoolId,
          ...template,
          link: '/announcements',
          senderId: user.userId,
        });
      }
    } catch (notifError) {
      console.error('Announcement publish notification error:', notifError);
    }

    // Post to class chat if sendAsChat and classId
    if (announcement.sendAsChat && announcement.classId) {
      await postToClassChat(
        announcement.schoolId,
        announcement.classId,
        announcement.id,
        announcement.title,
        announcement.content,
        user.userId
      );
    }

    // Also post to branch chat if sendAsChat and branchId (but no classId)
    if (announcement.sendAsChat && announcement.branchId && !announcement.classId) {
      try {
        let branchThread = await prisma.chatThread.findFirst({
          where: {
            branchId: announcement.branchId,
            type: 'BRANCH_GROUP',
            schoolId: announcement.schoolId,
            isActive: true,
          },
        });

        if (!branchThread) {
          branchThread = await prisma.chatThread.create({
            data: {
              type: 'BRANCH_GROUP',
              name: 'Branch Group',
              schoolId: announcement.schoolId,
              branchId: announcement.branchId,
              isActive: true,
            },
          });
        }

        await prisma.message.create({
          data: {
            threadId: branchThread.id,
            senderId: user.userId,
            content: `📢 ${announcement.title}\n\n${announcement.content}`,
            type: 'ANNOUNCEMENT',
            metadata: JSON.stringify({ announcementId: announcement.id }),
          },
        });

        await prisma.chatThread.update({
          where: { id: branchThread.id },
          data: {
            lastMessagePreview: `📢 ${announcement.title}`,
            lastMessageAt: new Date(),
          },
        });
      } catch (chatError) {
        console.error('Post to branch chat error:', chatError);
      }
    }

    return NextResponse.json({
      message: 'Announcement published successfully',
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
    console.error('Publish announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
