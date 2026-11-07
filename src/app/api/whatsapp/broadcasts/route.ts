import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

async function resolveSchoolId(authSchoolId: string | null | undefined): Promise<string | null> {
  if (authSchoolId) return authSchoolId;
  const firstSchool = await db.school.findFirst();
  return firstSchool?.id || null;
}

// GET /api/whatsapp/broadcasts — list broadcast lists for the school
export async function GET(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const schoolId = await resolveSchoolId(authResult.schoolId);
    if (!schoolId) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    const broadcastLists = await db.broadcastList.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ broadcastLists });
  } catch (error) {
    console.error('List broadcast lists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/whatsapp/broadcasts — create a broadcast list
export async function POST(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const schoolId = await resolveSchoolId(authResult.schoolId);
    if (!schoolId) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, recipientCount } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 });
    }

    const broadcastList = await db.broadcastList.create({
      data: {
        schoolId,
        name: name.trim(),
        recipientCount: recipientCount ? parseInt(recipientCount) : 0,
      },
    });

    try {
      await auditLog.create({
        action: 'CREATE',
        entity: 'BroadcastList',
        entityId: broadcastList.id,
        userId: authResult.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        details: { name: broadcastList.name },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json({ message: 'Broadcast list created successfully', broadcastList }, { status: 201 });
  } catch (error) {
    console.error('Create broadcast list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
