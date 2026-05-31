import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/observations — Get observations for class or student
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Teacher);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId') || '';
    const studentId = searchParams.get('studentId') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const where: Record<string, unknown> = {
      teacherId: teacher.id,
    };

    // Filter by student
    if (studentId) {
      where.studentId = studentId;
    }

    // Filter by class (via student's classId)
    if (classId) {
      where.student = { classId };
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    const [observations, total] = await Promise.all([
      db.observation.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
              admissionNo: true,
              class: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.observation.count({ where }),
    ]);

    return NextResponse.json({
      observations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get observations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teacher/observations — Create new observation
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Teacher);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { studentId, category, content, priority, isShared } = body;

    if (!studentId || !category || !content) {
      return NextResponse.json(
        { error: 'studentId, category, and content are required' },
        { status: 400 }
      );
    }

    const validCategories = ['Behavioral', 'Academic', 'Social', 'Emotional', 'Physical', 'Cognitive'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const observation = await db.observation.create({
      data: {
        studentId,
        teacherId: teacher.id,
        category,
        content,
        priority: priority || 'Normal',
        isShared: isShared ?? false,
        sharedAt: isShared ? new Date() : null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Observation created successfully',
        observation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create observation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
