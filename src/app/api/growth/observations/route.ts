import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// POST /api/growth/observations — Add teacher observation
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentId, category, content, media, isShared, priority,
    } = body;

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

    // Find teacher by user ID
    const teacher = await db.teacher.findFirst({
      where: { userId: authUser.userId },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found for current user' },
        { status: 404 }
      );
    }

    // Verify student exists
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const observation = await db.observation.create({
      data: {
        studentId,
        teacherId: teacher.id,
        category,
        content,
        media,
        date: new Date(),
        isShared: isShared || false,
        sharedAt: isShared ? new Date() : undefined,
        priority: priority || 'Normal',
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(
      { message: 'Observation added successfully', observation },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add observation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
