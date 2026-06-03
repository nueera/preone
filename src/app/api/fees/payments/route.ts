import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

// POST /api/fees/payments — Record payment against an invoice
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const {
      invoiceId, amount, method, transactionRef, bankName,
      chequeNo, notes, paymentDate,
    } = body;

    if (!invoiceId || !amount || !method) {
      return NextResponse.json(
        { error: 'invoiceId, amount, and method are required' },
        { status: 400 }
      );
    }

    // Get invoice with payments
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, student: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const payAmount = parseFloat(amount);

    // Create payment
    const payment = await db.payment.create({
      data: {
        invoiceId,
        studentId: invoice.studentId,
        amount: payAmount,
        method,
        transactionRef: transactionRef || null,
        chequeNo: chequeNo || null,
        bankName: bankName || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes: notes || null,
      },
    });

    // Create receipt
    const receiptNo = `REC-${new Date().toISOString().slice(0, 7).replace('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`;
    await db.receipt.create({
      data: {
        invoiceId,
        receiptNo,
        amount: payAmount,
      },
    });

    // Update invoice status
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + payAmount;
    let newStatus: string = invoice.status;
    if (totalPaid >= invoice.netAmount) {
      newStatus = 'PAID';
    } else if (totalPaid > 0) {
      newStatus = 'PARTIAL';
    }

    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        paidDate: newStatus === 'PAID' ? new Date() : invoice.paidDate,
      },
    });

    // ── Notify parent about payment ──
    try {
      if (user.schoolId) {
        const studentName = `${invoice.student.firstName} ${invoice.student.lastName}`;
        // Find parent via StudentParent
        const parentLink = await db.studentParent.findFirst({
          where: { studentId: invoice.studentId, isPrimary: true },
          select: { parentId: true },
        });
        if (parentLink?.parentId) {
          const parent = await db.parent.findUnique({
            where: { id: parentLink.parentId },
            select: { email: true },
          });
          if (parent?.email) {
            const parentUser = await db.user.findUnique({
              where: { email: parent.email },
              select: { id: true },
            });
            if (parentUser) {
              const template = NotificationTemplates.feePaymentReceived(studentName, payAmount);
              await createNotification({
                userId: parentUser.id,
                schoolId: user.schoolId,
                ...template,
                link: '/parent/fees',
                senderId: user.userId,
              });
            }
          }
        }
      }
    } catch (notifError) {
      console.error('Payment notification error:', notifError);
    }

    return NextResponse.json(
      {
        message: 'Payment recorded successfully',
        payment,
        receiptNo,
        invoiceStatus: newStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Record payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
