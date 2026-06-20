import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role, getAuthUser, unauthorized } from '@/lib/auth';
import { getBranchFromRequest, withBranchFilter } from '@/lib/branch';

// GET /api/growth/observations — List observations
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const branchScope = getBranchFromRequest(request, user);
    const branchFilter = withBranchFilter(branchScope);
    const studentWhere =
      Object.keys(branchFilter).length > 0
        ? branchFilter
        : branchScope.isAllBranches && branchScope.schoolId
          ? { branch: { schoolId: branchScope.schoolId } }
          : null;
    const where: Record<string, unknown> = studentWhere ? { student: studentWhere } : {};

    const observations = await db.observation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { student: { select: { firstName: true, lastName: true } } },
    });

    // Observation.teacherId has no relation — resolve teacher names in one query.
    const teacherIds = [...new Set(observations.map((o) => o.teacherId).filter(Boolean))] as string[];
    const teachers = teacherIds.length
      ? await db.teacher.findMany({ where: { id: { in: teacherIds } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    const teacherMap: Record<string, string> = {};
    for (const t of teachers) teacherMap[t.id] = `${t.firstName} ${t.lastName}`;

    return NextResponse.json({
      observations: observations.map((o) => ({
        id: o.id,
        student: `${o.student.firstName} ${o.student.lastName}`,
        category: o.category,
        content: o.content,
        teacher: o.teacherId ? teacherMap[o.teacherId] || '—' : '—',
        date: o.createdAt,
        photo: !!o.media,
      })),
    });
  } catch (error) {
    console.error('List observations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
