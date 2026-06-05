import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/reports/crm — CRM pipeline report data (Admin + TaskMaster only)
export async function GET(request: NextRequest) {
  try {
    const auth = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const where: Record<string, unknown> = {};
    if (from || to) {
      const createdAt: Record<string, unknown> = {};
      if (from) createdAt.gte = new Date(from);
      if (to) createdAt.lte = new Date(to);
      where.createdAt = createdAt;
    }

    const leads = await db.lead.findMany({
      where,
      include: {
        followUps: { orderBy: { dateTime: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Pipeline summary
    const byStage: Record<string, { count: number; value: number }> = {};
    for (const lead of leads) {
      const stage = lead.stage;
      if (!byStage[stage]) byStage[stage] = { count: 0, value: 0 };
      byStage[stage].count++;
      byStage[stage].value += lead.estimatedValue || 0;
    }

    const totalLeads = leads.length;
    const enrolled = leads.filter(l => l.stage === 'ENROLLED').length;
    const conversionRate = totalLeads > 0 ? (enrolled / totalLeads * 100).toFixed(1) : '0';
    const totalEstimatedRevenue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    const enrolledRevenue = leads.filter(l => l.stage === 'ENROLLED').reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

    // Source breakdown
    const bySource: Record<string, number> = {};
    for (const lead of leads) {
      const src = lead.source;
      bySource[src] = (bySource[src] || 0) + 1;
    }

    return NextResponse.json({
      summary: {
        totalLeads,
        enrolled,
        lost: leads.filter(l => l.stage === 'LOST').length,
        conversionRate,
        totalEstimatedRevenue,
        enrolledRevenue,
        byStage,
        bySource,
      },
      records: leads.map(l => ({
        parentName: l.parentName,
        childName: l.childName,
        phone: l.parentPhone,
        email: l.parentEmail || '-',
        source: l.source,
        stage: l.stage,
        priority: l.priority,
        estimatedValue: l.estimatedValue || 0,
        programInterest: l.programInterest || '-',
        assignedTo: l.assignedTo || '-',
        lastFollowUp: l.followUps[0]?.dateTime ? new Date(l.followUps[0].dateTime).toISOString().split('T')[0] : 'None',
        createdAt: l.createdAt.toISOString().split('T')[0],
      })),
      dateRange: { from: from || 'All', to: to || 'All' },
    });
  } catch (error) {
    console.error('CRM report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
