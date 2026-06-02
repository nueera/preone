import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// POST /api/fees/refunds — Process refund
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { invoiceId, amount, reason, method, bankAccount, bankIfsc, notes } = body;

    if (!invoiceId || !amount || !reason || !method) {
      return NextResponse.json(
        { error: 'invoiceId, amount, reason, and method are required' },
        { status: 400 }
      );
    }

    const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const refundAmount = parseFloat(amount);
    if (refundAmount > invoice.netAmount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed invoice net amount' },
        { status: 400 }
      );
    }

    const refund = await db.refund.create({
      data: {
        invoiceId,
        amount: refundAmount,
        reason,
        method,
        bankAccount: bankAccount || null,
        bankIfsc: bankIfsc || null,
        notes: notes || null,
        status: 'PENDING',
      },
    });

    // Update invoice status to CANCELLED
    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json(
      { message: 'Refund processed successfully', refund },
      { status: 201 }
    );
  } catch (error) {
    console.error('Process refund error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
