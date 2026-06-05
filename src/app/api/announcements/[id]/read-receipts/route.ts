// ============================================================
// PreOne — /api/announcements/[id]/read-receipts
// Get read receipts (ADMIN only)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, Role } from '@/lib/auth';

// ── Helper: get all target user IDs for an announcement ──
async function getTargetUserIds(
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

// ── GET /api/announcements/[id]/read-receipts — Get read receipts (ADMIN only) ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = requireAdmin(request);
    if (adminResult instanceof NextResponse) return adminResult;

    const { id } = await params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: {
        schoolId: true,
        target: true,
        branchId: true,
        classId: true,
        targetIds: true,
        totalRecipients: true,
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // School isolation
    if (announcement.schoolId !== adminResult.schoolId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all target user IDs
    const allTargetUserIds = await getTargetUserIds(
      announcement.schoolId,
      announcement.target,
      announcement.branchId,
      announcement.classId,
      announcement.targetIds
    );

    // Get read records for this announcement
    const readRecords = await prisma.announcementRead.findMany({
      where: { announcementId: id },
      select: {
        userId: true,
        readAt: true,
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const readUserIds = new Set(readRecords.map((r) => r.userId));

    // Build readBy list
    const readBy = readRecords.map((r) => ({
      userId: r.userId,
      name: r.user.name,
      avatar: r.user.avatar,
      readAt: r.readAt.toISOString(),
    }));

    // Build notReadBy list — target users who haven't read
    const notReadUserIds = allTargetUserIds.filter((uid) => !readUserIds.has(uid));

    let notReadBy: Array<{ userId: string; name: string; avatar: string | null }> = [];
    if (notReadUserIds.length > 0) {
      const notReadUsers = await prisma.user.findMany({
        where: { id: { in: notReadUserIds } },
        select: { id: true, name: true, avatar: true },
      });
      notReadBy = notReadUsers.map((u) => ({
        userId: u.id,
        name: u.name,
        avatar: u.avatar,
      }));
    }

    return NextResponse.json({
      readBy,
      notReadBy,
      stats: {
        total: allTargetUserIds.length,
        read: readBy.length,
        unread: notReadBy.length,
      },
    });
  } catch (error) {
    console.error('Get read receipts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
