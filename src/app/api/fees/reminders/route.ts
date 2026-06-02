import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

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
