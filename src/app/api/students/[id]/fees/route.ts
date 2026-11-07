import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranchFromRequest, withBranchViaRelationFilter } from '@/lib/branch';

// GET /api/students/[id]/fees — Invoice + payment history for a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const branchScope = getBranchFromRequest(request, authResult);

    const student = await db.student.findFirst({
      where: { id, ...withBranchViaRelationFilter(branchScope) },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const [invoices, payments] = await Promise.all([
      db.invoice.findMany({
        where: { studentId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          feeStructure: { select: { name: true } },
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      }),
      db.payment.findMany({
        where: { studentId: id },
        orderBy: { paymentDate: 'desc' },
        take: 20,
      }),
    ]);

    return NextResponse.json({ invoices, payments });
  } catch (error) {
    console.error('Get student fees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
