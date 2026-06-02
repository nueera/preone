// ============================================================
// PreOne — GET /api/parent/fees
// Complete fee data for a parent's child
// Returns: overview stats, invoices with payments,
// payment history, upcoming dues, overdue items
// Query params: childId (required)
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

    // Determine target child
    let targetChildId = auth.childIds[0];
    if (childId) {
      const accessError = verifyChildAccess(auth, childId);
      if (accessError) return accessError;
      targetChildId = childId;
    }

    if (!targetChildId) {
      return NextResponse.json({
        childId: null,
        childName: '',
        className: null,
        overview: { totalDue: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0 },
        invoices: [],
        payments: [],
        upcomingDues: [],
        overdueDues: [],
      });
    }

    // Get child info
    const childInfo = auth.children.find((c) => c.id === targetChildId);

    // ── Fetch all invoices for the child ──
    const invoices = await db.invoice.findMany({
      where: { studentId: targetChildId },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        receipt: {
          select: { id: true, receiptNo: true, amount: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // ── Get fee structure details ──
    const feeStructureIds = invoices
      .map((i) => i.feeStructureId)
      .filter((id): id is string => !!id);

    const feeStructures = feeStructureIds.length > 0
      ? await db.feeStructure.findMany({
          where: { id: { in: feeStructureIds } },
          select: { id: true, name: true, type: true, frequency: true, amount: true },
        })
      : [];

    const feeStructureMap = new Map(feeStructures.map((fs) => [fs.id, fs]));

    // ── Calculate overview stats ──
    const totalDue = invoices.reduce((sum, i) => sum + i.netAmount, 0);
    const totalPaid = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.netAmount, 0);
    const totalOverdue = invoices
      .filter((i) => i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.netAmount, 0);
    const totalPending = totalDue - totalPaid - totalOverdue;

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
      paidDate: inv.paidDate?.toISOString().split('T')[0] || null,
      feeStructure: inv.feeStructureId ? feeStructureMap.get(inv.feeStructureId) || null : null,
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

    // ── Payment History (all payments for the child, newest first) ──
    const allPayments = await db.payment.findMany({
      where: { studentId: targetChildId },
      include: {
        invoice: {
          select: { invoiceNo: true, description: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const formattedPayments = allPayments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      transactionRef: p.transactionRef,
      paymentDate: p.paymentDate.toISOString().split('T')[0],
      invoiceNo: p.invoice.invoiceNo,
      description: p.invoice.description,
      receiptNo: null as string | null, // Will be populated from invoice receipt
    }));

    // Attach receipt numbers to payments
    const invoiceReceiptMap = new Map(
      invoices
        .filter((inv) => inv.receipt)
        .map((inv) => [inv.id, inv.receipt!.receiptNo])
    );
    for (const p of allPayments) {
      const receiptNo = invoiceReceiptMap.get(p.invoiceId) || null;
      const formattedPayment = formattedPayments.find((fp) => fp.id === p.id);
      if (formattedPayment) {
        formattedPayment.receiptNo = receiptNo;
      }
    }

    // ── Upcoming Dues (PENDING or PARTIAL invoices with future due date) ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingDues = invoices
      .filter((inv) => {
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return (inv.status === 'PENDING' || inv.status === 'PARTIAL') && dueDate >= today;
      })
      .map((inv) => ({
        invoiceNo: inv.invoiceNo,
        description: inv.description,
        amount: inv.netAmount,
        dueDate: inv.dueDate.toISOString().split('T')[0],
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // ── Overdue Dues (PENDING invoices past due date) ──
    const overdueDues = invoices
      .filter((inv) => {
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return (inv.status === 'OVERDUE' || (inv.status === 'PENDING' && dueDate < today));
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
      });

    return NextResponse.json({
      childId: targetChildId,
      childName: childInfo
        ? `${childInfo.firstName} ${childInfo.lastName}`
        : '',
      className: childInfo?.class?.name || null,
      overview: { totalDue, totalPaid, totalPending, totalOverdue },
      invoices: formattedInvoices,
      payments: formattedPayments,
      upcomingDues,
      overdueDues,
    });
  } catch (error) {
    console.error('Parent fees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
