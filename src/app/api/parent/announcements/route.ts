import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/parent/announcements — Announcements visible to parents
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Parent);
    if (user instanceof NextResponse) return user;

    // Find the Parent record linked to this user
    const parent = await db.parent.findUnique({
      where: { userId: user.userId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all children of this parent to find class-specific announcements
    const studentParents = await db.studentParent.findMany({
      where: { parentId: parent.id },
      select: { studentId: true },
    });
    const childIds = studentParents.map((sp) => sp.studentId);

    // Get class IDs for children to match class-specific announcements
    let classIds: string[] = [];
    if (childIds.length > 0) {
      const students = await db.student.findMany({
        where: { id: { in: childIds } },
        select: { classId: true },
      });
      classIds = students
        .map((s) => s.classId)
        .filter((id): id is string => !!id);
    }

    // Build OR conditions for announcements visible to parents
    const orConditions: Record<string, unknown>[] = [
      { targetAudience: 'All' },
      { targetAudience: 'Parents' },
    ];

    // Add class-specific announcements
    if (classIds.length > 0) {
      orConditions.push(
        ...classIds.map((classId) => ({
          targetAudience: 'SpecificClass',
          classId,
        }))
      );
    }

    const where: Record<string, unknown> = {
      isActive: true,
      publishedAt: { not: null },
      OR: orConditions,
    };

    // Filter out expired announcements
    where.expiresAt = null;

    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          branch: {
            select: { id: true, name: true, logo: true },
          },
        },
      }),
      db.announcement.count({ where }),
    ]);

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Parent announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
