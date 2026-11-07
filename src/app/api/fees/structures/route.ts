import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';

// GET /api/fees/structures — Fee structures list
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || '';
    const classId = searchParams.get('classId') || '';

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    if (classId) where.classId = classId;

    const feeStructures = await db.feeStructure.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { invoices: true } },
      },
    });

    return NextResponse.json({ feeStructures });
  } catch (error) {
    console.error('Fee structures error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/fees/structures — Create fee structure
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { name, type, amount, frequency, classId, programId, description } = body;

    if (!name || !type || !amount || !frequency) {
      return NextResponse.json(
        { error: 'name, type, amount, and frequency are required' },
        { status: 400 }
      );
    }

    const feeStructure = await db.feeStructure.create({
      data: {
        name,
        type,
        amount: parseFloat(amount),
        frequency,
        classId: classId || null,
        programId: programId || null,
        description: description || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      { message: 'Fee structure created successfully', feeStructure },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create fee structure error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
