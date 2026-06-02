// ============================================================
// PreOne — GET /api/parent/fees/receipt/[receiptId]
// Returns receipt details for download/view
// Verifies the receipt belongs to a child of the parent
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const { receiptId } = await params;

    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    // Fetch receipt with invoice and student info
    const receipt = await db.receipt.findUnique({
      where: { id: receiptId },
      include: {
        invoice: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                rollNumber: true,
                class: {
                  select: { name: true },
                },
              },
            },
            payments: {
              orderBy: { paymentDate: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Verify this receipt belongs to one of the parent's children
    const studentId = receipt.invoice.studentId;
    if (!auth.childIds.includes(studentId)) {
      return NextResponse.json(
        { error: 'Access denied. This receipt does not belong to your child.' },
        { status: 403 }
      );
    }

    // Get school/branch info for the receipt header
    const student = receipt.invoice.student;
    const latestPayment = receipt.invoice.payments[0];

    return NextResponse.json({
      receipt: {
        id: receipt.id,
        receiptNo: receipt.receiptNo,
        amount: receipt.amount,
        pdfUrl: receipt.pdfUrl,
        createdAt: receipt.createdAt.toISOString().split('T')[0],
        invoice: {
          invoiceNo: receipt.invoice.invoiceNo,
          description: receipt.invoice.description,
          amount: receipt.invoice.amount,
          discount: receipt.invoice.discount,
          netAmount: receipt.invoice.netAmount,
          dueDate: receipt.invoice.dueDate.toISOString().split('T')[0],
        },
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          className: student.class?.name || null,
        },
        payment: latestPayment
          ? {
              method: latestPayment.method,
              transactionRef: latestPayment.transactionRef,
              paymentDate: latestPayment.paymentDate.toISOString().split('T')[0],
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Parent receipt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
