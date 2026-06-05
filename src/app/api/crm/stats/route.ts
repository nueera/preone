import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/crm/stats — CRM dashboard statistics (Admin + TaskMaster)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    // Total leads
    const totalLeads = await db.lead.count();

    // Leads by stage
    const leadsByStage = await db.lead.groupBy({
      by: ['stage'],
      _count: { id: true },
    });

    // New leads this week
    const newThisWeek = await db.lead.count({
      where: { createdAt: { gte: weekStart } },
    });

    // Follow-ups scheduled today (from leads with nextFollowUp)
    const followUpsToday = await db.lead.count({
      where: {
        nextFollowUp: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      },
    });

    // Overdue follow-ups (nextFollowUp before today and not enrolled/lost)
    const overdueFollowUps = await db.lead.count({
      where: {
        nextFollowUp: { lt: today },
        stage: { notIn: ['ENROLLED', 'LOST'] },
      },
    });

    // Conversion rate (enrolled / total)
    const admitted = await db.lead.count({ where: { stage: 'ENROLLED' } });
    const conversionRate = totalLeads > 0 ? ((admitted / totalLeads) * 100).toFixed(1) : '0';

    // Revenue estimate (sum of estimatedValue for ENROLLED leads)
    const enrolledLeads = await db.lead.findMany({
      where: { stage: 'ENROLLED' },
      select: { estimatedValue: true },
    });
    const estimatedRevenue = enrolledLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

    // Leads by source
    const leadsBySource = await db.lead.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    // Priority distribution
    const leadsByPriority = await db.lead.groupBy({
      by: ['priority'],
      _count: { id: true },
    });

    // Recent leads (last 5)
    const recentLeads = await db.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        followUps: { orderBy: { dateTime: 'desc' }, take: 1 },
      },
    });

    // CRM Task stats
    const totalTasks = await db.crmTask.count();
    const todoTasks = await db.crmTask.count({ where: { status: 'TODO' } });
    const inProgressTasks = await db.crmTask.count({ where: { status: 'IN_PROGRESS' } });
    const doneTasks = await db.crmTask.count({ where: { status: 'DONE' } });
    const overdueTasks = await db.crmTask.count({
      where: {
        dueDate: { lt: today },
        status: { not: 'DONE' },
      },
    });

    return NextResponse.json({
      totalLeads,
      leadsByStage: leadsByStage.map((s) => ({ stage: s.stage, count: s._count.id })),
      newThisWeek,
      followUpsToday,
      overdueFollowUps,
      conversionRate: parseFloat(conversionRate),
      estimatedRevenue,
      leadsBySource: leadsBySource.map((s) => ({ source: s.source, count: s._count.id })),
      leadsByPriority: leadsByPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
      recentLeads,
      tasks: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        done: doneTasks,
        overdue: overdueTasks,
      },
    });
  } catch (error) {
    console.error('CRM stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch CRM stats' }, { status: 500 });
  }
}
