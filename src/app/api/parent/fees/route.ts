// ============================================================
// PreOne — GET /api/parent/fees
// Fee information for parent's children
// Query params: childId
// Uses requireParent for consistent auth
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
    let targetChildIds = auth.childIds;
    if (childId) {
      const accessError = verifyChildAccess(auth, childId);
      if (accessError) return accessError;
      targetChildIds = [childId];
    }

    if (targetChildIds.length === 0) {
      return NextResponse.json({ invoices: [], totalPending: 0, totalOverdue: 0, totalPaid: 0 });
    }

    // Get all invoices for the children
    const invoices = await db.invoice.findMany({
      where: { studentId: { in: targetChildIds } },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        receipt: {
          select: { id: true, receiptNo: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Get fee structure details separately (no direct relation on Invoice)
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

    const totalPending = invoices
      .filter((i) => i.status === 'PENDING' || i.status === 'PARTIAL')
      .reduce((sum, i) => sum + i.netAmount, 0);

    const totalOverdue = invoices
      .filter((i) => i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.netAmount, 0);

    const totalPaid = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.netAmount, 0);

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        amount: inv.amount,
        discount: inv.discount,
        netAmount: inv.netAmount,
        status: inv.status,
        dueDate: inv.dueDate.toISOString().split('T')[0],
        paidDate: inv.paidDate?.toISOString().split('T')[0] || null,
        description: inv.description,
        feeStructureId: inv.feeStructureId,
        feeStructure: inv.feeStructureId ? feeStructureMap.get(inv.feeStructureId) || null : null,
        payments: inv.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          transactionRef: p.transactionRef,
          paymentDate: p.paymentDate.toISOString().split('T')[0],
        })),
        receipt: inv.receipt,
      })),
      totalPending,
      totalOverdue,
      totalPaid,
    });
  } catch (error) {
    console.error('Parent fees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
