import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/daily-updates/[studentId]/history — Get daily update history for a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { studentId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Find the teacher's assigned class
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true } } },
    });

    if (!teacher || !teacher.assignedClass) {
      return NextResponse.json({ error: 'Teacher or class not found' }, { status: 404 });
    }

    // Verify student belongs to teacher's class
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, classId: true, firstName: true, lastName: true, photo: true },
    });

    if (!student || student.classId !== teacher.assignedClass.id) {
      return NextResponse.json({ error: 'Student not found in your class' }, { status: 403 });
    }

    // Build date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const updates = await db.dailyUpdate.findMany({
      where: {
        studentId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        photo: student.photo,
      },
      month,
      year,
      updates,
      count: updates.length,
    });
  } catch (error) {
    console.error('Get daily update history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
