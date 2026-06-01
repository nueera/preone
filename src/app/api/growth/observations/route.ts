import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// POST /api/growth/observations — Add teacher observation
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.ADMIN, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const {
      studentId, category, content, priority,
    } = body;

    if (!studentId || !category || !content) {
      return NextResponse.json(
        { error: 'studentId, category, and content are required' },
        { status: 400 }
      );
    }

    // Map category string to enum value
    const categoryMap: Record<string, string> = {
      'Behavioral': 'BEHAVIORAL',
      'Academic': 'ACADEMIC',
      'Social': 'SOCIAL',
      'Emotional': 'EMOTIONAL',
      'Physical': 'PHYSICAL',
      'Cognitive': 'COGNITIVE',
    };

    const mappedCategory = categoryMap[category] || category;
    const validCategories = ['BEHAVIORAL', 'ACADEMIC', 'SOCIAL', 'EMOTIONAL', 'PHYSICAL', 'COGNITIVE'];
    if (!validCategories.includes(mappedCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Find teacher by user ID (optional for admin)
    const teacher = await db.teacher.findFirst({
      where: { userId: user.userId },
    });

    // Verify student exists
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Map priority
    const priorityMap: Record<string, string> = {
      'Low': 'LOW',
      'Normal': 'NORMAL',
      'High': 'HIGH',
      'Concern': 'CONCERN',
    };
    const mappedPriority = priorityMap[priority || 'Normal'] || 'NORMAL';

    const observation = await db.observation.create({
      data: {
        studentId,
        teacherId: teacher?.id || null,
        category: mappedCategory as 'BEHAVIORAL' | 'ACADEMIC' | 'SOCIAL' | 'EMOTIONAL' | 'PHYSICAL' | 'COGNITIVE',
        content,
        priority: mappedPriority as 'LOW' | 'NORMAL' | 'HIGH' | 'CONCERN',
        isShared: false,
        parentAck: false,
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
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
