import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/reports/attendance — Attendance report data
export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const classId = searchParams.get('classId') || '';

    const dateFrom = new Date(from);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(to);
    dateTo.setHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      date: { gte: dateFrom, lte: dateTo },
    };

    const attendance = await db.studentAttendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, rollNumber: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Filter by class
    let filtered = attendance;
    if (classId) {
      filtered = attendance.filter(a => a.student.classId === classId);
    }

    // Summary
    const total = filtered.length;
    const present = filtered.filter(a => a.status === 'PRESENT').length;
    const absent = filtered.filter(a => a.status === 'ABSENT').length;
    const late = filtered.filter(a => a.status === 'LATE').length;

    // Group by student
    const byStudent = new Map<string, { student: typeof filtered[0]['student']; present: number; absent: number; late: number; total: number }>();
    for (const a of filtered) {
      const key = a.studentId;
      if (!byStudent.has(key)) {
        byStudent.set(key, { student: a.student, present: 0, absent: 0, late: 0, total: 0 });
      }
      const entry = byStudent.get(key)!;
      entry.total++;
      if (a.status === 'PRESENT') entry.present++;
      else if (a.status === 'ABSENT') entry.absent++;
      else if (a.status === 'LATE') entry.late++;
    }

    return NextResponse.json({
      summary: { total, present, absent, late, attendanceRate: total > 0 ? ((present + late) / total * 100).toFixed(1) : '0' },
      byStudent: Array.from(byStudent.values()).map(s => ({
        ...s,
        attendanceRate: s.total > 0 ? ((s.present + s.late) / s.total * 100).toFixed(1) : '0',
      })),
      records: filtered.map(a => ({
        date: a.date.toISOString().split('T')[0],
        studentName: `${a.student.firstName} ${a.student.lastName}`,
        rollNumber: a.student.rollNumber || '-',
        className: a.student.class?.name || '-',
        status: a.status,
        checkIn: a.checkInTime || '-',
        checkOut: a.checkOutTime || '-',
      })),
      dateRange: { from, to },
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
