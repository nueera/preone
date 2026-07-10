import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

const SETTING_KEY = 'roles_config';

const DEFAULT_ROLES = [
  { id: '1', name: 'Super Admin', description: 'Full system access with all permissions', userCount: 1, isSystem: true, permissions: { dashboard: true, students: true, teachers: true, attendance: true, fees: true, crm: true, growth: true, communication: true, reports: true, settings: true, system: true } },
  { id: '2', name: 'Admin', description: 'Full access except system settings', userCount: 2, isSystem: true, permissions: { dashboard: true, students: true, teachers: true, attendance: true, fees: true, crm: true, growth: true, communication: true, reports: true, settings: true, system: false } },
  { id: '3', name: 'Task Master', description: 'CRM and dashboard access only', userCount: 1, isSystem: false, permissions: { dashboard: true, students: false, teachers: false, attendance: false, fees: false, crm: true, growth: false, communication: true, reports: false, settings: false, system: false } },
  { id: '4', name: 'Teacher', description: 'Class and student management', userCount: 4, isSystem: false, permissions: { dashboard: true, students: true, teachers: false, attendance: true, fees: false, crm: false, growth: true, communication: true, reports: true, settings: false, system: false } },
];

const roleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  userCount: z.number(),
  isSystem: z.boolean(),
  permissions: z.record(z.string(), z.boolean()),
});

const rolesSchema = z.array(roleSchema);

async function resolveSchoolId(authSchoolId: string | null | undefined): Promise<string | null> {
  if (authSchoolId) return authSchoolId;
  const firstSchool = await db.school.findFirst();
  return firstSchool?.id || null;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const schoolId = await resolveSchoolId(authResult.schoolId);
    if (!schoolId) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    const setting = await db.schoolSetting.findUnique({
      where: { schoolId_key: { schoolId, key: SETTING_KEY } },
    });

    if (!setting) {
      return NextResponse.json({ roles: DEFAULT_ROLES });
    }

    try {
      return NextResponse.json({ roles: JSON.parse(setting.value) });
    } catch {
      return NextResponse.json({ roles: DEFAULT_ROLES });
    }
  } catch (error) {
    console.error('Get roles settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const schoolId = await resolveSchoolId(authResult.schoolId);
    if (!schoolId) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = rolesSchema.safeParse(body?.roles);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid roles data', details: parsed.error.flatten() }, { status: 400 });
    }

    const value = JSON.stringify(parsed.data);

    try {
      await db.schoolSetting.upsert({
        where: { schoolId_key: { schoolId, key: SETTING_KEY } },
        update: { value },
        create: { schoolId, key: SETTING_KEY, value },
      });
    } catch (dbError) {
      console.error('Save roles settings error:', dbError);
      return NextResponse.json({ error: 'Failed to save roles settings' }, { status: 500 });
    }

    try {
      await auditLog.create({
        action: 'UPDATE',
        entity: 'SchoolSetting',
        entityId: SETTING_KEY,
        userId: authResult.userId,
        details: { key: SETTING_KEY, count: parsed.data.length },
      });
    } catch (auditError) {
      console.error('Audit log error (roles):', auditError);
    }

    return NextResponse.json({ roles: parsed.data });
  } catch (error) {
    console.error('Update roles settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
