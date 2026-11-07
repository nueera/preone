import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/crm/followups — Global follow-ups list across all leads (Admin + TaskMaster)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || ''; // pending, completed, overdue
    const type = searchParams.get('type') || '';
    const leadId = searchParams.get('leadId') || '';

    const where: Record<string, unknown> = {};
    if (leadId) where.leadId = leadId;
    if (type) where.type = type;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (status === 'pending') {
      where.completedAt = null;
    } else if (status === 'completed') {
      where.completedAt = { not: null };
    } else if (status === 'overdue') {
      where.completedAt = null;
      where.dateTime = { lt: today };
    }

    const followUps = await db.followUp.findMany({
      where,
      orderBy: { dateTime: 'asc' },
      include: {
        lead: { select: { id: true, parentName: true, childName: true, phone: true, stage: true, nextFollowUp: true } },
      },
    });

    return NextResponse.json({ followUps });
  } catch (error) {
    console.error('List follow-ups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
