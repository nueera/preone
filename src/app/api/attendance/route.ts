import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

// GET /api/attendance — Get attendance records (filter by date, class)
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const classId = searchParams.get('classId') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || 'student'; // student or staff

    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    if (type === 'staff') {
      const where: Record<string, unknown> = {
        date: { gte: dateStart, lte: dateEnd },
      };
      if (status) where.status = status;

      const attendance = await db.staffAttendance.findMany({
        where,
        include: {
          teacher: {
            select: { id: true, firstName: true, lastName: true, branchId: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ attendance, date, type: 'staff' });
    }

    // Student attendance
    const where: Record<string, unknown> = {
      date: { gte: dateStart, lte: dateEnd },
    };
    if (status) where.status = status;

    let attendance = await db.studentAttendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, rollNumber: true,
            branchId: true, classId: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by class
    if (classId) {
      attendance = attendance.filter(a => a.student.classId === classId);
    }

    return NextResponse.json({ attendance, date, type: 'student' });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/attendance — Mark attendance (bulk or single)
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();

    const body = await request.json();
    const { type = 'student', records } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'records array is required with at least one record' },
        { status: 400 }
      );
    }

    const results: { success: boolean; id?: string; error?: string }[] = [];

    if (type === 'staff') {
      for (const record of records) {
        const { teacherId, date, status, method, checkInTime, checkOutTime } = record;
        if (!teacherId || !date || !status) {
          results.push({ success: false, error: 'teacherId, date, and status are required' });
          continue;
        }

        try {
          const attendance = await db.staffAttendance.upsert({
            where: {
              teacherId_date: { teacherId, date: new Date(date) },
            },
            create: {
              teacherId,
              date: new Date(date),
              status,
              method: method || 'MANUAL',
              checkInTime,
              checkOutTime,
              markedBy: authUser.userId,
            },
            update: {
              status,
              method: method || 'MANUAL',
              checkInTime,
              checkOutTime,
            },
          });
          results.push({ success: true, id: attendance.id });
        } catch (err) {
          results.push({ success: false, error: String(err) });
        }
      }
    } else {
      // Student attendance
      for (const record of records) {
        const { studentId, date, status, method, checkInTime, checkOutTime } = record;
        if (!studentId || !date || !status) {
          results.push({ success: false, error: 'studentId, date, and status are required' });
          continue;
        }

        try {
          const attendance = await db.studentAttendance.upsert({
            where: {
              studentId_date: { studentId, date: new Date(date) },
            },
            create: {
              studentId,
              date: new Date(date),
              status,
              method: method || 'MANUAL',
              checkInTime,
              checkOutTime,
              markedBy: authUser.userId,
            },
            update: {
              status,
              method: method || 'MANUAL',
              checkInTime,
              checkOutTime,
            },
          });
          results.push({ success: true, id: attendance.id });
        } catch (err) {
          results.push({ success: false, error: String(err) });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `${successCount} attendance records processed`,
      successCount,
      failCount,
      results,
    }, { status: 201 });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
