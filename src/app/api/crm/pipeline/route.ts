import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/crm/pipeline — Pipeline statistics
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || authUser.branchId || '';

    const where = branchId ? { branchId } : {};

    // Get all leads grouped by stage
    const leads = await db.lead.findMany({
      where,
      select: {
        id: true,
        stage: true,
        priority: true,
        source: true,
        estimatedFee: true,
        createdAt: true,
        nextFollowUpDate: true,
        interactionCount: true,
      },
    });

    // Pipeline stages in order
    const stages = ['NewInquiry', 'Visit', 'Tour', 'Demo', 'FollowUp', 'Confirmed', 'Enrolled', 'Lost'];

    const pipeline = stages.map(stage => {
      const stageLeads = leads.filter(l => l.stage === stage);
      return {
        stage,
        count: stageLeads.length,
        estimatedValue: stageLeads.reduce((sum, l) => sum + (l.estimatedFee || 0), 0),
        leads: stageLeads.map(l => ({
          id: l.id,
          priority: l.priority,
          source: l.source,
          estimatedFee: l.estimatedFee,
          nextFollowUpDate: l.nextFollowUpDate,
          interactionCount: l.interactionCount,
        })),
      };
    });

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {};
    for (const lead of leads) {
      sourceBreakdown[lead.source] = (sourceBreakdown[lead.source] || 0) + 1;
    }

    // Priority breakdown
    const priorityBreakdown: Record<string, number> = {};
    for (const lead of leads) {
      priorityBreakdown[lead.priority] = (priorityBreakdown[lead.priority] || 0) + 1;
    }

    // Conversion metrics
    const totalLeads = leads.length;
    const enrolled = leads.filter(l => l.stage === 'Enrolled').length;
    const lost = leads.filter(l => l.stage === 'Lost').length;
    const active = totalLeads - enrolled - lost;
    const conversionRate = totalLeads > 0 ? Math.round((enrolled / totalLeads) * 100) : 0;

    // Overdue follow-ups
    const now = new Date();
    const overdueFollowUps = leads.filter(
      l => l.nextFollowUpDate && new Date(l.nextFollowUpDate) < now && !['Enrolled', 'Lost'].includes(l.stage)
    ).length;

    // This month's leads
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthLeads = leads.filter(l => new Date(l.createdAt) >= monthStart).length;

    return NextResponse.json({
      pipeline,
      totalLeads,
      active,
      enrolled,
      lost,
      conversionRate,
      overdueFollowUps,
      thisMonthLeads,
      sourceBreakdown,
      priorityBreakdown,
    });
  } catch (error) {
    console.error('CRM pipeline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
