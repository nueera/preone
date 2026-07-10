import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

async function resolveSchoolId(authSchoolId: string | null | undefined): Promise<string | null> {
  if (authSchoolId) return authSchoolId;
  const firstSchool = await db.school.findFirst();
  return firstSchool?.id || null;
}

// GET /api/templates — list message templates for the school, optional ?channel= / ?category= filter
export async function GET(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const schoolId = await resolveSchoolId(authResult.schoolId);
    if (!schoolId) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    const channel = request.nextUrl.searchParams.get('channel');
    const category = request.nextUrl.searchParams.get('category');

    const templates = await db.messageTemplate.findMany({
      where: {
        schoolId,
        ...(channel ? { channel } : {}),
        ...(category && category !== 'all' ? { category } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/templates — create a message template
export async function POST(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const schoolId = await resolveSchoolId(authResult.schoolId);
    if (!schoolId) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, category, channel, subject, body: templateBody, variables, isDefault } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (!channel) {
      return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
    }
    if (!templateBody || !templateBody.trim()) {
      return NextResponse.json({ error: 'Template body is required' }, { status: 400 });
    }

    const template = await db.messageTemplate.create({
      data: {
        schoolId,
        name: name.trim(),
        category,
        channel,
        subject: subject?.trim() || null,
        body: templateBody.trim(),
        variables: Array.isArray(variables) ? variables : [],
        isDefault: Boolean(isDefault),
      },
    });

    try {
      await auditLog.create({
        action: 'CREATE',
        entity: 'MessageTemplate',
        entityId: template.id,
        userId: authResult.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        details: { name: template.name, category, channel },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json({ message: 'Template created successfully', template }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
