import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

// GET /api/fees/structures — Fee structures
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

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
        class: { select: { id: true, name: true, program: { select: { name: true } } } },
        _count: { select: { invoices: true } },
      },
    });

    return NextResponse.json({ feeStructures });
  } catch (error) {
    console.error('Fee structures error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
