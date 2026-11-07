import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/crm/pipeline — Pipeline aggregation for kanban board (Admin + TaskMaster)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    // Get all leads grouped by stage
    const leads = await db.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        followUps: {
          orderBy: { dateTime: 'desc' },
          take: 1,
        },
      },
    });

    // Define the 6 stages with their colors
    const stages = [
      { key: 'NEW', label: 'New', color: '#9ca3af', cardBg: 'bg-white' },
      { key: 'CONTACTED', label: 'Contacted', color: '#3b82f6', cardBg: 'bg-blue-50' },
      { key: 'VISITED', label: 'Visited', color: '#8b5cf6', cardBg: 'bg-purple-50' },
      { key: 'APPLIED', label: 'Applied', color: '#f59e0b', cardBg: 'bg-yellow-50' },
      { key: 'ENROLLED', label: 'Enrolled', color: '#10b981', cardBg: 'bg-green-50' },
      { key: 'LOST', label: 'Lost', color: '#ef4444', cardBg: 'bg-red-50' },
    ];

    // Group leads by stage
    const pipeline = stages.map((stage) => {
      const stageLeads = leads.filter((l) => l.stage === stage.key);
      const totalValue = stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
      return {
        ...stage,
        count: stageLeads.length,
        totalValue,
        leads: stageLeads,
      };
    });

    return NextResponse.json({ pipeline });
  } catch (error) {
    console.error('Get pipeline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
