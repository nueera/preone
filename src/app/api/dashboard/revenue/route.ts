import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const branchId = request.nextUrl.searchParams.get('branchId') || authUser.branchId;
    const year = parseInt(request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString());

    // Get all successful payments for the year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const payments = await db.payment.findMany({
      where: {
        status: 'Success',
        paidAt: { gte: yearStart, lte: yearEnd },
      },
      include: {
        invoice: {
          select: { branchId: true },
        },
      },
    });

    // Filter by branch if needed
    const filteredPayments = branchId
      ? payments.filter(p => p.invoice.branchId === branchId)
      : payments;

    // Group by month
    const monthlyData: { month: string; revenue: number; collections: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 12; i++) {
      const monthPayments = filteredPayments.filter(p => {
        const paidAt = new Date(p.paidAt);
        return paidAt.getMonth() === i && paidAt.getFullYear() === year;
      });

      monthlyData.push({
        month: monthNames[i],
        revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
        collections: monthPayments.length,
      });
    }

    // Fee type breakdown
    const invoices = await db.invoice.findMany({
      where: {
        status: { in: ['Paid', 'Partial'] },
        ...(branchId ? { branchId } : {}),
      },
      include: {
        feeStructure: {
          select: { feeType: true, name: true },
        },
      },
    });

    const feeTypeBreakdown: Record<string, { type: string; amount: number; count: number }> = {};
    for (const inv of invoices) {
      const type = inv.feeStructure?.feeType || 'Other';
      if (!feeTypeBreakdown[type]) {
        feeTypeBreakdown[type] = { type, amount: 0, count: 0 };
      }
      feeTypeBreakdown[type].amount += inv.paidAmount;
      feeTypeBreakdown[type].count += 1;
    }

    return NextResponse.json({
      year,
      monthly: monthlyData,
      totalRevenue: monthlyData.reduce((sum, m) => sum + m.revenue, 0),
      totalCollections: monthlyData.reduce((sum, m) => sum + m.collections, 0),
      feeTypeBreakdown: Object.values(feeTypeBreakdown),
    });
  } catch (error) {
    console.error('Dashboard revenue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
