import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateErrorSchema = z.object({
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'IGNORED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  resolutionNote: z.string().optional(),
  fixVersion: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, user) => {
    if (!['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const errorLog = await prisma.errorLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    if (!errorLog) {
      return NextResponse.json({ error: 'Error not found' }, { status: 404 });
    }

    return NextResponse.json({ error: errorLog });
  })(req, { params } as any);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, user) => {
    if (!['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const data = updateErrorSchema.parse(body);
    const { id } = await params;

    const updateData: any = { ...data };

    if (data.status === 'RESOLVED') {
      updateData.resolvedBy = user.id;
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.errorLog.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ error: updated });
  })(req, { params } as any);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, user) => {
    if (!['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.errorLog.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  })(req, { params } as any);
}
