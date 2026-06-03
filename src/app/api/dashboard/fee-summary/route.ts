import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/dashboard/fee-summary — Fee breakdown by invoice status
// Returns collected, pending, and overdue amounts.
// Requires ADMIN role.
export async function GET(request: NextRequest) {
  try {
    // ── Verify ADMIN role ──
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    // ── Calculate fee breakdown from Invoice table ──
    const invoices = await db.invoice.findMany({
      select: { status: true, netAmount: true },
    });

    const collected = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.netAmount, 0);

    const pending = invoices
      .filter((i) => i.status === 'PENDING' || i.status === 'PARTIAL')
      .reduce((sum, i) => sum + i.netAmount, 0);

    const overdue = invoices
      .filter((i) => i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.netAmount, 0);

    return NextResponse.json({
      collected: Math.round(collected),
      pending: Math.round(pending),
      overdue: Math.round(overdue),
    });
  } catch (error) {
    console.error('Dashboard fee-summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
