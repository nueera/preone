import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/reports/students — Student Directory report
export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId') || '';
    const status = searchParams.get('status') || 'ACTIVE';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (classId) where.classId = classId;

    const students = await db.student.findMany({
      where,
      include: {
        class: { select: { name: true, section: true } },
        branch: { select: { name: true } },
        parents: {
          include: {
            parent: { select: { firstName: true, lastName: true, phone: true, email: true, relation: true } },
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return NextResponse.json({
      summary: {
        totalStudents: students.length,
        active: students.filter(s => s.status === 'ACTIVE').length,
        inactive: students.filter(s => s.status === 'INACTIVE').length,
        graduated: students.filter(s => s.status === 'GRADUATED').length,
      },
      records: students.map(s => {
        const primaryParent = s.parents.find(p => p.isPrimary)?.parent;
        return {
          name: `${s.firstName} ${s.lastName}`,
          rollNumber: s.rollNumber || '-',
          className: s.class?.name || '-',
          section: s.class?.section || '-',
          branch: s.branch?.name || '-',
          gender: s.gender,
          dob: s.dob ? new Date(s.dob).toISOString().split('T')[0] : '-',
          bloodGroup: s.bloodGroup || '-',
          admissionDate: new Date(s.admissionDate).toISOString().split('T')[0],
          status: s.status,
          parentName: primaryParent ? `${primaryParent.firstName} ${primaryParent.lastName}` : '-',
          parentPhone: primaryParent?.phone || '-',
          parentEmail: primaryParent?.email || '-',
          parentRelation: primaryParent?.relation || '-',
        };
      }),
    });
  } catch (error) {
    console.error('Student directory report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
