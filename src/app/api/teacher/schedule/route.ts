import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/schedule — Teacher's weekly schedule
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        branchId: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Get all work schedule records for the teacher
    const schedules = await db.workSchedule.findMany({
      where: { teacherId: teacher.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Format day names for readability
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Build a complete week schedule (even if some days have no records)
    const weeklySchedule = dayNames.map((name, index) => {
      const schedule = schedules.find(s => s.dayOfWeek === index);
      return {
        dayOfWeek: index,
        dayName: name,
        startTime: schedule?.startTime || null,
        endTime: schedule?.endTime || null,
        isOff: schedule?.isOff ?? (index === 0), // Default: Sunday is off
        id: schedule?.id || null,
      };
    });

    // Also get today's schedule specifically
    const today = new Date().getDay(); // 0-6
    const todaySchedule = weeklySchedule.find(s => s.dayOfWeek === today) || null;

    // Get working hours info
    const workingDays = weeklySchedule.filter(s => !s.isOff && s.startTime && s.endTime);
    const totalWorkingDays = workingDays.length;

    // Calculate total weekly working hours (rough estimate)
    let totalWeeklyMinutes = 0;
    for (const day of workingDays) {
      if (day.startTime && day.endTime) {
        const [startH, startM] = day.startTime.split(':').map(Number);
        const [endH, endM] = day.endTime.split(':').map(Number);
        if (!isNaN(startH) && !isNaN(startM) && !isNaN(endH) && !isNaN(endM)) {
          totalWeeklyMinutes += (endH * 60 + endM) - (startH * 60 + startM);
        }
      }
    }

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
      },
      weeklySchedule,
      todaySchedule,
      summary: {
        totalWorkingDays,
        totalWeeklyHours: Math.round((totalWeeklyMinutes / 60) * 10) / 10,
        totalWeeklyMinutes,
      },
    });
  } catch (error) {
    console.error('Get teacher schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
