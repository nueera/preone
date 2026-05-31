import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

// GET /api/communication/announcements — List announcements
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || '';
    const target = searchParams.get('target') || '';
    const priority = searchParams.get('priority') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (target) where.target = target;
    if (priority) where.priority = priority;

    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.announcement.count({ where }),
    ]);

    return NextResponse.json({
      announcements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/communication/announcements — Create announcement
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const {
      title, content, type, target, priority, scheduledAt,
    } = body;

    if (!title || !content || !type) {
      return NextResponse.json(
        { error: 'title, content, and type are required' },
        { status: 400 }
      );
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        type,
        target: target || 'All',
        priority: priority || 'NORMAL',
        status: 'Published',
        publishedAt: !scheduledAt ? new Date() : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: user.userId,
      },
    });

    return NextResponse.json(
      { message: 'Announcement created successfully', announcement },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
