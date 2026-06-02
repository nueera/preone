import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';
import { getParentUserId } from '@/lib/api-auth';

// ── GET /api/teacher/activities — Get activities with filters ──
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const isPublished = searchParams.get('isPublished') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Find the teacher profile to get their assigned class
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true, name: true } } },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Build where — only activities for teacher's class
    const where: Record<string, unknown> = {};

    if (teacher.assignedClass) {
      where.classId = teacher.assignedClass.id;
    } else {
      where.createdBy = user.userId;
    }

    // Single date filter
    if (date) {
      const dateStart = new Date(date + 'T00:00:00.000Z');
      const dateEnd = new Date(date + 'T23:59:59.999Z');
      where.date = { gte: dateStart, lte: dateEnd };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom + 'T00:00:00.000Z');
      if (dateTo) dateFilter.lte = new Date(dateTo + 'T23:59:59.999Z');
      where.date = dateFilter;
    }

    if (status) where.status = status;
    if (type) where.type = type;
    if (isPublished === 'true') where.isPublished = true;
    if (isPublished === 'false') where.isPublished = false;

    const [activities, total] = await Promise.all([
      db.activity.findMany({
        where,
        skip,
        take: limit,
        include: {
          class: {
            select: { id: true, name: true, program: { select: { name: true } } },
          },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
      db.activity.count({ where }),
    ]);

    // Format response
    const formatted = activities.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      description: a.description,
      date: a.date.toISOString().split('T')[0],
      startTime: a.startTime,
      endTime: a.endTime,
      location: a.location,
      materials: a.materials,
      learningOutcomes: a.learningOutcomes,
      media: a.media,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt,
      status: a.status,
      classId: a.classId,
      className: a.class?.name,
      programName: a.class?.program?.name,
      createdBy: a.createdBy,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return NextResponse.json({
      activities: formatted,
      className: teacher.assignedClass?.name,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get teacher activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/teacher/activities — Create new activity ──
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true, name: true } } },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      type,
      description,
      date,
      startTime,
      endTime,
      classId,
      location,
      materials,
      learningOutcomes,
      isPublished,
    } = body;

    if (!title || !type || !date) {
      return NextResponse.json(
        { error: 'title, type, and date are required' },
        { status: 400 }
      );
    }

    // Validate type enum
    const validTypes = ['ART', 'MUSIC', 'DANCE', 'SPORTS', 'ACADEMIC', 'OUTDOOR', 'INDOOR', 'CRAFT'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Use teacher's class if not provided
    const activityClassId = classId || teacher.assignedClass?.id || null;

    // Auto-set status based on date
    const today = new Date().toISOString().split('T')[0];
    let status: string;
    if (date === today) {
      status = 'ONGOING';
    } else if (date > today) {
      status = 'UPCOMING';
    } else {
      status = 'COMPLETED';
    }

    const publishNow = isPublished ?? false;
    const now = new Date();

    const activity = await db.activity.create({
      data: {
        classId: activityClassId,
        title,
        type,
        description: description || null,
        date: new Date(date + 'T00:00:00.000Z'),
        startTime: startTime || null,
        endTime: endTime || null,
        location: location || null,
        materials: materials || null,
        learningOutcomes: learningOutcomes || null,
        isPublished: publishNow,
        publishedAt: publishNow ? now : null,
        status,
        createdBy: user.userId,
      },
      include: {
        class: {
          select: { id: true, name: true, program: { select: { name: true } } },
        },
      },
    });

    // If published, notify all parents in the class
    if (publishNow && activityClassId) {
      try {
        const students = await db.student.findMany({
          where: { classId: activityClassId, status: 'ACTIVE' },
          select: { id: true },
        });

        for (const student of students) {
          const parentLink = await db.studentParent.findFirst({
            where: { studentId: student.id, isPrimary: true },
            select: { parentId: true },
          });

          if (parentLink?.parentId) {
            const notifyUserId = await getParentUserId(parentLink.parentId);
            if (notifyUserId) {
              await db.notification.create({
                data: {
                  userId: notifyUserId,
                  title: `New Activity: ${title}`,
                  message: `Your child has a ${type.toLowerCase()} activity ${date === today ? 'today' : 'on ' + new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`,
                  type: 'ACTIVITY',
                  actionUrl: '/parent/activities',
                },
              });
            }
          }
        }
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
      }
    }

    return NextResponse.json(
      {
        message: 'Activity created successfully',
        activity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
