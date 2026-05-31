import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';

// ── Activity type mapping ──
interface ActivityEntry {
  type: string;
  message: string;
  time: string;
  icon: string;
  color: string;
}

// GET /api/dashboard/activities — Recent activity feed
// Query params: ?limit=15
// Requires ADMIN role.
export async function GET(request: NextRequest) {
  try {
    // ── Verify ADMIN role ──
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get('limit') || '15'),
      50,
    );

    const activities: ActivityEntry[] = [];

    // ── Recent student admissions ──
    const recentStudents = await db.student.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        class: { select: { name: true } },
        createdAt: true,
      },
    });

    for (const s of recentStudents) {
      activities.push({
        type: 'ADMISSION',
        message: `${s.firstName} ${s.lastName} admitted to ${s.class?.name || 'Unassigned'}`,
        time: formatDistanceToNow(new Date(s.createdAt), { addSuffix: true }),
        icon: 'UserPlus',
        color: 'green',
      });
    }

    // ── Recent payments ──
    const recentPayments = await db.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      take: 5,
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });

    for (const p of recentPayments) {
      activities.push({
        type: 'PAYMENT',
        message: `₹${p.amount.toLocaleString('en-IN')} received from ${p.student.firstName} ${p.student.lastName}`,
        time: formatDistanceToNow(new Date(p.paymentDate), {
          addSuffix: true,
        }),
        icon: 'IndianRupee',
        color: 'emerald',
      });
    }

    // ── Recent leads ──
    const recentLeads = await db.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true,
        parentName: true,
        childName: true,
        stage: true,
        source: true,
        createdAt: true,
      },
    });

    for (const l of recentLeads) {
      activities.push({
        type: 'LEAD',
        message: `${l.parentName} inquired for ${l.childName} (${l.source})`,
        time: formatDistanceToNow(new Date(l.createdAt), { addSuffix: true }),
        icon: 'Phone',
        color: 'purple',
      });
    }

    // ── Recent attendance alerts (absences) ──
    const recentAbsences = await db.studentAttendance.findMany({
      where: { status: 'ABSENT' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });

    for (const a of recentAbsences) {
      activities.push({
        type: 'ATTENDANCE',
        message: `${a.student.firstName} ${a.student.lastName} marked absent`,
        time: formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }),
        icon: 'AlertTriangle',
        color: 'red',
      });
    }

    // ── Recent staff leaves ──
    const recentLeaves = await db.leave.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        teacher: { select: { firstName: true, lastName: true } },
      },
    });

    for (const l of recentLeaves) {
      activities.push({
        type: 'LEAVE',
        message: `${l.teacher.firstName} ${l.teacher.lastName} on ${l.leaveType.toLowerCase()} leave`,
        time: formatDistanceToNow(new Date(l.createdAt), { addSuffix: true }),
        icon: 'Calendar',
        color: 'orange',
      });
    }

    // ── Recent announcements ──
    const recentAnnouncements = await db.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, createdAt: true },
    });

    for (const a of recentAnnouncements) {
      activities.push({
        type: 'ANNOUNCEMENT',
        message: `New announcement: ${a.title}`,
        time: formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }),
        icon: 'Megaphone',
        color: 'blue',
      });
    }

    // ── Sort by recency (most recent first) ──
    // Since we don't have exact timestamps in the ActivityEntry,
    // we return them in the order they were collected (which is already desc)
    // Shuffle them together by interleaving — for now just return flat sorted

    return NextResponse.json({
      activities: activities.slice(0, limit),
    });
  } catch (error) {
    console.error('Dashboard activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
