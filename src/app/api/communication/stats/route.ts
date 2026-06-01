import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/communication/stats — Communication stats
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    // Announcements count
    const totalAnnouncements = await db.announcement.count();

    // Announcements by type
    const announcementsByType: Record<string, number> = {};
    const allAnnouncements = await db.announcement.findMany({
      select: { type: true },
    });
    for (const a of allAnnouncements) {
      announcementsByType[a.type] = (announcementsByType[a.type] || 0) + 1;
    }

    // Announcements by priority
    const announcementsByPriority: Record<string, number> = {};
    const allByPriority = await db.announcement.findMany({
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
        publishedAt: { gte: monthStart },
      },
    });

    // Scheduled announcements (scheduled for future, not yet published)
    const scheduled = await db.announcement.count({
      where: {
        scheduledAt: { gt: now },
        publishedAt: null,
      },
    });

    // Chat threads count
    const activeChatThreads = await db.chatThread.count();

    // Messages this month
    const messagesThisMonth = await db.message.count({
      where: {
        createdAt: { gte: monthStart },
      },
    });

    // Messages today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messagesToday = await db.message.count({
      where: {
        createdAt: { gte: todayStart },
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
