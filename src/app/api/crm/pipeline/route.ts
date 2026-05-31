import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

// GET /api/crm/pipeline — Pipeline statistics
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    // Get all leads grouped by stage
    const leads = await db.lead.findMany({
      select: {
        id: true,
        stage: true,
        priority: true,
        source: true,
        estimatedValue: true,
        createdAt: true,
        nextFollowUp: true,
      },
    });

    // Pipeline stages in order (matching LeadStage enum)
    const stages = ['NEW', 'CONTACTED', 'VISITED', 'APPLIED', 'ENROLLED', 'LOST'];

    const pipeline = stages.map(stage => {
      const stageLeads = leads.filter(l => l.stage === stage);
      return {
        stage,
        count: stageLeads.length,
        estimatedValue: stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
      };
    });

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {};
    for (const lead of leads) {
      sourceBreakdown[lead.source] = (sourceBreakdown[lead.source] || 0) + 1;
    }

    // Conversion metrics
    const totalLeads = leads.length;
    const enrolled = leads.filter(l => l.stage === 'ENROLLED').length;
    const lost = leads.filter(l => l.stage === 'LOST').length;
    const active = totalLeads - enrolled - lost;
    const conversionRate = totalLeads > 0 ? Math.round((enrolled / totalLeads) * 100) : 0;

    // Overdue follow-ups
    const now = new Date();
    const overdueFollowUps = leads.filter(
      l => l.nextFollowUp && new Date(l.nextFollowUp) < now && !['ENROLLED', 'LOST'].includes(l.stage)
    ).length;

    return NextResponse.json({
      pipeline,
      totalLeads,
      active,
      enrolled,
      lost,
      conversionRate,
      overdueFollowUps,
      sourceBreakdown,
    });
  } catch (error) {
    console.error('CRM pipeline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
