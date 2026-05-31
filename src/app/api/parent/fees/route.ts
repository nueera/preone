import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/parent/fees — Fee information for parent's children
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Parent);
    if (user instanceof NextResponse) return user;

    // Find the Parent record linked to this user
    const parent = await db.parent.findUnique({
      where: { userId: user.userId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');
    const statusFilter = searchParams.get('status');

    // Get all children of this parent
    const studentParents = await db.studentParent.findMany({
      where: { parentId: parent.id },
      select: { studentId: true },
    });
    const childIds = studentParents.map((sp) => sp.studentId);

    if (childIds.length === 0) {
      return NextResponse.json({
        invoices: [],
        paymentHistory: [],
        totalPending: 0,
        totalOverdue: 0,
        totalPaid: 0,
      });
    }

    // Validate childId if provided
    if (childId && !childIds.includes(childId)) {
      return NextResponse.json(
        { error: 'Child not found or not associated with this parent' },
        { status: 403 }
      );
    }

    // Determine which children to query
    const targetChildIds = childId ? [childId] : childIds;

    // Build where clause for invoices
    const invoiceWhere: Record<string, unknown> = {
      studentId: { in: targetChildIds },
    };

    if (statusFilter) {
      invoiceWhere.status = statusFilter;
    }

    // Fetch invoices with fee structure and payment details
    const invoices = await db.invoice.findMany({
      where: invoiceWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
        feeStructure: {
          select: {
            id: true,
            name: true,
            feeType: true,
            frequency: true,
            amount: true,
            academicYear: true,
            description: true,
          },
        },
        payments: {
          where: { status: 'Success' },
          orderBy: { paidAt: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            transactionRef: true,
            paidByName: true,
            paidAt: true,
            status: true,
            receipt: {
              select: { id: true, receiptNo: true },
            },
          },
        },
      },
    });

    // Get all successful payments for payment history
    const paidInvoiceIds = invoices
      .filter((inv) => inv.status === 'Paid' || inv.status === 'Partial')
      .map((inv) => inv.id);

    const paymentHistory = await db.payment.findMany({
      where: {
        invoiceId: { in: paidInvoiceIds },
        status: 'Success',
      },
      orderBy: { paidAt: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            studentId: true,
            student: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        receipt: {
          select: { id: true, receiptNo: true },
        },
      },
    });

    // Calculate totals
    const pendingInvoices = invoices.filter((inv) => inv.status === 'Pending' || inv.status === 'Partial');
    const overdueInvoices = invoices.filter((inv) => inv.status === 'Overdue');
    const paidInvoices = invoices.filter((inv) => inv.status === 'Paid');

    const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

    return NextResponse.json({
      invoices,
      paymentHistory,
      totalPending,
      totalOverdue,
      totalPaid,
    });
  } catch (error) {
    console.error('Parent fees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
