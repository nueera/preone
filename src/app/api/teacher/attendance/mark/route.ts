import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// POST /api/teacher/attendance/mark — Mark attendance for students in teacher's class
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Find assigned class
    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      select: { id: true },
    });

    if (!assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 404 });
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

    // Verify all students belong to teacher's class
    const studentIds = records.map((r: { studentId: string }) => r.studentId);
    const validStudents = await db.student.findMany({
      where: {
        id: { in: studentIds },
        classId: assignedClass.id,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    const validStudentIds = new Set(validStudents.map((s) => s.id));

    // Validate and filter records
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
    let saved = 0;
    let updated = 0;

    for (const record of records) {
      const { studentId, status, checkInTime, method } = record;

      if (!validStudentIds.has(studentId)) continue;
      if (!validStatuses.includes(status)) continue;

      try {
        const attendanceDate = new Date(date + 'T00:00:00.000Z');

        // Check if record exists
        const existing = await db.studentAttendance.findUnique({
          where: {
            studentId_date: {
              studentId,
              date: attendanceDate,
            },
          },
        });

        if (existing) {
          await db.studentAttendance.update({
            where: { id: existing.id },
            data: {
              status,
              checkInTime: checkInTime || null,
              method: method || 'MANUAL',
              markedBy: user.userId,
            },
          });
          updated++;
        } else {
          await db.studentAttendance.create({
            data: {
              studentId,
              date: attendanceDate,
              status,
              checkInTime: checkInTime || null,
              method: method || 'MANUAL',
              markedBy: user.userId,
            },
          });
          saved++;
        }
      } catch (err) {
        console.error(`Error saving attendance for student ${studentId}:`, err);
      }
    }

    return NextResponse.json({
      message: `Attendance saved: ${saved} created, ${updated} updated`,
      saved,
      updated,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/teacher/attendance/mark — Get attendance for a specific date
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      select: { id: true, name: true, program: { select: { name: true } } },
    });

    if (!assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 404 });
    }

    // Get date from query params
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { error: 'date query parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(dateParam + 'T00:00:00.000Z');

    // Get all students in the class
    const students = await db.student.findMany({
      where: { classId: assignedClass.id, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        photo: true,
      },
      orderBy: { rollNumber: 'asc' },
    });

    // Get attendance records for this date
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        date: attendanceDate,
      },
      select: {
        studentId: true,
        status: true,
        checkInTime: true,
        checkOutTime: true,
      },
    });

    // Build attendance map
    const attendanceMap = new Map<string, { status: string; checkInTime: string | null; checkOutTime: string | null }>();
    attendanceRecords.forEach((r) => {
      attendanceMap.set(r.studentId, {
        status: r.status,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
      });
    });

    // Build response records
    const records = students.map((student) => {
      const attendance = attendanceMap.get(student.id);
      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        photo: student.photo,
        status: attendance?.status || null,
        checkInTime: attendance?.checkInTime || null,
        checkOutTime: attendance?.checkOutTime || null,
      };
    });

    // Compute stats
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const total = students.length;
    const marked = attendanceRecords.length > 0;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return NextResponse.json({
      date: dateParam,
      class: {
        id: assignedClass.id,
        name: assignedClass.name,
        program: assignedClass.program.name,
      },
      marked,
      stats: { present, absent, late, total, rate },
      records,
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
