import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

// GET /api/dashboard/revenue — monthly revenue data for charts
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const year = parseInt(request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString());

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const payments = await db.payment.findMany({
      where: {
        paymentDate: { gte: yearStart, lte: yearEnd },
      },
    });

    const invoices = await db.invoice.findMany({
      where: {
        createdAt: { gte: yearStart, lte: yearEnd },
      },
      select: {
        netAmount: true,
        createdAt: true,
        status: true,
      },
    });

    // Group by month
    const monthlyData: { month: string; revenue: number; collections: number; invoiced: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 12; i++) {
      const monthPayments = payments.filter(p => {
        const pd = new Date(p.paymentDate);
        return pd.getMonth() === i && pd.getFullYear() === year;
      });

      const monthInvoices = invoices.filter(inv => {
        const cd = new Date(inv.createdAt);
        return cd.getMonth() === i && cd.getFullYear() === year;
      });

      const collections = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const invoiced = monthInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);

      monthlyData.push({
        month: monthNames[i],
        revenue: invoiced,
        collections,
        invoiced,
      });
    }

    return NextResponse.json({
      year,
      monthly: monthlyData,
      totalRevenue: monthlyData.reduce((sum, m) => sum + m.revenue, 0),
      totalCollections: monthlyData.reduce((sum, m) => sum + m.collections, 0),
    });
  } catch (error) {
    console.error('Dashboard revenue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
