// ============================================================
// PreOne — GET /api/parent/fees
// Fee details, invoices, payment history for parent's children
// Query params: childId (required)
// Returns: overview stats, invoices, payments, upcomingDues, overdueDues
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError, verifyChildAccess } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json(
        { error: 'childId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify this child belongs to this parent
    const accessError = verifyChildAccess(auth, childId);
    if (accessError) return accessError;

    // Get child info from auth children
    const childInfo = auth.children.find((c) => c.id === childId);
    const childName = childInfo
      ? `${childInfo.firstName} ${childInfo.lastName}`
      : '';
    const className = childInfo?.class?.name || null;

    // ── Fetch all invoices for this child with feeStructure, payments, and receipt ──
    const invoices = await db.invoice.findMany({
      where: { studentId: childId },
      include: {
        feeStructure: {
          select: {
            id: true,
            name: true,
            type: true,
            frequency: true,
            amount: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            transactionRef: true,
            paymentDate: true,
          },
          orderBy: { paymentDate: 'desc' },
        },
        receipt: {
          select: {
            id: true,
            receiptNo: true,
            amount: true,
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    // ── Calculate overview stats ──
    const totalDue = invoices
      .filter((inv) => inv.status === 'PENDING' || inv.status === 'PARTIAL' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.netAmount, 0);

    const totalPaid = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.netAmount, 0);

    const totalPending = invoices
      .filter((inv) => inv.status === 'PENDING' || inv.status === 'PARTIAL')
      .reduce((sum, inv) => sum + inv.netAmount, 0);

    const totalOverdue = invoices
      .filter((inv) => inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.netAmount, 0);

    // ── Format invoices ──
    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      description: inv.description,
      amount: inv.amount,
      discount: inv.discount,
      netAmount: inv.netAmount,
      status: inv.status,
      dueDate: inv.dueDate.toISOString().split('T')[0],
      paidDate: inv.paidDate ? inv.paidDate.toISOString().split('T')[0] : null,
      feeStructure: inv.feeStructure
        ? {
            id: inv.feeStructure.id,
            name: inv.feeStructure.name,
            type: inv.feeStructure.type,
            frequency: inv.feeStructure.frequency,
            amount: inv.feeStructure.amount,
          }
        : null,
      payments: inv.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        transactionRef: p.transactionRef,
        paymentDate: p.paymentDate.toISOString().split('T')[0],
      })),
      receipt: inv.receipt
        ? {
            id: inv.receipt.id,
            receiptNo: inv.receipt.receiptNo,
            amount: inv.receipt.amount,
          }
        : null,
    }));

    // ── Fetch all payments for this child (for payment history timeline) ──
    const allPayments = await db.payment.findMany({
      where: { studentId: childId },
      include: {
        invoice: {
          select: {
            invoiceNo: true,
            description: true,
            receipt: {
              select: { receiptNo: true },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const paymentHistory = allPayments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      transactionRef: p.transactionRef,
      paymentDate: p.paymentDate.toISOString().split('T')[0],
      invoiceNo: p.invoice.invoiceNo,
      description: p.invoice.description,
      receiptNo: p.invoice.receipt?.receiptNo || null,
    }));

    // ── Upcoming dues (PENDING/PARTIAL with future due date) ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingDues = invoices
      .filter((inv) =>
        (inv.status === 'PENDING' || inv.status === 'PARTIAL') &&
        new Date(inv.dueDate) >= today
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .map((inv) => ({
        invoiceNo: inv.invoiceNo,
        description: inv.description,
        amount: inv.netAmount,
        dueDate: inv.dueDate.toISOString().split('T')[0],
      }));

    // ── Overdue dues (PENDING/PARTIAL/OVERDUE with past due date) ──
    const overdueDues = invoices
      .filter((inv) => {
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return (
          (inv.status === 'PENDING' || inv.status === 'PARTIAL' || inv.status === 'OVERDUE') &&
          dueDate < today
        );
      })
      .map((inv) => {
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffMs = today.getTime() - dueDate.getTime();
        const daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        return {
          invoiceNo: inv.invoiceNo,
          description: inv.description,
          amount: inv.netAmount,
          dueDate: inv.dueDate.toISOString().split('T')[0],
          daysOverdue,
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    return NextResponse.json({
      childId,
      childName,
      className,
      overview: {
        totalDue,
        totalPaid,
        totalPending,
        totalOverdue,
      },
      invoices: formattedInvoices,
      payments: paymentHistory,
      upcomingDues,
      overdueDues,
    });
  } catch (error) {
    console.error('Parent fees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
