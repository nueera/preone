// ============================================================
// PreOne — /api/announcements/[id]/read
// Mark announcement as read (PUT)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// ── PUT /api/announcements/[id]/read — Mark announcement as read ──
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Verify announcement exists and belongs to user's school
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: { schoolId: true, status: true },
    });

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // School isolation
    if (announcement.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only published announcements can be marked as read
    if (announcement.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot mark an unpublished announcement as read' },
        { status: 400 }
      );
    }

    // Create read entry (unique on announcementId + userId — upsert to handle duplicates)
    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: user.userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        announcementId: id,
        userId: user.userId,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Announcement marked as read',
      readAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Mark announcement read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
