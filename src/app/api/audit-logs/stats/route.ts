import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/audit-logs/stats — Get audit log statistics for dashboard (Admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Total today
    const totalToday = await db.auditLog.count({
      where: { createdAt: { gte: todayStart } },
    });

    // Total this week
    const totalThisWeek = await db.auditLog.count({
      where: { createdAt: { gte: weekStart } },
    });

    // By action — raw SQL for SQLite group by
    const byActionRaw = await db.auditLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    });
    const byAction: Record<string, number> = {};
    for (const row of byActionRaw) {
      byAction[row.action] = row._count.action;
    }

    // By entity
    const byEntityRaw = await db.auditLog.groupBy({
      by: ['entity'],
      _count: { entity: true },
      orderBy: { _count: { entity: 'desc' } },
    });
    const byEntity: Record<string, number> = {};
    for (const row of byEntityRaw) {
      byEntity[row.entity] = row._count.entity;
    }

    // Recent activity — last 10 entries
    const recentActivity = await db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Top actor — user with most audit log entries today
    const topActorsRaw = await db.auditLog.groupBy({
      by: ['userId'],
      _count: { userId: true },
      where: { createdAt: { gte: todayStart }, userId: { not: null } },
      orderBy: { _count: { userId: 'desc' } },
      take: 1,
    });

    let topActor: { name: string; email: string; count: number } | null = null;
    if (topActorsRaw.length > 0 && topActorsRaw[0].userId) {
      const user = await db.user.findUnique({
        where: { id: topActorsRaw[0].userId },
        select: { name: true, email: true },
      });
      if (user) {
        topActor = {
          name: user.name,
          email: user.email,
          count: topActorsRaw[0]._count.userId,
        };
      }
    }

    return NextResponse.json({
      totalToday,
      totalThisWeek,
      byAction,
      byEntity,
      recentActivity,
      topActor,
    });
  } catch (error) {
    console.error('Audit stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
