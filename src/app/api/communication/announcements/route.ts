import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, branchFilter } from '@/lib/auth';

// GET /api/communication/announcements — List announcements
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || user.branchId || '';
    const type = searchParams.get('type') || '';
    const targetAudience = searchParams.get('targetAudience') || '';
    const priority = searchParams.get('priority') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause with branch isolation
    const where: Record<string, unknown> = { isActive: true, ...branchFilter(user) };
    if (branchId) where.branchId = branchId;
    if (type) where.type = type;
    if (targetAudience) where.targetAudience = targetAudience;
    if (priority) where.priority = priority;

    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { id: true, name: true } },
        },
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
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const {
      branchId, title, content, type, targetAudience, classId,
      sectionId, priority, image, scheduledAt, expiresAt,
    } = body;

    // Use user's branchId for branch isolation
    const effectiveBranchId = user.branchId || branchId;

    if (!effectiveBranchId || !title || !content || !type || !targetAudience) {
      return NextResponse.json(
        { error: 'branchId, title, content, type, and targetAudience are required' },
        { status: 400 }
      );
    }

    const announcement = await db.announcement.create({
      data: {
        branchId: effectiveBranchId,
        title,
        content,
        type,
        targetAudience,
        classId,
        sectionId,
        priority: priority || 'Normal',
        image,
        createdBy: user.userId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        publishedAt: !scheduledAt ? new Date() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      include: {
        branch: { select: { id: true, name: true } },
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
