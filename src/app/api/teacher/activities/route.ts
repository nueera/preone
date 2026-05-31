import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/teacher/activities — Get teacher's activities
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.role !== 'Teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: authUser.userId },
      select: { id: true, branchId: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const where: Record<string, unknown> = {
      teacherId: teacher.id,
    };

    // Filter by date
    if (date) {
      const dateStart = new Date(date + 'T00:00:00.000Z');
      const dateEnd = new Date(date + 'T23:59:59.999Z');
      where.date = { gte: dateStart, lte: dateEnd };
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by type
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
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.role !== 'Teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
    }

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: authUser.userId },
      select: { id: true, branchId: true },
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
        branchId: teacher.branchId,
        teacherId: teacher.id,
        classId: classId || null,
        title,
        type,
        description: description || null,
        date: new Date(date + 'T00:00:00.000Z'),
        startTime: startTime || null,
        endTime: endTime || null,
        learningOutcomes: learningOutcomes || null,
        status: 'Planned',
        isPublished: false,
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
