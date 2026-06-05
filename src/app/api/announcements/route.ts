// ============================================================
// PreOne — /api/announcements
// Announcement list (GET) and create (POST) endpoints
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, requireAdmin, Role } from '@/lib/auth';
import { requireTeacher, requireParent, isAuthError } from '@/lib/api-auth';
import { createBulkNotifications, NotificationTemplates } from '@/lib/notifications';

// ── Helper: get recipients for an announcement ──
async function getAnnouncementRecipients(
  schoolId: string,
  target: string,
  branchId?: string | null,
  classId?: string | null,
  targetIds?: string | null
): Promise<string[]> {
  if (target === 'SPECIFIC') {
    if (!targetIds) return [];
    try {
      const ids: string[] = JSON.parse(targetIds);
      return ids;
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
    // Find parents of students in this class + the class teacher
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

      // Get user IDs for these parents
      const parentUsers = await prisma.parent.findMany({
        where: { id: { in: parentIds } },
        select: { email: true, phone: true },
      });

      const parentEmailsPhones = parentUsers.flatMap((p) =>
        [p.email, p.phone].filter(Boolean)
      );

      const classTeacher = await prisma.class.findUnique({
        where: { id: classId },
        select: { teacherId: true },
      });

      const orConditions: Record<string, unknown>[] = [];

      if (parentEmailsPhones.length > 0) {
        orConditions.push({
          role: 'PARENT',
          email: { in: parentEmailsPhones },
        });
      }

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
    // Default: ALL
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
    // Find or create the class group chat thread
    let thread = await prisma.chatThread.findFirst({
      where: { classId, type: 'CLASS_GROUP', schoolId, isActive: true },
    });

    if (!thread) {
      thread = await prisma.chatThread.create({
        data: {
          type: 'CLASS_GROUP',
          name: `Class Group`,
          schoolId,
          classId,
          isActive: true,
        },
      });

      // Add class teacher as participant if exists
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

    // Post the announcement message
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId,
        content: `📢 ${title}\n\n${content}`,
        type: 'ANNOUNCEMENT',
        metadata: JSON.stringify({ announcementId }),
      },
    });

    // Update thread last message info
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

// ── GET /api/announcements — List announcements ──
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const target = searchParams.get('target') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // ── Role-based visibility ──
    if (user.role === Role.ADMIN) {
      // Admin sees all for their school
      if (user.schoolId) where.schoolId = user.schoolId;
      // Admin can optionally filter by branch
      const branchFilter = searchParams.get('branchId');
      if (branchFilter) where.branchId = branchFilter;
      // Admin can see all statuses, but can filter
      if (status) where.status = status;
    } else if (user.role === Role.TEACHER) {
      // Teacher sees published + their branch/class targeted
      const teacherAuth = await requireTeacher(request);
      if (isAuthError(teacherAuth)) return teacherAuth.error;

      where.status = 'PUBLISHED';
      if (status) where.status = status;

      const teacherBranchId = teacherAuth.teacher.branchId;
      const teacherClassId = teacherAuth.classId;

      const orConditions: Record<string, unknown>[] = [
        { target: 'ALL' },
        { target: 'TEACHERS' },
      ];

      if (teacherBranchId) {
        orConditions.push({ target: 'BRANCH', branchId: teacherBranchId });
      }
      if (teacherClassId) {
        orConditions.push({ target: 'CLASS', classId: teacherClassId });
      }

      where.OR = orConditions;
      where.schoolId = user.schoolId;
    } else if (user.role === Role.PARENT) {
      // Parent sees published + their child's class targeted
      const parentAuth = await requireParent(request);
      if (isAuthError(parentAuth)) return parentAuth.error;

      where.status = 'PUBLISHED';
      if (status) where.status = status;

      const classIds = parentAuth.children
        .map((c) => c.class?.id)
        .filter((id): id is string => !!id);

      const orConditions: Record<string, unknown>[] = [
        { target: 'ALL' },
        { target: 'PARENTS' },
      ];

      for (const classId of classIds) {
        orConditions.push({ target: 'CLASS', classId });
      }

      where.OR = orConditions;
      where.schoolId = user.schoolId;
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (type) where.type = type;
    if (target && user.role === Role.ADMIN) where.target = target;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, avatar: true } },
          _count: { select: { reads: true } },
          reads: {
            where: { userId: user.userId },
            select: { id: true },
          },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    const formatted = announcements.map((a) => ({
      id: a.id,
      schoolId: a.schoolId,
      title: a.title,
      content: a.content,
      type: a.type,
      priority: a.priority,
      target: a.target,
      targetIds: a.targetIds,
      branchId: a.branchId,
      classId: a.classId,
      coverImage: a.coverImage,
      attachments: a.attachments,
      status: a.status,
      publishedAt: a.publishedAt?.toISOString() || null,
      scheduledAt: a.scheduledAt?.toISOString() || null,
      expiresAt: a.expiresAt?.toISOString() || null,
      channels: a.channels,
      sendAsChat: a.sendAsChat,
      createdBy: a.createdBy,
      totalRecipients: a.totalRecipients,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      creator: a.creator,
      readCount: a._count.reads,
      isRead: a.reads.length > 0,
    }));

    return NextResponse.json({
      announcements: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/announcements — Create announcement (ADMIN + TEACHER only) ──
export async function POST(request: NextRequest) {
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

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
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
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      );
    }

    const isPublished = bodyStatus === 'PUBLISHED' && !scheduledAt;
    const isScheduled = !!scheduledAt;
    const finalStatus = isScheduled
      ? 'SCHEDULED'
      : isPublished
        ? 'PUBLISHED'
        : 'DRAFT';

    // Teacher can only create for their own branch/class
    let finalBranchId = branchId || null;
    let finalClassId = classId || null;

    if (user.role === Role.TEACHER) {
      const teacherAuth = await requireTeacher(request);
      if (isAuthError(teacherAuth)) return teacherAuth.error;

      // Teachers are restricted to their own branch/class
      finalBranchId = teacherAuth.teacher.branchId;
      finalClassId = teacherAuth.classId;
    }

    const announcement = await prisma.announcement.create({
      data: {
        schoolId: user.schoolId,
        title,
        content,
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        target: target || 'ALL',
        targetIds: targetIds ? JSON.stringify(targetIds) : null,
        branchId: finalBranchId,
        classId: finalClassId,
        coverImage: coverImage || null,
        attachments: attachments ? JSON.stringify(attachments) : undefined,
        status: finalStatus,
        publishedAt: isPublished ? new Date() : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        channels: channels ? JSON.stringify(channels) : undefined,
        sendAsChat: sendAsChat !== false,
        createdBy: user.userId,
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
      },
    });

    // ── If published, create notifications and handle chat ──
    if (isPublished && user.schoolId) {
      try {
        const recipientIds = await getAnnouncementRecipients(
          user.schoolId,
          announcement.target,
          announcement.branchId,
          announcement.classId,
          announcement.targetIds
        );

        // Update totalRecipients
        await prisma.announcement.update({
          where: { id: announcement.id },
          data: { totalRecipients: recipientIds.length },
        });

        // Create notifications
        if (recipientIds.length > 0) {
          const template = NotificationTemplates.newAnnouncement(title);
          await createBulkNotifications(recipientIds, {
            schoolId: user.schoolId,
            ...template,
            link: '/announcements',
            senderId: user.userId,
          });
        }

        // Post to class chat if sendAsChat and classId
        if (sendAsChat !== false && finalClassId) {
          await postToClassChat(
            user.schoolId,
            finalClassId,
            announcement.id,
            title,
            content,
            user.userId
          );
        }
      } catch (notifError) {
        console.error('Announcement notification/chat error:', notifError);
      }
    }

    return NextResponse.json(
      {
        message: 'Announcement created successfully',
        announcement: {
          ...announcement,
          readCount: 0,
          isRead: false,
          publishedAt: announcement.publishedAt?.toISOString() || null,
          scheduledAt: announcement.scheduledAt?.toISOString() || null,
          expiresAt: announcement.expiresAt?.toISOString() || null,
          createdAt: announcement.createdAt.toISOString(),
          updatedAt: announcement.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
