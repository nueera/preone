import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/reports/daily-updates — Daily Updates report
export async function GET(request: NextRequest) {
  try {
    const auth = requireRole(request, Role.ADMIN, Role.TEACHER);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const classId = searchParams.get('classId') || '';

    const dateFrom = new Date(from);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(to);
    dateTo.setHours(23, 59, 59, 999);

    const updates = await db.dailyUpdate.findMany({
      where: {
        date: { gte: dateFrom, lte: dateTo },
        status: 'PUBLISHED',
      },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, rollNumber: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { student: { firstName: 'asc' } }],
    });

    // Filter by class
    let filtered = updates;
    if (classId) {
      filtered = updates.filter(u => u.student.classId === classId);
    }

    // Summary
    const totalUpdates = filtered.length;
    const uniqueStudents = new Set(filtered.map(u => u.studentId)).size;
    const uniqueDates = new Set(filtered.map(u => u.date.toISOString().split('T')[0])).size;

    return NextResponse.json({
      summary: {
        totalUpdates,
        uniqueStudents,
        uniqueDates,
        dateRange: `${from} to ${to}`,
      },
      records: filtered.map(u => ({
        date: u.date.toISOString().split('T')[0],
        studentName: `${u.student.firstName} ${u.student.lastName}`,
        rollNumber: u.student.rollNumber || '-',
        className: u.student.class?.name || '-',
        breakfast: u.breakfast || '-',
        lunch: u.lunch || '-',
        snacks: u.snacks || '-',
        sleepStart: u.sleepStart || '-',
        sleepEnd: u.sleepEnd || '-',
        sleepQuality: u.sleepQuality || '-',
        moodMorning: u.moodMorning || '-',
        moodAfternoon: u.moodAfternoon || '-',
        waterGlasses: u.waterGlasses,
        pottyCount: u.pottyCount,
        highlights: u.highlights || '-',
      })),
      dateRange: { from, to },
    });
  } catch (error) {
    console.error('Daily updates report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
