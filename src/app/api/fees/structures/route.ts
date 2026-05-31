import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, branchFilter } from '@/lib/auth';

// GET /api/fees/structures — Fee structures
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || user.branchId || '';
    const academicYear = searchParams.get('academicYear') || '';
    const feeType = searchParams.get('feeType') || '';
    const classId = searchParams.get('classId') || '';

    // Build where clause with branch isolation
    const where: Record<string, unknown> = { isActive: true, ...branchFilter(user) };
    if (branchId) where.branchId = branchId;
    if (academicYear) where.academicYear = academicYear;
    if (feeType) where.feeType = feeType;
    if (classId) where.classId = classId;

    const feeStructures = await db.feeStructure.findMany({
      where,
      orderBy: [{ feeType: 'asc' }, { name: 'asc' }],
      include: {
        branch: { select: { id: true, name: true } },
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
