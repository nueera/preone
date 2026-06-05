import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const bulkActionSchema = z.object({
  errorIds: z.array(z.string()).min(1),
  action: z.enum(['acknowledge', 'resolve', 'ignore', 'delete']),
  resolutionNote: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return withAuth(async (req, user) => {
    if (!['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { errorIds, action, resolutionNote } = bulkActionSchema.parse(await req.json());

    switch (action) {
      case 'acknowledge':
        await prisma.errorLog.updateMany({
          where: { id: { in: errorIds } },
          data: { status: 'ACKNOWLEDGED' },
        });
        break;

      case 'resolve':
        await prisma.errorLog.updateMany({
          where: { id: { in: errorIds } },
          data: {
            status: 'RESOLVED',
            resolvedBy: user.id,
            resolvedAt: new Date(),
            resolutionNote: resolutionNote || 'Bulk resolved',
          },
        });
        break;

      case 'ignore':
        await prisma.errorLog.updateMany({
          where: { id: { in: errorIds } },
          data: { status: 'IGNORED' },
        });
        break;

      case 'delete':
        await prisma.errorLog.deleteMany({
          where: { id: { in: errorIds } },
        });
        break;
    }

    return NextResponse.json({ success: true, action, count: errorIds.length });
  })(req, {} as any);
}
