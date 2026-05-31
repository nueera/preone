import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/parent/dashboard — Parent dashboard data
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.role !== 'Parent') {
      return NextResponse.json({ error: 'Access denied. Parent role required.' }, { status: 403 });
    }

    // Find the Parent record linked to this user
    const parent = await db.parent.findUnique({
      where: { userId: authUser.userId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    // Get all children of this parent
    const studentParents = await db.studentParent.findMany({
      where: { parentId: parent.id },
      include: {
        student: {
          include: {
            class: {
              include: {
                program: {
                  select: { id: true, name: true, code: true, color: true, icon: true },
                },
              },
            },
          },
        },
      },
    });

    const children = studentParents.map((sp) => ({
      id: sp.student.id,
      firstName: sp.student.firstName,
      lastName: sp.student.lastName,
      admissionNo: sp.student.admissionNo,
      photo: sp.student.photo,
      status: sp.student.status,
      class: sp.student.class
        ? {
            id: sp.student.class.id,
            name: sp.student.class.name,
            program: sp.student.class.program,
          }
        : null,
      isPrimary: sp.isPrimary,
    }));

    const childIds = children.map((c) => c.id);

    if (childIds.length === 0) {
      return NextResponse.json({
        children: [],
        recentDailyUpdates: [],
        upcomingFees: [],
        announcements: [],
        attendanceSummary: { present: 0, absent: 0, late: 0, halfDay: 0, excused: 0, total: 0 },
      });
    }

    // Recent daily updates (last 5 published)
    const recentDailyUpdates = await db.dailyUpdate.findMany({
      where: {
        studentId: { in: childIds },
        status: 'Published',
      },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, photo: true },
        },
      },
    });

    // Upcoming fees (pending/overdue invoices)
    const upcomingFees = await db.invoice.findMany({
      where: {
        studentId: { in: childIds },
        status: { in: ['Pending', 'Overdue', 'Partial'] },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
        feeStructure: {
          select: { id: true, name: true, feeType: true, frequency: true },
        },
      },
    });

    // Announcements for parents
    const classIds = children
      .map((c) => c.class?.id)
      .filter((id): id is string => !!id);

    const announcementOrConditions: Record<string, unknown>[] = [
      { targetAudience: 'All' },
      { targetAudience: 'Parents' },
    ];

    if (classIds.length > 0) {
      announcementOrConditions.push(
        ...classIds.map((classId) => ({
          targetAudience: 'SpecificClass',
          classId,
        }))
      );
    }

    const announcements = await db.announcement.findMany({
      where: {
        isActive: true,
        publishedAt: { not: null },
        OR: announcementOrConditions,
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        priority: true,
        publishedAt: true,
        image: true,
      },
    });

    // Attendance summary for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        studentId: { in: childIds },
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: { status: true },
    });

    const attendanceSummary = {
      present: attendanceRecords.filter((a) => a.status === 'Present').length,
      absent: attendanceRecords.filter((a) => a.status === 'Absent').length,
      late: attendanceRecords.filter((a) => a.status === 'Late').length,
      halfDay: attendanceRecords.filter((a) => a.status === 'HalfDay').length,
      excused: attendanceRecords.filter((a) => a.status === 'Excused').length,
      total: attendanceRecords.length,
    };

    return NextResponse.json({
      children,
      recentDailyUpdates,
      upcomingFees,
      announcements,
      attendanceSummary,
    });
  } catch (error) {
    console.error('Parent dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
