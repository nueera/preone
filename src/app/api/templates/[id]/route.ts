import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

async function resolveSchoolId(authSchoolId: string | null | undefined): Promise<string | null> {
  if (authSchoolId) return authSchoolId;
  const firstSchool = await db.school.findFirst();
  return firstSchool?.id || null;
}

// GET /api/templates/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const template = await db.messageTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/templates/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const existing = await db.messageTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, category, channel, subject, body: templateBody, variables, isDefault } = body;

    const template = await db.messageTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(channel !== undefined ? { channel } : {}),
        ...(subject !== undefined ? { subject: subject?.trim() || null } : {}),
        ...(templateBody !== undefined ? { body: templateBody.trim() } : {}),
        ...(variables !== undefined ? { variables: Array.isArray(variables) ? variables : [] } : {}),
        ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
      },
    });

    try {
      await auditLog.update({
        entity: 'MessageTemplate',
        entityId: id,
        userId: authResult.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        oldValues: existing,
        newValues: template,
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json({ message: 'Template updated successfully', template });
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/templates/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const existing = await db.messageTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await db.messageTemplate.delete({ where: { id } });

    try {
      await auditLog.create({
        action: 'DELETE',
        entity: 'MessageTemplate',
        entityId: id,
        userId: authResult.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        details: { name: existing.name },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
