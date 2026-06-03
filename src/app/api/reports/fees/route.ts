import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/reports/fees — Fee report data
export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const where: Record<string, unknown> = {};
    if (status) {
      const statuses = status.split(',').filter(Boolean);
      where.status = { in: statuses };
    }
    if (from || to) {
      const createdAt: Record<string, unknown> = {};
      if (from) createdAt.gte = new Date(from);
      if (to) createdAt.lte = new Date(to);
      where.createdAt = createdAt;
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, class: { select: { name: true } } } },
        payments: true,
        feeStructure: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Summary
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.payments.reduce((s, p) => s + p.amount, 0), 0);
    const totalPending = totalInvoiced - totalCollected;
    const byStatus: Record<string, { count: number; amount: number }> = {};
    for (const inv of invoices) {
      if (!byStatus[inv.status]) byStatus[inv.status] = { count: 0, amount: 0 };
      byStatus[inv.status].count++;
      byStatus[inv.status].amount += inv.netAmount;
    }

    return NextResponse.json({
      summary: {
        totalInvoiced,
        totalCollected,
        totalPending,
        invoiceCount: invoices.length,
        byStatus,
      },
      records: invoices.map(inv => ({
        invoiceNo: inv.invoiceNo,
        studentName: `${inv.student.firstName} ${inv.student.lastName}`,
        className: inv.student.class?.name || '-',
        feeType: inv.feeStructure?.name || '-',
        amount: inv.amount,
        discount: inv.discount,
        netAmount: inv.netAmount,
        paidAmount: inv.payments.reduce((s, p) => s + p.amount, 0),
        balance: inv.netAmount - inv.payments.reduce((s, p) => s + p.amount, 0),
        status: inv.status,
        dueDate: inv.dueDate ? inv.dueDate.toISOString().split('T')[0] : '-',
        paidDate: inv.paidDate ? inv.paidDate.toISOString().split('T')[0] : '-',
      })),
      dateRange: { from: from || 'All', to: to || 'All' },
    });
  } catch (error) {
    console.error('Fee report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
