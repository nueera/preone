import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/fees/overview — Fee collection summary
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || authUser.branchId || '';
    const academicYear = searchParams.get('academicYear') || '';

    // Build invoice filter
    const invoiceWhere: Record<string, unknown> = {};
    if (branchId) invoiceWhere.branchId = branchId;
    if (academicYear) invoiceWhere.academicYear = academicYear;

    // Total invoiced
    const invoices = await db.invoice.findMany({
      where: invoiceWhere,
      select: {
        amount: true,
        paidAmount: true,
        totalAmount: true,
        discount: true,
        lateFee: true,
        status: true,
      },
    });

    const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalCollected = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalDiscount = invoices.reduce((sum, i) => sum + i.discount, 0);
    const totalLateFee = invoices.reduce((sum, i) => sum + i.lateFee, 0);
    const totalPending = totalInvoiced - totalCollected;

    // Status breakdown
    const statusBreakdown: Record<string, { count: number; amount: number }> = {};
    for (const inv of invoices) {
      if (!statusBreakdown[inv.status]) {
        statusBreakdown[inv.status] = { count: 0, amount: 0 };
      }
      statusBreakdown[inv.status].count += 1;
      statusBreakdown[inv.status].amount += inv.totalAmount - inv.paidAmount;
    }

    // Overdue invoices
    const overdueInvoices = await db.invoice.count({
      where: {
        ...invoiceWhere,
        status: 'Overdue',
        dueDate: { lt: new Date() },
      },
    });

    // Payment method breakdown
    const payments = await db.payment.findMany({
      where: { status: 'Success' },
      select: { amount: true, paymentMethod: true },
    });

    const paymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};
    for (const p of payments) {
      if (!paymentMethodBreakdown[p.paymentMethod]) {
        paymentMethodBreakdown[p.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentMethodBreakdown[p.paymentMethod].count += 1;
      paymentMethodBreakdown[p.paymentMethod].amount += p.amount;
    }

    // Collection rate
    const collectionRate = totalInvoiced > 0
      ? Math.round((totalCollected / totalInvoiced) * 100)
      : 0;

    return NextResponse.json({
      totalInvoiced,
      totalCollected,
      totalPending,
      totalDiscount,
      totalLateFee,
      collectionRate,
      totalInvoices: invoices.length,
      overdueInvoices,
      statusBreakdown,
      paymentMethodBreakdown: Object.values(paymentMethodBreakdown).map((v, i) => ({
        method: Object.keys(paymentMethodBreakdown)[i],
        ...v,
      })),
    });
  } catch (error) {
    console.error('Fee overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
