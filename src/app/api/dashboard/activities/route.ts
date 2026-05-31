import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
}

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    const activities: ActivityItem[] = [];

    // Recent student enrollments
    const recentStudents = await db.student.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        createdAt: true,
      },
    });

    for (const s of recentStudents) {
      activities.push({
        id: `student-${s.id}`,
        type: 'student_enrollment',
        title: 'New Student Enrolled',
        description: `${s.firstName} ${s.lastName} (${s.rollNumber || 'New'}) enrolled`,
        timestamp: s.createdAt,
      });
    }

    // Recent payments
    const recentPayments = await db.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      take: 5,
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });

    for (const p of recentPayments) {
      activities.push({
        id: `payment-${p.id}`,
        type: 'payment_received',
        title: 'Payment Received',
        description: `₹${p.amount} from ${p.student.firstName} ${p.student.lastName} via ${p.method}`,
        timestamp: new Date(p.paymentDate),
      });
    }

    // Recent leads
    const recentLeads = await db.lead.findMany({
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
      });
    }

    // Recent announcements
    const recentAnnouncements = await db.announcement.findMany({
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
