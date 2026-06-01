import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/crm/insights — CRM analytics data
export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUser(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const leads = await db.lead.findMany({
      include: {
        followUps: true,
      },
    });

    const totalLeads = leads.length;
    const enrolledLeads = leads.filter((l) => l.stage === 'ENROLLED');
    const lostLeads = leads.filter((l) => l.stage === 'LOST');
    const conversionRate = totalLeads > 0 ? Math.round((enrolledLeads.length / totalLeads) * 100) : 0;

    // Average days to convert (from creation to stage=ENROLLED)
    let avgDaysToConvert = 0;
    if (enrolledLeads.length > 0) {
      // Estimate: use the last follow-up date with ENROLLED outcome as conversion date
      // Fall back to updatedAt
      const daysList = enrolledLeads.map((l) => {
        const convertDate = l.updatedAt;
        const createdDate = l.createdAt;
        return (convertDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      });
      avgDaysToConvert = Math.round(daysList.reduce((a, b) => a + b, 0) / daysList.length);
    }

    // Source ROI — conversion percentage per source
    const sourceMap = new Map<string, { total: number; enrolled: number }>();
    const sources = ['INSTAGRAM', 'FACEBOOK', 'GOOGLE', 'WALK_IN', 'REFERRAL', 'WEBSITE', 'JUSTDIAL', 'SULEKHA', 'NEWSPAPER', 'HOARDING', 'EVENT', 'OTHER'];
    for (const source of sources) {
      sourceMap.set(source, { total: 0, enrolled: 0 });
    }
    for (const lead of leads) {
      const entry = sourceMap.get(lead.source) || { total: 0, enrolled: 0 };
      entry.total++;
      if (lead.stage === 'ENROLLED') entry.enrolled++;
      sourceMap.set(lead.source, entry);
    }
    const sourceROI = sources
      .map((source) => {
        const data = sourceMap.get(source)!;
        return {
          source,
          total: data.total,
          enrolled: data.enrolled,
          conversionRate: data.total > 0 ? Math.round((data.enrolled / data.total) * 100) : 0,
        };
      })
      .filter((s) => s.total > 0);

    // Lost Reasons — count by reason
    const lostReasons: Record<string, number> = {};
    for (const lead of lostLeads) {
      const reason = lead.lostReason || 'Not specified';
      lostReasons[reason] = (lostReasons[reason] || 0) + 1;
    }
    const lostReasonsList = Object.entries(lostReasons).map(([reason, count]) => ({
      reason,
      count,
    }));

    // Monthly Trend — leads vs conversions per month (last 12 months)
    const monthlyTrend: { month: string; leads: number; conversions: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const monthLeads = leads.filter((l) => {
        const d = new Date(l.createdAt);
        return d >= monthDate && d <= monthEnd;
      });

      const monthConversions = enrolledLeads.filter((l) => {
        const d = new Date(l.updatedAt);
        return d >= monthDate && d <= monthEnd;
      });

      monthlyTrend.push({
        month: monthLabel,
        leads: monthLeads.length,
        conversions: monthConversions.length,
      });
    }

    // Revenue Forecast — sum of estimated values by stage
    const revenueForecast = [
      { stage: 'New', value: 0, color: '#9ca3af' },
      { stage: 'Contacted', value: 0, color: '#3b82f6' },
      { stage: 'Visited', value: 0, color: '#8b5cf6' },
      { stage: 'Applied', value: 0, color: '#f59e0b' },
      { stage: 'Enrolled', value: 0, color: '#10b981' },
      { stage: 'Lost', value: 0, color: '#ef4444' },
    ];
    for (const lead of leads) {
      const stageIndex = ['NEW', 'CONTACTED', 'VISITED', 'APPLIED', 'ENROLLED', 'LOST'].indexOf(lead.stage);
      if (stageIndex >= 0) {
        revenueForecast[stageIndex].value += lead.estimatedValue || 0;
      }
    }

    return NextResponse.json({
      totalLeads,
      conversionRate,
      avgDaysToConvert,
      sourceROI,
      lostReasons: lostReasonsList,
      monthlyTrend,
      revenueForecast,
      enrolledCount: enrolledLeads.length,
      lostCount: lostLeads.length,
    });
  } catch (error) {
    console.error('Get insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
