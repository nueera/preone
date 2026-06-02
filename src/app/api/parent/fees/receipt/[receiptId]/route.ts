// ============================================================
// PreOne — GET /api/parent/fees/receipt/[receiptId]
// Receipt details for download/view
// Returns: full receipt with invoice, payment, student, and branch info
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const { receiptId } = await params;

    // ── Fetch receipt with all related data ──
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
                  select: {
                    name: true,
                    program: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
            feeStructure: {
              select: {
                name: true,
                type: true,
                frequency: true,
              },
            },
            payments: {
              select: {
                id: true,
                amount: true,
                method: true,
                transactionRef: true,
                chequeNo: true,
                bankName: true,
                paymentDate: true,
                notes: true,
              },
              orderBy: { paymentDate: 'desc' },
            },
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // ── Verify this receipt belongs to a child of this parent ──
    const studentId = receipt.invoice.studentId;
    if (!auth.childIds.includes(studentId)) {
      return NextResponse.json(
        { error: 'Access denied. This receipt does not belong to your child.' },
        { status: 403 }
      );
    }

    // ── Fetch branch info with school logo for the receipt header ──
    const branch = await db.branch.findFirst({
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        school: {
          select: {
            name: true,
            logo: true,
          },
        },
      },
    });

    // ── Format receipt response ──
    const formattedReceipt = {
      id: receipt.id,
      receiptNo: receipt.receiptNo,
      amount: receipt.amount,
      createdAt: receipt.createdAt.toISOString().split('T')[0],
      invoice: {
        id: receipt.invoice.id,
        invoiceNo: receipt.invoice.invoiceNo,
        description: receipt.invoice.description,
        amount: receipt.invoice.amount,
        discount: receipt.invoice.discount,
        netAmount: receipt.invoice.netAmount,
        status: receipt.invoice.status,
        dueDate: receipt.invoice.dueDate.toISOString().split('T')[0],
        paidDate: receipt.invoice.paidDate
          ? receipt.invoice.paidDate.toISOString().split('T')[0]
          : null,
        feeStructure: receipt.invoice.feeStructure
          ? {
              name: receipt.invoice.feeStructure.name,
              type: receipt.invoice.feeStructure.type,
              frequency: receipt.invoice.feeStructure.frequency,
            }
          : null,
        student: {
          id: receipt.invoice.student.id,
          firstName: receipt.invoice.student.firstName,
          lastName: receipt.invoice.student.lastName,
          rollNumber: receipt.invoice.student.rollNumber,
          className: receipt.invoice.student.class?.name || null,
          programName: receipt.invoice.student.class?.program?.name || null,
        },
        payments: receipt.invoice.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          transactionRef: p.transactionRef,
          chequeNo: p.chequeNo,
          bankName: p.bankName,
          paymentDate: p.paymentDate.toISOString().split('T')[0],
          notes: p.notes,
        })),
      },
      branch: branch
        ? {
            name: branch.name,
            address: branch.address,
            phone: branch.phone,
            schoolName: branch.school?.name || null,
            logo: branch.school?.logo || null,
          }
        : null,
    };

    return NextResponse.json({ receipt: formattedReceipt });
  } catch (error) {
    console.error('Parent receipt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
