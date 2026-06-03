import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { getBranchFromRequest } from '@/lib/branch';
import { createBulkNotifications, NotificationTemplates } from '@/lib/notifications';

// GET /api/communication/announcements — List announcements
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    // Branch isolation — Announcement has no schoolId/branchId,
    // so filter by school via createdBy user
    const branchScope = getBranchFromRequest(request, user);

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || '';
    const target = searchParams.get('target') || '';
    const priority = searchParams.get('priority') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (target) where.target = target;
    if (priority) where.priority = priority;

    // School isolation — filter announcements by createdBy users in the school
    if (branchScope.schoolId) {
      const schoolUsers = await db.user.findMany({
        where: { schoolId: branchScope.schoolId },
        select: { id: true },
      });
      const schoolUserIds = schoolUsers.map(u => u.id);
      where.createdBy = { in: schoolUserIds };
    }

    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.announcement.count({ where }),
    ]);

    return NextResponse.json({
      announcements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/communication/announcements — Create announcement
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const {
      title, content, type, target, priority, scheduledAt, channels,
    } = body;

    if (!title || !content || !type) {
      return NextResponse.json(
        { error: 'title, content, and type are required' },
        { status: 400 }
      );
    }

    const isScheduled = !!scheduledAt;
    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        type,
        target: target || 'All',
        priority: priority || 'NORMAL',
        status: isScheduled ? 'Scheduled' : 'Published',
        publishedAt: isScheduled ? null : new Date(),
        scheduledAt: isScheduled ? new Date(scheduledAt) : null,
        channels: channels || null,
        createdBy: user.userId,
      },
    });

    // ── Notify target audience when published (not scheduled) ──
    if (!isScheduled && user.schoolId) {
      try {
        const template = NotificationTemplates.newAnnouncement(title);
        // Determine target audience and find their user IDs
        const targetRole = target === 'Teachers' ? 'TEACHER' :
                          target === 'Parents' ? 'PARENT' : null;

        if (targetRole) {
          const targetUsers = await db.user.findMany({
            where: { schoolId: user.schoolId, role: targetRole as any, isActive: true },
            select: { id: true },
          });
          if (targetUsers.length > 0) {
            await createBulkNotifications(
              targetUsers.map((u) => u.id),
              {
                schoolId: user.schoolId,
                ...template,
                link: targetRole === 'TEACHER' ? '/teacher/communication' : '/parent/communication',
                senderId: user.userId,
              }
            );
          }
        } else {
          // 'All' — notify all teachers + parents in the school
          const allUsers = await db.user.findMany({
            where: {
              schoolId: user.schoolId,
              role: { in: ['TEACHER', 'PARENT'] },
              isActive: true,
            },
            select: { id: true },
          });
          if (allUsers.length > 0) {
            await createBulkNotifications(
              allUsers.map((u) => u.id),
              {
                schoolId: user.schoolId,
                ...template,
                senderId: user.userId,
              }
            );
          }
        }
      } catch (notifError) {
        console.error('Announcement notification error:', notifError);
      }
    }

    return NextResponse.json(
      { message: 'Announcement created successfully', announcement },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
