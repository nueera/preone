import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/communication/stats — Communication stats
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || authUser.branchId || '';

    const announcementWhere: Record<string, unknown> = { isActive: true };
    if (branchId) announcementWhere.branchId = branchId;

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
    for (const a of allAnnouncements) {
      // We need priority, which we didn't select. Let me just use a separate query
    }

    const priorityStats = await db.announcement.groupBy({
      by: ['priority'],
      where: announcementWhere,
      _count: true,
    });

    const announcementsByPriorityFixed: Record<string, number> = {};
    for (const p of priorityStats) {
      announcementsByPriorityFixed[p.priority] = p._count;
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
        scheduledAt: { gt: now },
        publishedAt: null,
      },
    });

    // Chat threads activity
    const chatThreadWhere: Record<string, unknown> = {};
    if (branchId) chatThreadWhere.branchId = branchId;

    const activeChatThreads = await db.chatThread.count({
      where: { ...chatThreadWhere, isActive: true },
    });

    const messagesToday = await db.message.count({
      where: {
        createdAt: { gte: monthStart },
      },
    });

    // Messages this month
    const messagesThisMonth = await db.message.count({
      where: {
        createdAt: { gte: monthStart },
        isDeleted: false,
      },
    });

    // Fee reminders
    const feeReminders = await db.feeReminder.count({
      where: { status: 'Sent' },
    });

    return NextResponse.json({
      announcements: {
        total: totalAnnouncements,
        publishedThisMonth,
        scheduled,
        byType: announcementsByType,
        byPriority: announcementsByPriorityFixed,
      },
      chat: {
        activeThreads: activeChatThreads,
        messagesThisMonth,
        messagesToday,
      },
      notifications: {
        feeRemindersSent: feeReminders,
      },
    });
  } catch (error) {
    console.error('Communication stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
