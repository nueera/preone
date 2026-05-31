import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, branchFilter } from '@/lib/auth';
import { randomBytes } from 'crypto';

// GET /api/fees/invoices — List invoices
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || user.branchId || '';
    const status = searchParams.get('status') || '';
    const studentId = searchParams.get('studentId') || '';
    const academicYear = searchParams.get('academicYear') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause with branch isolation
    const where: Record<string, unknown> = { ...branchFilter(user) };
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (academicYear) where.academicYear = academicYear;

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, admissionNo: true },
          },
          feeStructure: {
            select: { id: true, name: true, feeType: true, frequency: true },
          },
          payments: {
            where: { status: 'Success' },
            orderBy: { paidAt: 'desc' },
          },
          _count: { select: { reminders: true } },
        },
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/fees/invoices — Create invoice
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const {
      studentId, branchId, feeStructureId, academicYear, period,
      amount, discount, discountReason, lateFee, dueDate, notes,
    } = body;

    // Use user's branchId for branch isolation
    const effectiveBranchId = user.branchId || branchId;

    if (!studentId || !effectiveBranchId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'studentId, branchId, amount, and dueDate are required' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNo = `INV-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;

    const totalAmount = amount + (lateFee || 0) - (discount || 0);

    const invoice = await db.invoice.create({
      data: {
        invoiceNo,
        studentId,
        branchId: effectiveBranchId,
        feeStructureId,
        academicYear,
        period,
        amount,
        discount: discount || 0,
        discountReason,
        lateFee: lateFee || 0,
        totalAmount,
        paidAmount: 0,
        dueDate: new Date(dueDate),
        notes,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        feeStructure: { select: { name: true, feeType: true } },
      },
    });

    return NextResponse.json(
      { message: 'Invoice created successfully', invoice },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
