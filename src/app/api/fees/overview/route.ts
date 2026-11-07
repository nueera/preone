import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/fees/overview — Fee collection summary
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    // Total invoiced
    const invoices = await db.invoice.findMany({
      select: {
        amount: true,
        netAmount: true,
        discount: true,
        status: true,
      },
    });

    const totalInvoiced = invoices.reduce((sum, i) => sum + i.netAmount, 0);
    const totalCollected = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.netAmount, 0);
    const totalPending = totalInvoiced - totalCollected;

    // Status breakdown — show collected amount for PAID, remaining for others
    const statusBreakdown: Record<string, { count: number; amount: number; collected: number }> = {};
    for (const inv of invoices) {
      if (!statusBreakdown[inv.status]) {
        statusBreakdown[inv.status] = { count: 0, amount: 0, collected: 0 };
      }
      statusBreakdown[inv.status].count += 1;
      statusBreakdown[inv.status].amount += inv.netAmount;
      statusBreakdown[inv.status].collected += inv.status === 'PAID' ? inv.netAmount : 0;
    }

    // Collection rate
    const collectionRate = totalInvoiced > 0
      ? Math.round((totalCollected / totalInvoiced) * 100)
      : 0;

    return NextResponse.json({
      totalInvoiced,
      totalCollected,
      totalPending,
      collectionRate,
      totalInvoices: invoices.length,
      statusBreakdown,
    });
  } catch (error) {
    console.error('Fee overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
