// ============================================================
// PreOne — GET /api/parent/dashboard
// Parent dashboard data for selected child
// Query params: childId (required if parent has multiple children)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError, verifyChildAccess } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const { parent, children, childIds } = auth;

    // Determine which child to show data for
    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    // If childId specified, verify access; otherwise use first child
    let activeChildIds = childIds;
    let activeChild = children[0];

    if (childId) {
      const accessError = verifyChildAccess(auth, childId);
      if (accessError) return accessError;
      activeChildIds = [childId];
      activeChild = children.find((c) => c.id === childId) || children[0];
    }

    if (childIds.length === 0) {
      return NextResponse.json({
        parent: {
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
          phone: parent.phone,
          relation: parent.relation,
        },
        selectedChild: null,
        todayUpdate: null,
        stats: {
          attendanceRate: 0,
          feesDue: 0,
          feesPaid: 0,
          feesOverdue: 0,
          growthOverall: 0,
          unacknowledgedObservations: 0,
        },
        nextFeeDue: null,
        recentAnnouncements: [],
        growthSnapshot: null,
        otherChildren: [],
      });
    }

    const targetChildId = activeChild.id;

    // ── Today's Daily Update (only PUBLISHED) ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayUpdate = await db.dailyUpdate.findFirst({
      where: {
        studentId: targetChildId,
        date: { gte: today, lte: todayEnd },
        status: 'PUBLISHED',
      },
    });

    // ── Attendance Rate (current month) ──
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        studentId: targetChildId,
        date: { gte: monthStart, lte: monthEnd },
      },
      select: { status: true },
    });

    const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const attendanceRate = attendanceRecords.length > 0
      ? Math.round((presentCount / attendanceRecords.length) * 100)
      : 0;

    // ── Fee Status ──
    const invoices = await db.invoice.findMany({
      where: { studentId: targetChildId },
      select: {
        id: true,
        invoiceNo: true,
        amount: true,
        discount: true,
        netAmount: true,
        status: true,
        dueDate: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const feesDue = invoices
      .filter((i) => i.status === 'PENDING' || i.status === 'PARTIAL')
      .reduce((sum, i) => sum + i.netAmount, 0);

    const feesPaid = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.netAmount, 0);

    const feesOverdue = invoices
      .filter((i) => i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.netAmount, 0);

    // Next fee due
    const nextPending = invoices.find(
      (i) => i.status === 'PENDING' || i.status === 'PARTIAL' || i.status === 'OVERDUE'
    );
    const nextFeeDue = nextPending
      ? {
          amount: nextPending.netAmount,
          dueDate: nextPending.dueDate.toISOString().split('T')[0],
          invoiceNo: nextPending.invoiceNo,
        }
      : null;

    // ── Growth Score ──
    const latestGrowth = await db.growthScore.findFirst({
      where: { studentId: targetChildId },
      orderBy: { createdAt: 'desc' },
    });

    const growthOverall = latestGrowth?.overall
      ? Math.round(latestGrowth.overall)
      : 0;

    const growthSnapshot = latestGrowth
      ? {
          period: latestGrowth.period,
          creativity: latestGrowth.creativity,
          communication: latestGrowth.communication,
          social: latestGrowth.social,
          confidence: latestGrowth.confidence,
          cognitive: latestGrowth.cognitive,
          physical: latestGrowth.physical,
          overall: Math.round(latestGrowth.overall || 0),
        }
      : null;

    // ── Unacknowledged Observations ──
    const unacknowledgedObservations = await db.observation.count({
      where: {
        studentId: targetChildId,
        isShared: true,
        parentAck: false,
      },
    });

    // ── Recent Announcements ──
    const activeChildClassId = activeChild.class?.id;
    const announcementWhere: Record<string, unknown>[] = [
      { target: 'ALL' },
      { target: 'PARENTS' },
    ];
    if (activeChildClassId) {
      announcementWhere.push({ target: 'CLASS', targetIds: activeChildClassId });
    }

    const recentAnnouncements = await db.announcement.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null },
        OR: announcementWhere,
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        publishedAt: true,
      },
    });

    // ── Other Children ──
    const otherChildren = children
      .filter((c) => c.id !== targetChildId)
      .map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        className: c.class?.name || null,
        photo: c.photo,
      }));

    // ── Build Response ──
    return NextResponse.json({
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        relation: parent.relation,
      },
      selectedChild: {
        id: activeChild.id,
        firstName: activeChild.firstName,
        lastName: activeChild.lastName,
        photo: activeChild.photo,
        rollNumber: activeChild.rollNumber,
        className: activeChild.class?.name || null,
        programName: activeChild.class?.program?.name || null,
        status: activeChild.status,
      },
      todayUpdate: todayUpdate
        ? {
            id: todayUpdate.id,
            breakfast: todayUpdate.breakfast,
            breakfastMenu: todayUpdate.breakfastMenu,
            lunch: todayUpdate.lunch,
            lunchMenu: todayUpdate.lunchMenu,
            snacks: todayUpdate.snacks,
            snacksMenu: todayUpdate.snacksMenu,
            sleepStart: todayUpdate.sleepStart,
            sleepEnd: todayUpdate.sleepEnd,
            sleepQuality: todayUpdate.sleepQuality,
            moodMorning: todayUpdate.moodMorning,
            moodAfternoon: todayUpdate.moodAfternoon,
            pottyCount: todayUpdate.pottyCount,
            pottyType: todayUpdate.pottyType,
            waterGlasses: todayUpdate.waterGlasses,
            highlights: todayUpdate.highlights,
            publishedAt: todayUpdate.publishedAt?.toISOString() || null,
          }
        : null,
      stats: {
        attendanceRate,
        feesDue,
        feesPaid,
        feesOverdue,
        growthOverall,
        unacknowledgedObservations,
      },
      nextFeeDue,
      recentAnnouncements: recentAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        priority: a.priority,
        publishedAt: a.publishedAt?.toISOString() || null,
      })),
      growthSnapshot,
      otherChildren,
    });
  } catch (error) {
    console.error('Parent dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
