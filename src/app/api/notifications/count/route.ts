import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET — Get unread count only (lightweight, for polling)
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const unreadCount = await db.notification.count({
      where: { userId: auth.userId, isRead: false },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Notification count error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
