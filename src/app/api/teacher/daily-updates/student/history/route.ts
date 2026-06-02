// Teacher daily updates student history - moved from [studentId] to avoid slug conflict
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTeacher, isAuthError } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTeacher(request);
    if (isAuthError(auth)) return auth.error;

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // Verify student belongs to teacher's class
    if (auth.classId) {
      const student = await db.student.findFirst({
        where: { id: studentId, classId: auth.classId },
        select: { id: true },
      });
      if (!student) {
        return NextResponse.json({ error: 'Student not found in your class' }, { status: 403 });
      }
    }

    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const updates = await db.dailyUpdate.findMany({
      where: {
        studentId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ updates });
  } catch (error) {
    console.error('Teacher daily updates history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
