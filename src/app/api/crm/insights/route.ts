import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, branchFilter } from '@/lib/auth';

// GET /api/crm/insights — AI CRM insights (mock for now)
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || user.branchId || '';

    // Build where clause with branch isolation
    const where = branchId ? { branchId } : branchFilter(user);

    // Get lead data for analysis
    const leads = await db.lead.findMany({
      where,
      include: {
        followUps: true,
      },
    });

    const totalLeads = leads.length;
    const enrolled = leads.filter(l => l.stage === 'Enrolled').length;
    const lost = leads.filter(l => l.stage === 'Lost').length;

    // Calculate average time to enroll (from lead creation to enrolled stage)
    const enrolledLeads = leads.filter(l => l.stage === 'Enrolled');
    const avgDaysToEnroll = enrolledLeads.length > 0
      ? enrolledLeads.reduce((sum, l) => {
          const created = new Date(l.createdAt);
          const updated = new Date(l.updatedAt);
          return sum + Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / enrolledLeads.length
      : 0;

    // Source conversion rates
    const sources = [...new Set(leads.map(l => l.source))];
    const sourceConversion = sources.map(source => {
      const sourceLeads = leads.filter(l => l.source === source);
      const sourceEnrolled = sourceLeads.filter(l => l.stage === 'Enrolled').length;
      return {
        source,
        total: sourceLeads.length,
        enrolled: sourceEnrolled,
        conversionRate: sourceLeads.length > 0
          ? Math.round((sourceEnrolled / sourceLeads.length) * 100)
          : 0,
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate);

    // Hot leads (high priority + recent interaction)
    const hotLeads = leads.filter(l =>
      ['High', 'Hot'].includes(l.priority) &&
      !['Enrolled', 'Lost'].includes(l.stage)
    ).map(l => ({
      id: l.id,
      parentName: l.parentName,
      childName: l.childName,
      stage: l.stage,
      priority: l.priority,
      nextFollowUpDate: l.nextFollowUpDate,
      interactionCount: l.interactionCount,
    }));

    // Lost reason analysis
    const lostLeads = leads.filter(l => l.stage === 'Lost');
    const lostReasonBreakdown: Record<string, number> = {};
    for (const l of lostLeads) {
      const reason = l.lostReason || 'Unknown';
      lostReasonBreakdown[reason] = (lostReasonBreakdown[reason] || 0) + 1;
    }

    // Generate mock AI insights
    const insights = [
      {
        type: 'trend',
        title: 'Website leads convert 2x better',
        description: `Leads from Website have a ${sourceConversion[0]?.conversionRate || 0}% conversion rate, significantly higher than other sources. Consider investing more in digital marketing.`,
        confidence: 0.85,
        action: 'Increase digital marketing budget',
      },
      {
        type: 'risk',
        title: `${hotLeads.length} hot leads need attention`,
        description: `There are ${hotLeads.length} high-priority leads in active stages that need follow-up. These represent potential revenue of ₹${hotLeads.reduce((sum, l) => {
          const lead = leads.find(ld => ld.id === l.id);
          return sum + (lead?.estimatedFee || 0);
        }, 0).toLocaleString()}.`,
        confidence: 0.92,
        action: 'Schedule immediate follow-ups',
      },
      {
        type: 'opportunity',
        title: 'Demo stage has highest conversion potential',
        description: 'Leads in the Demo stage are 3x more likely to enroll than those in early stages. Focus on moving leads to demo quickly.',
        confidence: 0.78,
        action: 'Accelerate demo scheduling',
      },
      {
        type: 'insight',
        title: `Average enrollment time: ${Math.round(avgDaysToEnroll)} days`,
        description: `On average, it takes ${Math.round(avgDaysToEnroll)} days from initial inquiry to enrollment. ${avgDaysToEnroll > 14 ? 'This is longer than ideal — consider streamlining the process.' : 'This is within the optimal range.'}`,
        confidence: 0.88,
        action: avgDaysToEnroll > 14 ? 'Streamline enrollment process' : 'Maintain current process',
      },
    ];

    return NextResponse.json({
      insights,
      metrics: {
        totalLeads,
        enrolled,
        lost,
        conversionRate: totalLeads > 0 ? Math.round((enrolled / totalLeads) * 100) : 0,
        avgDaysToEnroll: Math.round(avgDaysToEnroll),
        hotLeadsCount: hotLeads.length,
      },
      sourceConversion,
      hotLeads,
      lostReasonBreakdown,
    });
  } catch (error) {
    console.error('CRM insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
