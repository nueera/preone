import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, branchFilter } from '@/lib/auth';

// GET /api/dashboard/revenue — monthly revenue data for charts
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const branchId = request.nextUrl.searchParams.get('branchId') || user.branchId;
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

    // Filter by branch if needed (with branch isolation)
    const filteredPayments = branchId
      ? payments.filter(p => p.invoice.branchId === branchId)
      : user.branchId
        ? payments.filter(p => p.invoice.branchId === user.branchId)
        : payments;

    // Get invoices for invoiced amounts
    const invoiceWhere: Record<string, unknown> = {
      issuedAt: { gte: yearStart, lte: yearEnd },
    };
    if (branchId) {
      invoiceWhere.branchId = branchId;
    } else {
      Object.assign(invoiceWhere, branchFilter(user));
    }

    const invoices = await db.invoice.findMany({
      where: invoiceWhere,
      select: {
        totalAmount: true,
        paidAmount: true,
        issuedAt: true,
        status: true,
      },
    });

    // Group by month
    const monthlyData: { month: string; revenue: number; collections: number; invoiced: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 12; i++) {
      const monthPayments = filteredPayments.filter(p => {
        const paidAt = new Date(p.paidAt);
        return paidAt.getMonth() === i && paidAt.getFullYear() === year;
      });

      const monthInvoices = invoices.filter(inv => {
        const issuedAt = new Date(inv.issuedAt);
        return issuedAt.getMonth() === i && issuedAt.getFullYear() === year;
      });

      const collections = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const invoiced = monthInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

      monthlyData.push({
        month: monthNames[i],
        revenue: invoiced,
        collections,
        invoiced,
      });
    }

    // Fee type breakdown
    const feeInvoiceWhere: Record<string, unknown> = {
      status: { in: ['Paid', 'Partial'] },
    };
    if (branchId) {
      feeInvoiceWhere.branchId = branchId;
    } else {
      Object.assign(feeInvoiceWhere, branchFilter(user));
    }

    const feeInvoices = await db.invoice.findMany({
      where: feeInvoiceWhere,
      include: {
        feeStructure: {
          select: { feeType: true, name: true },
        },
      },
    });

    const feeTypeBreakdown: Record<string, { type: string; amount: number; count: number }> = {};
    for (const inv of feeInvoices) {
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
