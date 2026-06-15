import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, getAuthUser, unauthorized } from '@/lib/auth';
import { getBranchFromRequest, withBranchFilter } from '@/lib/branch';
import { randomBytes } from 'crypto';
import { createNotification, NotificationTemplates } from '@/lib/notifications';
import { auditLog } from '@/lib/audit';

// GET /api/fees/payments — List recorded payments
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    // Branch isolation via the student relation (Payment has no branchId)
    const branchScope = getBranchFromRequest(request, user);
    const branchFilter = withBranchFilter(branchScope);
    const branchWhere =
      Object.keys(branchFilter).length > 0
        ? { student: branchFilter }
        : branchScope.isAllBranches && branchScope.schoolId
          ? { student: { branch: { schoolId: branchScope.schoolId } } }
          : {};

    const sp = request.nextUrl.searchParams;
    const page = parseInt(sp.get('page') || '1');
    const limit = parseInt(sp.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { ...branchWhere };

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          invoice: { select: { invoiceNo: true } },
        },
      }),
      db.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // ── Audit log ──
    try {
      await auditLog.create({
        action: 'CREATE',
        entity: 'Payment',
        entityId: payment.id,
        userId: user.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        details: { invoiceId, amount: payAmount, method, invoiceStatus: newStatus },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
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
