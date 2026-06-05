import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// PATCH — Mark one or all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      const result = await db.notification.updateMany({
        where: { userId: auth.userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return NextResponse.json({ success: true, marked: 'all', count: result.count });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId or markAll required' }, { status: 400 });
    }

    await db.notification.update({
      where: { id: notificationId, userId: auth.userId },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
