import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { randomBytes } from 'crypto';

// POST /api/fees/payments — Record payment
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      invoiceId, amount, paymentMethod, transactionRef, bankName,
      chequeNo, chequeDate, paidBy, paidByName, notes,
    } = body;

    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'invoiceId, amount, and paymentMethod are required' },
        { status: 400 }
      );
    }

    // Get invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        invoiceId,
        amount,
        paymentMethod,
        transactionRef,
        bankName,
        chequeNo,
        chequeDate: chequeDate ? new Date(chequeDate) : undefined,
        status: 'Success',
        paidBy,
        paidByName,
        receivedBy: authUser.userId,
        notes,
      },
    });

    // Create receipt
    const receiptNo = `RCT-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
    await db.receipt.create({
      data: {
        paymentId: payment.id,
        receiptNo,
        amount,
        issuedBy: authUser.userId,
      },
    });

    // Update invoice paid amount and status
    const newPaidAmount = invoice.paidAmount + amount;
    let newStatus = invoice.status;
    if (newPaidAmount >= invoice.totalAmount) {
      newStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'Partial';
    }

    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

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
