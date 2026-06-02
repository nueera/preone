import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, forbidden } from '@/lib/auth';

// GET /api/teachers/[id]/salary — Get salary records
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');

    const teacher = await db.teacher.findUnique({ where: { id } });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const where: Record<string, unknown> = { teacherId: id };
    if (year) where.year = parseInt(year);

    const salaries = await db.salaryRecord.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return NextResponse.json({ salaries, currentSalary: teacher.salary });
  } catch (error) {
    console.error('Get salary records error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teachers/[id]/salary/process — Process monthly salary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();

    const {
      month, year, basicSalary, hra, da, pfDeduction,
      taxDeduction, otherDeductions, deductionReason,
      bonus, bonusReason, paymentMethod, paymentDate,
    } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const teacher = await db.teacher.findUnique({ where: { id } });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Calculate net pay
    const basic = parseFloat(basicSalary) || teacher.salary || 0;
    const hraVal = parseFloat(hra) || 0;
    const daVal = parseFloat(da) || 0;
    const pfVal = parseFloat(pfDeduction) || 0;
    const taxVal = parseFloat(taxDeduction) || 0;
    const otherDed = parseFloat(otherDeductions) || 0;
    const bonusVal = parseFloat(bonus) || 0;
    const netPay = basic + hraVal + daVal - pfVal - taxVal - otherDed + bonusVal;

    // Check if salary already processed for this month
    const existing = await db.salaryRecord.findFirst({
      where: { teacherId: id, month: parseInt(month), year: parseInt(year) },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Salary already processed for this month' },
        { status: 409 }
      );
    }

    const salaryRecord = await db.salaryRecord.create({
      data: {
        teacherId: id,
        month: parseInt(month),
        year: parseInt(year),
        basicSalary: basic,
        hra: hraVal,
        da: daVal,
        pfDeduction: pfVal,
        taxDeduction: taxVal,
        otherDeductions: otherDed,
        deductionReason: deductionReason || null,
        bonus: bonusVal,
        bonusReason: bonusReason || null,
        netPay,
        paymentMethod: paymentMethod || null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        status: 'PAID',
      },
    });

    return NextResponse.json(
      { message: 'Salary processed successfully', salary: salaryRecord },
      { status: 201 }
    );
  } catch (error) {
    console.error('Process salary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
