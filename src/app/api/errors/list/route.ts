import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  return withAuth(async (req, user) => {
    if (!['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const schoolId = user.schoolId;

    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (status && status !== 'all') where.status = status;
    if (severity && severity !== 'all') where.severity = severity;
    if (source && source !== 'all') where.source = source;
    if (search) {
      where.message = { contains: search };
    }

    const [errors, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: [{ lastSeenAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.errorLog.count({ where }),
    ]);

    return NextResponse.json({
      errors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  })(req, {} as any);
}
