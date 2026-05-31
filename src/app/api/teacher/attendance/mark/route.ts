import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// POST /api/teacher/attendance/mark — Mark attendance for students
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
    const { date, records } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'records array is required with at least one record' },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['Present', 'Absent', 'Late', 'HalfDay', 'Excused'];
    const results: { success: boolean; studentId?: string; id?: string; error?: string }[] = [];

    for (const record of records) {
      const { studentId, status } = record;

      if (!studentId || !status) {
        results.push({ success: false, studentId, error: 'studentId and status are required' });
        continue;
      }

      if (!validStatuses.includes(status)) {
        results.push({
          success: false,
          studentId,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
        continue;
      }

      try {
        const attendanceDate = new Date(date + 'T00:00:00.000Z');

        const attendance = await db.studentAttendance.upsert({
          where: {
            studentId_date: {
              studentId,
              date: attendanceDate,
            },
          },
          create: {
            studentId,
            date: attendanceDate,
            status,
            method: 'Manual',
            markedBy: user.userId,
          },
          update: {
            status,
            method: 'Manual',
            markedBy: user.userId,
          },
        });

        results.push({ success: true, studentId, id: attendance.id });
      } catch (err) {
        results.push({ success: false, studentId, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const errors = results.filter(r => !r.success);

    return NextResponse.json(
      {
        message: `${successCount} attendance records processed successfully`,
        successCount,
        errorCount,
        results,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
