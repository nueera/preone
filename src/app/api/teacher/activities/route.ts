import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/activities — Get teacher's activities
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Teacher);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Find the teacher profile to get their assigned class
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true } } },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Filter by the teacher's assigned class or createdBy
    const where: Record<string, unknown> = {
      createdBy: user.userId,
    };

    // Also show activities for their assigned class
    if (teacher.assignedClass) {
      where.OR = [
        { createdBy: user.userId },
        { classId: teacher.assignedClass.id },
      ];
      delete where.createdBy;
    }

    if (date) {
      const dateStart = new Date(date + 'T00:00:00.000Z');
      const dateEnd = new Date(date + 'T23:59:59.999Z');
      where.date = { gte: dateStart, lte: dateEnd };
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

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
        orderBy: { date: 'desc' },
      }),
      db.activity.count({ where }),
    ]);

    return NextResponse.json({
      activities,
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

// POST /api/teacher/activities — Create new activity
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Teacher);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const {
      title,
      type,
      description,
      date,
      startTime,
      endTime,
      classId,
      learningOutcomes,
    } = body;

    if (!title || !type || !date) {
      return NextResponse.json(
        { error: 'title, type, and date are required' },
        { status: 400 }
      );
    }

    const activity = await db.activity.create({
      data: {
        classId: classId || null,
        title,
        type,
        description: description || null,
        date: new Date(date + 'T00:00:00.000Z'),
        startTime: startTime || null,
        endTime: endTime || null,
        learningOutcomes: learningOutcomes || null,
        status: 'UPCOMING',
        isPublished: false,
        createdBy: user.userId,
      },
      include: {
        class: {
          select: { id: true, name: true, program: { select: { name: true } } },
        },
      },
    });

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
