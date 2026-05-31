import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, branchFilter } from '@/lib/auth';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  meta?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const branchId = request.nextUrl.searchParams.get('branchId') || user.branchId;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    // Apply branch isolation: if user has branchId and no explicit branchId param, use user's
    const effectiveBranchId = branchId || (user.branchId ? user.branchId : undefined);
    const bf = effectiveBranchId ? { branchId: effectiveBranchId } : branchFilter(user);

    const activities: ActivityItem[] = [];

    // Recent student enrollments
    const recentStudents = await db.student.findMany({
      where: bf,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        createdAt: true,
      },
    });

    for (const s of recentStudents) {
      activities.push({
        id: `student-${s.id}`,
        type: 'student_enrollment',
        title: 'New Student Enrolled',
        description: `${s.firstName} ${s.lastName} (${s.admissionNo || 'No Adm No'}) enrolled`,
        timestamp: s.createdAt,
        meta: { studentId: s.id },
      });
    }

    // Recent payments
    const recentPayments = await db.payment.findMany({
      where: { status: 'Success' },
      orderBy: { paidAt: 'desc' },
      take: 5,
      include: {
        invoice: {
          select: {
            student: { select: { firstName: true, lastName: true } },
            branchId: true,
          },
        },
      },
    });

    const filteredPayments = effectiveBranchId
      ? recentPayments.filter(p => p.invoice.branchId === effectiveBranchId)
      : recentPayments;

    for (const p of filteredPayments) {
      activities.push({
        id: `payment-${p.id}`,
        type: 'payment_received',
        title: 'Payment Received',
        description: `₹${p.amount} from ${p.paidByName || `${p.invoice.student.firstName} ${p.invoice.student.lastName}`} via ${p.paymentMethod}`,
        timestamp: p.paidAt,
        meta: { paymentId: p.id, amount: p.amount, method: p.paymentMethod },
      });
    }

    // Recent leads
    const recentLeads = await db.lead.findMany({
      where: bf,
      orderBy: { createdAt: 'desc' },
      take: 5,
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
        id: `lead-${l.id}`,
        type: 'new_lead',
        title: 'New Admission Inquiry',
        description: `${l.parentName} inquired for ${l.childName} via ${l.source}`,
        timestamp: l.createdAt,
        meta: { leadId: l.id, stage: l.stage },
      });
    }

    // Recent attendance entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await db.studentAttendance.findMany({
      where: { date: { gte: today } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        student: { select: { firstName: true, lastName: true, branchId: true } },
      },
    });

    const filteredAttendance = effectiveBranchId
      ? todayAttendance.filter(a => a.student.branchId === effectiveBranchId)
      : todayAttendance;

    for (const a of filteredAttendance) {
      activities.push({
        id: `attendance-${a.id}`,
        type: 'attendance_marked',
        title: 'Attendance Marked',
        description: `${a.student.firstName} ${a.student.lastName} marked as ${a.status}`,
        timestamp: a.createdAt,
        meta: { status: a.status, method: a.method },
      });
    }

    // Recent announcements
    const recentAnnouncements = await db.announcement.findMany({
      where: {
        isActive: true,
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : branchFilter(user)),
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    for (const a of recentAnnouncements) {
      activities.push({
        id: `announcement-${a.id}`,
        type: 'announcement',
        title: a.title,
        description: a.content.substring(0, 100) + (a.content.length > 100 ? '...' : ''),
        timestamp: a.createdAt,
        meta: { priority: a.priority, type: a.type },
      });
    }

    // Sort all activities by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      activities: activities.slice(0, limit),
      total: activities.length,
    });
  } catch (error) {
    console.error('Dashboard activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
