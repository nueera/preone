import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { getBranchFromRequest, withBranchFilter } from '@/lib/branch';
import { randomBytes } from 'crypto';

// GET /api/fees/invoices — List invoices
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    // Branch isolation
    const branchScope = getBranchFromRequest(request, user);
    const branchFilter = withBranchFilter(branchScope);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const studentId = searchParams.get('studentId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where — start with branch filter via student relation
    // Invoice doesn't have branchId, so filter through student
    const branchWhere = Object.keys(branchFilter).length > 0
      ? { student: branchFilter }
      : branchScope.isAllBranches && branchScope.schoolId
        ? { student: { branch: { schoolId: branchScope.schoolId } } }
        : {};

    const where: Record<string, unknown> = { ...branchWhere };
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, rollNumber: true },
          },
          feeStructure: {
            select: { id: true, name: true, type: true, frequency: true },
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
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
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const {
      studentId, feeStructureId, amount, discount, dueDate, description,
    } = body;

    if (!studentId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'studentId, amount, and dueDate are required' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNo = `INV-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;

    const netAmount = amount - (discount || 0);

    const invoice = await db.invoice.create({
      data: {
        invoiceNo,
        studentId,
        feeStructureId: feeStructureId || null,
        amount,
        discount: discount || 0,
        netAmount,
        status: 'PENDING',
        dueDate: new Date(dueDate),
        description,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        feeStructure: { select: { name: true, type: true } },
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
