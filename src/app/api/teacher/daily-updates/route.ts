import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/teacher/daily-updates — Get daily updates for a class on a date
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.role !== 'Teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const classId = searchParams.get('classId') || '';

    const dateStart = new Date(date + 'T00:00:00.000Z');
    const dateEnd = new Date(date + 'T23:59:59.999Z');

    const where: Record<string, unknown> = {
      date: { gte: dateStart, lte: dateEnd },
    };

    if (classId) {
      where.student = { classId };
    }

    const dailyUpdates = await db.dailyUpdate.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
            admissionNo: true,
            classId: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { student: { firstName: 'asc' } },
    });

    return NextResponse.json({
      dailyUpdates,
      date,
      count: dailyUpdates.length,
    });
  } catch (error) {
    console.error('Get daily updates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teacher/daily-updates — Create/update daily update for a student
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.role !== 'Teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
    }

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: authUser.userId },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      studentId,
      date,
      breakfast,
      lunch,
      snacks,
      sleepQuality,
      morningMood,
      afternoonMood,
      waterGlasses,
      highlights,
      notes,
    } = body;

    if (!studentId || !date) {
      return NextResponse.json(
        { error: 'studentId and date are required' },
        { status: 400 }
      );
    }

    const updateDate = new Date(date + 'T00:00:00.000Z');

    const dailyUpdate = await db.dailyUpdate.upsert({
      where: {
        studentId_date: {
          studentId,
          date: updateDate,
        },
      },
      create: {
        studentId,
        date: updateDate,
        teacherId: authUser.userId,
        breakfast,
        lunch,
        snacks,
        sleepQuality,
        morningMood,
        afternoonMood,
        waterGlasses: waterGlasses ?? 0,
        highlights,
        notes,
        status: 'Draft',
      },
      update: {
        teacherId: authUser.userId,
        breakfast,
        lunch,
        snacks,
        sleepQuality,
        morningMood,
        afternoonMood,
        waterGlasses: waterGlasses ?? 0,
        highlights,
        notes,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Daily update saved successfully',
        dailyUpdate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Save daily update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
