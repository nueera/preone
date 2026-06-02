import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';
import { getParentUserId } from '@/lib/api-auth';

// ── GET /api/teacher/daily-updates — Get all daily updates for teacher's class on a date ──
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Find the teacher's assigned class
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true, name: true } } },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    if (!teacher.assignedClass) {
      return NextResponse.json({ error: 'No class assigned to this teacher' }, { status: 400 });
    }

    const classId = teacher.assignedClass.id;
    const dateStart = new Date(date + 'T00:00:00.000Z');
    const dateEnd = new Date(date + 'T23:59:59.999Z');

    // Get all students in the class
    const students = await db.student.findMany({
      where: { classId, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photo: true,
        rollNumber: true,
      },
      orderBy: { firstName: 'asc' },
    });

    // Get existing daily updates for the date
    const dailyUpdates = await db.dailyUpdate.findMany({
      where: {
        date: { gte: dateStart, lte: dateEnd },
        student: { classId },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
            rollNumber: true,
          },
        },
      },
    });

    // Build a map of studentId → update
    const updateMap = new Map(dailyUpdates.map((du) => [du.studentId, du]));

    // Combine students + updates into a unified list
    const updates = students.map((student) => {
      const existing = updateMap.get(student.id);
      return existing
        ? {
            id: existing.id,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            studentPhoto: student.photo,
            rollNumber: student.rollNumber,
            breakfast: existing.breakfast,
            breakfastMenu: existing.breakfastMenu,
            lunch: existing.lunch,
            lunchMenu: existing.lunchMenu,
            snacks: existing.snacks,
            snacksMenu: existing.snacksMenu,
            sleepStart: existing.sleepStart,
            sleepEnd: existing.sleepEnd,
            sleepQuality: existing.sleepQuality,
            moodMorning: existing.moodMorning,
            moodAfternoon: existing.moodAfternoon,
            pottyCount: existing.pottyCount,
            pottyType: existing.pottyType,
            waterGlasses: existing.waterGlasses,
            highlights: existing.highlights,
            status: existing.status,
            publishedAt: existing.publishedAt,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
          }
        : {
            id: null,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            studentPhoto: student.photo,
            rollNumber: student.rollNumber,
            breakfast: null,
            breakfastMenu: null,
            lunch: null,
            lunchMenu: null,
            snacks: null,
            snacksMenu: null,
            sleepStart: null,
            sleepEnd: null,
            sleepQuality: null,
            moodMorning: null,
            moodAfternoon: null,
            pottyCount: 0,
            pottyType: null,
            waterGlasses: 0,
            highlights: null,
            status: 'NOT_STARTED',
            publishedAt: null,
            createdAt: null,
            updatedAt: null,
          };
    });

    const summary = {
      total: students.length,
      published: updates.filter((u) => u.status === 'PUBLISHED').length,
      draft: updates.filter((u) => u.status === 'DRAFT').length,
      notStarted: updates.filter((u) => u.status === 'NOT_STARTED').length,
    };

    return NextResponse.json({
      date,
      classId,
      className: teacher.assignedClass.name,
      updates,
      summary,
    });
  } catch (error) {
    console.error('Get daily updates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/teacher/daily-updates — Create or update a daily update for a student ──
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, assignedClass: { select: { id: true } } },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    if (!teacher.assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 400 });
    }

    const body = await request.json();
    const {
      studentId,
      date,
      breakfast,
      breakfastMenu,
      lunch,
      lunchMenu,
      snacks,
      snacksMenu,
      sleepStart,
      sleepEnd,
      sleepQuality,
      moodMorning,
      moodAfternoon,
      pottyCount,
      pottyType,
      waterGlasses,
      highlights,
      status,
    } = body;

    if (!studentId || !date) {
      return NextResponse.json(
        { error: 'studentId and date are required' },
        { status: 400 }
      );
    }

    // Verify student belongs to teacher's class
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, classId: true, firstName: true, lastName: true },
    });

    if (!student || student.classId !== teacher.assignedClass.id) {
      return NextResponse.json(
        { error: 'Student not found in your class' },
        { status: 403 }
      );
    }

    const updateDate = new Date(date + 'T00:00:00.000Z');
    const updateStatus = status || 'DRAFT';
    const now = new Date();

    // Determine if this is a publish action (DRAFT → PUBLISHED)
    const existingUpdate = await db.dailyUpdate.findUnique({
      where: { studentId_date: { studentId, date: updateDate } },
    });

    const isPublishing = updateStatus === 'PUBLISHED' && (!existingUpdate || existingUpdate.status !== 'PUBLISHED');

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
        teacherId: teacher.id,
        breakfast,
        breakfastMenu,
        lunch,
        lunchMenu,
        snacks,
        snacksMenu,
        sleepStart,
        sleepEnd,
        sleepQuality,
        moodMorning,
        moodAfternoon,
        pottyCount: pottyCount ?? 0,
        pottyType,
        waterGlasses: waterGlasses ?? 0,
        highlights,
        status: updateStatus,
        publishedAt: updateStatus === 'PUBLISHED' ? now : null,
      },
      update: {
        teacherId: teacher.id,
        breakfast,
        breakfastMenu,
        lunch,
        lunchMenu,
        snacks,
        snacksMenu,
        sleepStart,
        sleepEnd,
        sleepQuality,
        moodMorning,
        moodAfternoon,
        pottyCount: pottyCount ?? 0,
        pottyType,
        waterGlasses: waterGlasses ?? 0,
        highlights,
        status: updateStatus,
        publishedAt: updateStatus === 'PUBLISHED'
          ? (existingUpdate?.publishedAt || now)
          : null,
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

    // If publishing, create notification for parent
    if (isPublishing) {
      try {
        const parentLink = await db.studentParent.findFirst({
          where: { studentId, isPrimary: true },
          select: { parentId: true },
        });

        if (parentLink?.parentId) {
          const notifyUserId = await getParentUserId(parentLink.parentId);
          if (notifyUserId) {
            await db.notification.create({
              data: {
                userId: notifyUserId,
                title: `Daily Update - ${student.firstName} ${student.lastName}`,
                message: `Today's update is now available`,
                type: 'DAILY_UPDATE',
                actionUrl: `/parent/daily-updates?student=${studentId}&date=${date}`,
              },
            });
          }
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the save if notification fails
      }
    }

    return NextResponse.json(
      {
        message: 'Daily update saved successfully',
        dailyUpdate,
      },
      { status: existingUpdate ? 200 : 201 }
    );
  } catch (error) {
    console.error('Save daily update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
