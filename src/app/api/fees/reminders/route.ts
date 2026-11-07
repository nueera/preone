import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, getAuthUser, unauthorized } from '@/lib/auth';
import { getBranchFromRequest, withBranchFilter } from '@/lib/branch';

// GET /api/fees/reminders — List sent fee reminders (history)
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    // Branch isolation: FeeReminder -> invoice -> student -> branch
    const branchScope = getBranchFromRequest(request, user);
    const branchFilter = withBranchFilter(branchScope);
    const studentWhere =
      Object.keys(branchFilter).length > 0
        ? branchFilter
        : branchScope.isAllBranches && branchScope.schoolId
          ? { branch: { schoolId: branchScope.schoolId } }
          : null;
    const where: Record<string, unknown> = studentWhere
      ? { invoice: { student: studentWhere } }
      : {};

    const reminders = await db.feeReminder.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 100,
      include: {
        invoice: {
          select: {
            invoiceNo: true,
            student: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('List reminders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/fees/reminders — Send fee reminders
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { invoiceIds, channel, message } = body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'invoiceIds array is required' }, { status: 400 });
    }
    if (!channel) {
      return NextResponse.json({ error: 'channel is required (SMS/WhatsApp/Email/All)' }, { status: 400 });
    }

    const created: string[] = [];

    for (const invoiceId of invoiceIds) {
      try {
        await db.feeReminder.create({
          data: {
            invoiceId,
            type: 'PAYMENT_REMINDER',
            channel,
            status: 'SENT',
            sentAt: new Date(),
          },
        });
        created.push(invoiceId);
      } catch (err) {
        console.error(`Failed to create reminder for invoice ${invoiceId}:`, err);
      }
    }

    return NextResponse.json(
      { message: `${created.length} reminder(s) sent successfully`, sent: created.length },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send reminders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
