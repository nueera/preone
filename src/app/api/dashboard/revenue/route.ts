import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/dashboard/revenue — Monthly revenue data for charts
// Query params: ?period=year&year=2026
// Requires ADMIN role.
export async function GET(request: NextRequest) {
  try {
    // ── Verify ADMIN role ──
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const year = parseInt(
      request.nextUrl.searchParams.get('year') ||
        new Date().getFullYear().toString(),
    );

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    // ── Fetch payments for the year ──
    const payments = await db.payment.findMany({
      where: {
        paymentDate: { gte: yearStart, lte: yearEnd },
      },
      select: { amount: true, paymentDate: true },
    });

    // ── Fetch invoices for the year ──
    const invoices = await db.invoice.findMany({
      where: {
        createdAt: { gte: yearStart, lte: yearEnd },
      },
      select: {
        netAmount: true,
        createdAt: true,
      },
    });

    // ── Group by month ──
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const data = monthNames.map((month, i) => {
      // Revenue = invoiced amount for the month
      const monthInvoices = invoices.filter((inv) => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === i && d.getFullYear() === year;
      });
      const revenue = monthInvoices.reduce(
        (sum, inv) => sum + inv.netAmount,
        0,
      );

      // Collections = actual payments received for the month
      const monthPayments = payments.filter((p) => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === i && d.getFullYear() === year;
      });
      const collections = monthPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );

      return { month, revenue, collections };
    });

    return NextResponse.json({ data, year });
  } catch (error) {
    console.error('Dashboard revenue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
