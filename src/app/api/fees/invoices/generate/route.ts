import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { randomBytes } from 'crypto';

// POST /api/fees/invoices/generate — Generate single or bulk invoices
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { studentIds, feeStructureId, dueDate, discount, description } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'studentIds array is required' }, { status: 400 });
    }
    if (!dueDate) {
      return NextResponse.json({ error: 'dueDate is required' }, { status: 400 });
    }

    // Get fee structure if provided
    let amount = body.amount || 0;
    let fsName = '';
    let fsType = '';
    if (feeStructureId) {
      const fs = await db.feeStructure.findUnique({ where: { id: feeStructureId } });
      if (fs) {
        amount = fs.amount;
        fsName = fs.name;
        fsType = fs.type;
      }
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const discountVal = parseFloat(discount) || 0;
    const netAmount = amount - discountVal;
    const created: string[] = [];
    const errors: string[] = [];

    for (const studentId of studentIds) {
      try {
        const invoiceNo = `INV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`;

        await db.invoice.create({
          data: {
            invoiceNo,
            studentId,
            feeStructureId: feeStructureId || null,
            amount,
            discount: discountVal,
            netAmount,
            status: 'PENDING',
            dueDate: new Date(dueDate),
            description: description || (fsName ? `${fsName} - ${fsType}` : undefined),
          },
        });
        created.push(studentId);
      } catch (err) {
        errors.push(`Failed for student ${studentId}: ${err}`);
      }
    }

    return NextResponse.json(
      {
        message: `${created.length} invoice(s) generated successfully`,
        created: created.length,
        errors: errors.length,
        errorDetails: errors,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Generate invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
