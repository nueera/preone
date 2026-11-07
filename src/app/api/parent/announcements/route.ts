// ============================================================
// PreOne — GET /api/parent/announcements
// Announcements visible to parents (target=ALL/PARENTS/CLASS)
// Uses requireParent for consistent auth
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const { children } = auth;

    // Get class IDs for the parent's children
    const classIds = children
      .map((c) => c.class?.id)
      .filter((id): id is string => !!id);

    // Build announcement filter
    const orConditions: Record<string, unknown>[] = [
      { target: 'ALL' },
      { target: 'PARENTS' },
    ];

    // Add class-specific announcements
    for (const classId of classIds) {
      orConditions.push({ target: 'CLASS', targetIds: classId });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { not: null },
          OR: orConditions,
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          priority: true,
          attachments: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      db.announcement.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: { not: null },
          OR: orConditions,
        },
      }),
    ]);

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        type: a.type,
        priority: a.priority,
        attachments: a.attachments,
        publishedAt: a.publishedAt?.toISOString() || null,
        createdAt: a.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Parent announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
