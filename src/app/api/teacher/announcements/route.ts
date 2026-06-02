import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/announcements — Announcements visible to teachers
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Find teacher's assigned class
    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      select: { id: true, name: true },
    });

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || '';
    const priority = searchParams.get('priority') || '';

    // Build where clause: PUBLISHED announcements targeting teachers or all
    const where: Record<string, unknown>[] = [
      { status: 'PUBLISHED' },
      { publishedAt: { not: null } },
      {
        OR: [
          { target: 'All' },
          { target: 'ALL' },
          { target: 'Teachers' },
          { target: 'TEACHERS' },
          ...(assignedClass
            ? [
                { target: 'Class', targetIds: { contains: assignedClass.id } },
                { target: 'CLASS', targetIds: { contains: assignedClass.id } },
              ]
            : []),
        ],
      },
    ];

    if (type) where.push({ type });
    if (priority) where.push({ priority });

    const announcements = await db.announcement.findMany({
      where: { AND: where },
      orderBy: { publishedAt: 'desc' },
    });

    // Format response
    const formatted = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      priority: a.priority,
      content: a.content,
      attachments: a.attachments,
      publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
      createdBy: a.createdBy || null,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({
      announcements: formatted,
      className: assignedClass?.name || null,
    });
  } catch (error) {
    console.error('Get teacher announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
