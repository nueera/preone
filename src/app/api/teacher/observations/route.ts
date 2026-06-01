import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// ── GET /api/teacher/observations — Get observations with filters ──
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId') || '';
    const category = searchParams.get('category') || '';
    const priority = searchParams.get('priority') || '';
    const isShared = searchParams.get('isShared') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Find the teacher profile and class
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true, name: true } } },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    if (!teacher.assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 400 });
    }

    // Build where clause — only observations for students in teacher's class
    const where: Record<string, unknown> = {
      student: { classId: teacher.assignedClass.id },
    };

    if (studentId) where.studentId = studentId;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (isShared === 'true') where.isShared = true;
    if (isShared === 'false') where.isShared = false;

    // Search by student name or content
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
      ];
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
              rollNumber: true,
              class: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.observation.count({ where }),
    ]);

    // Format response
    const formatted = observations.map((obs) => ({
      id: obs.id,
      studentId: obs.studentId,
      studentName: `${obs.student.firstName} ${obs.student.lastName}`,
      studentPhoto: obs.student.photo,
      studentRollNumber: obs.student.rollNumber,
      className: obs.student.class?.name,
      category: obs.category,
      content: obs.content,
      priority: obs.priority,
      isShared: obs.isShared,
      parentAck: obs.parentAck,
      parentComment: obs.parentComment,
      media: obs.media,
      createdAt: obs.createdAt,
      updatedAt: obs.updatedAt,
    }));

    return NextResponse.json({
      observations: formatted,
      className: teacher.assignedClass.name,
      total,
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

// ── POST /api/teacher/observations — Create new observation ──
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true } } },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    if (!teacher.assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 400 });
    }

    const body = await request.json();
    const { studentId, category, content, priority, isShared, media } = body;

    if (!studentId || !category || !content) {
      return NextResponse.json(
        { error: 'studentId, category, and content are required' },
        { status: 400 }
      );
    }

    // Validate category enum
    const validCategories = ['BEHAVIORAL', 'ACADEMIC', 'SOCIAL', 'EMOTIONAL', 'PHYSICAL', 'COGNITIVE'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority enum
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'CONCERN'];
    const observationPriority = priority || 'NORMAL';
    if (!validPriorities.includes(observationPriority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify student belongs to teacher's class
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, classId: true, firstName: true, lastName: true },
    });

    if (!student || student.classId !== teacher.assignedClass.id) {
      return NextResponse.json(
        { error: 'Student not found in your class' },
        { status: 403 }
      );
    }

    if (content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    const shareWithParent = isShared ?? false;

    const observation = await db.observation.create({
      data: {
        studentId,
        teacherId: teacher.id,
        category,
        content: content.trim(),
        priority: observationPriority,
        isShared: shareWithParent,
        media: media || null,
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

    // If shared, send notification to parent
    if (shareWithParent) {
      try {
        const parentLink = await db.studentParent.findFirst({
          where: { studentId, isPrimary: true },
          select: { parent: { select: { userId: true } } },
        });

        if (parentLink?.parent?.userId) {
          await db.notification.create({
            data: {
              userId: parentLink.parent.userId,
              title: `New Observation - ${student.firstName} ${student.lastName}`,
              message: `Your child's teacher has shared a ${category.toLowerCase()} observation`,
              type: 'OBSERVATION',
              actionUrl: '/parent/observations',
            },
          });
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }

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
