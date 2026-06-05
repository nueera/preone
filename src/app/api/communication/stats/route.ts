import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranchFromRequest } from '@/lib/branch';

// GET /api/communication/stats — Communication stats
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const branchScope = getBranchFromRequest(request, user);

    const announcementWhere: Record<string, unknown> = {};
    if (branchScope.schoolId) announcementWhere.schoolId = branchScope.schoolId;

    // Announcements count
    const totalAnnouncements = await db.announcement.count({
      where: announcementWhere,
    });

    // Announcements by type
    const announcementsByType: Record<string, number> = {};
    const allAnnouncements = await db.announcement.findMany({
      where: announcementWhere,
      select: { type: true },
    });
    for (const a of allAnnouncements) {
      announcementsByType[a.type] = (announcementsByType[a.type] || 0) + 1;
    }

    // Announcements by priority
    const announcementsByPriority: Record<string, number> = {};
    const allByPriority = await db.announcement.findMany({
      where: announcementWhere,
      select: { priority: true },
    });
    for (const a of allByPriority) {
      announcementsByPriority[a.priority] = (announcementsByPriority[a.priority] || 0) + 1;
    }

    // Published this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const publishedThisMonth = await db.announcement.count({
      where: {
        ...announcementWhere,
        publishedAt: { gte: monthStart },
      },
    });

    // Scheduled announcements
    const scheduled = await db.announcement.count({
      where: {
        ...announcementWhere,
        status: 'SCHEDULED',
      },
    });

    // Chat threads count
    const threadWhere: Record<string, unknown> = {};
    if (branchScope.schoolId) threadWhere.schoolId = branchScope.schoolId;

    const activeChatThreads = await db.chatThread.count({
      where: { ...threadWhere, isActive: true },
    });

    // Messages this month
    const messagesThisMonth = await db.message.count({
      where: {
        createdAt: { gte: monthStart },
        thread: branchScope.schoolId ? { schoolId: branchScope.schoolId } : undefined,
      },
    });

    // Messages today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messagesToday = await db.message.count({
      where: {
        createdAt: { gte: todayStart },
        thread: branchScope.schoolId ? { schoolId: branchScope.schoolId } : undefined,
      },
    });

    // Fee reminders sent
    const feeRemindersSent = await db.feeReminder.count({
      where: { status: 'Sent' },
    });

    return NextResponse.json({
      announcements: {
        total: totalAnnouncements,
        publishedThisMonth,
        scheduled,
        byType: announcementsByType,
        byPriority: announcementsByPriority,
      },
      chat: {
        activeThreads: activeChatThreads,
        messagesThisMonth,
        messagesToday,
      },
      notifications: {
        feeRemindersSent,
      },
    });
  } catch (error) {
    console.error('Communication stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
