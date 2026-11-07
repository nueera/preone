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

    // Get all work schedule records for the teacher, sorted by dayOfWeek then startTime
    const schedules = await db.workSchedule.findMany({
      where: { teacherId: teacher.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // If no schedules exist, return empty state
    if (schedules.length === 0) {
      return NextResponse.json({
        teacher: {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
        },
        schedule: [],
        todaySchedule: [],
        hasSchedule: false,
      });
    }

    // Build schedule array grouped by day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Return flat list of schedule entries as the spec requests
    const schedule = schedules.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      dayName: dayNames[s.dayOfWeek] || 'Unknown',
      startTime: s.startTime,
      endTime: s.endTime,
      subject: s.subject || null,
      classId: s.classId || null,
    }));

    // Also get today's schedule
    const today = new Date().getDay(); // 0-6
    const todaySchedule = schedules
      .filter((s) => s.dayOfWeek === today)
      .map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subject || null,
      }));

    // Build weekly grid format (days as columns, time slots as rows)
    const allTimeSlots = [...new Set(schedules.map((s) => s.startTime))].sort();
    const workingDays = [...new Set(schedules.map((s) => s.dayOfWeek))].sort((a, b) => a - b);

    const weeklyGrid = allTimeSlots.map((time) => {
      const row: Record<string, { startTime: string; endTime: string; subject: string | null } | null> = { time };
      for (const day of workingDays) {
        const entry = schedules.find((s) => s.dayOfWeek === day && s.startTime === time);
        row[`day${day}`] = entry
          ? { startTime: entry.startTime, endTime: entry.endTime, subject: entry.subject }
          : null;
      }
      return row;
    });

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
      },
      schedule,
      todaySchedule,
      weeklyGrid,
      workingDays,
      allTimeSlots,
      hasSchedule: true,
    });
  } catch (error) {
    console.error('Get teacher schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
