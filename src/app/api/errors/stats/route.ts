import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  return withAuth(async (req, user) => {
    if (!['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const schoolId = user.schoolId;

    // Status counts
    const [newCount, acknowledgedCount, investigatingCount, resolvedCount, ignoredCount] = await Promise.all([
      prisma.errorLog.count({ where: { status: 'NEW', schoolId } }),
      prisma.errorLog.count({ where: { status: 'ACKNOWLEDGED', schoolId } }),
      prisma.errorLog.count({ where: { status: 'INVESTIGATING', schoolId } }),
      prisma.errorLog.count({ where: { status: 'RESOLVED', schoolId } }),
      prisma.errorLog.count({ where: { status: 'IGNORED', schoolId } }),
    ]);

    // Severity counts
    const [lowCount, mediumCount, highCount, criticalCount] = await Promise.all([
      prisma.errorLog.count({ where: { severity: 'LOW', schoolId } }),
      prisma.errorLog.count({ where: { severity: 'MEDIUM', schoolId } }),
      prisma.errorLog.count({ where: { severity: 'HIGH', schoolId } }),
      prisma.errorLog.count({ where: { severity: 'CRITICAL', schoolId } }),
    ]);

    // By source
    const bySource = await prisma.errorLog.groupBy({
      by: ['source'],
      where: { schoolId },
      _count: { id: true },
    });

    // Top recurring errors
    const topErrors = await prisma.errorLog.findMany({
      where: { schoolId, status: { not: 'RESOLVED' } },
      orderBy: [{ occurrenceCount: 'desc' }],
      take: 5,
      select: { id: true, message: true, source: true, severity: true, occurrenceCount: true, lastSeenAt: true },
    });

    // Recent errors (last 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentErrors = await prisma.errorLog.findMany({
      where: { schoolId, lastSeenAt: { gte: last24h } },
      orderBy: [{ lastSeenAt: 'desc' }],
      take: 10,
      select: { id: true, message: true, source: true, severity: true, status: true, occurrenceCount: true, lastSeenAt: true },
    });

    // Trend: compare last 24h vs previous 24h
    const previous24h = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const [recent24hCount, previous24hCount] = await Promise.all([
      prisma.errorLog.count({ where: { schoolId, lastSeenAt: { gte: last24h } } }),
      prisma.errorLog.count({ where: { schoolId, lastSeenAt: { gte: previous24h, lt: last24h } } }),
    ]);

    const trend = recent24hCount > previous24hCount
      ? 'UP'
      : recent24hCount < previous24hCount
        ? 'DOWN'
        : 'STABLE';

    const trendPercent = previous24hCount > 0
      ? Math.round(((recent24hCount - previous24hCount) / previous24hCount) * 100)
      : 0;

    // Resolved today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = await prisma.errorLog.count({
      where: { resolvedAt: { gte: today }, schoolId },
    });

    // Average resolution time
    const resolvedErrors = await prisma.errorLog.findMany({
      where: { resolvedAt: { not: null }, firstSeenAt: { not: null }, schoolId },
      select: { firstSeenAt: true, resolvedAt: true },
      take: 100,
      orderBy: { resolvedAt: 'desc' },
    });

    const avgResolutionMs = resolvedErrors.length > 0
      ? resolvedErrors.reduce((sum, e) => {
          const diff = new Date(e.resolvedAt!).getTime() - new Date(e.firstSeenAt).getTime();
          return sum + diff;
        }, 0) / resolvedErrors.length
      : 0;

    return NextResponse.json({
      summary: {
        total: newCount + acknowledgedCount + investigatingCount + resolvedCount + ignoredCount,
        new: newCount,
        acknowledged: acknowledgedCount,
        investigating: investigatingCount,
        resolved: resolvedCount,
        ignored: ignoredCount,
        unresolved: newCount + acknowledgedCount + investigatingCount,
      },
      severity: { low: lowCount, medium: mediumCount, high: highCount, critical: criticalCount },
      bySource: bySource.map(s => ({ source: s.source, count: s._count.id })),
      topErrors,
      recentErrors,
      trend: { direction: trend, percent: Math.abs(trendPercent), recent24h: recent24hCount, previous24h: previous24hCount },
      resolvedToday,
      avgResolutionTime: formatDuration(avgResolutionMs),
    });
  })(req, {} as any);
}

function formatDuration(ms: number): string {
  if (ms === 0) return 'N/A';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
