import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

const SETTING_KEY = 'permissions_matrix';

const PERMISSION_KEYS = [
  'dashboard.view', 'dashboard.analytics',
  'students.view', 'students.create', 'students.edit', 'students.delete', 'students.import',
  'teachers.view', 'teachers.create', 'teachers.edit', 'teachers.delete',
  'attendance.view', 'attendance.mark', 'attendance.reports',
  'fees.view', 'fees.collect', 'fees.invoices', 'fees.reports',
  'crm.view', 'crm.leads', 'crm.pipeline',
  'growth.view', 'growth.observations', 'growth.reports',
  'comm.view', 'comm.send', 'comm.templates',
  'settings.view', 'settings.edit', 'settings.users', 'settings.roles',
  'system.monitoring', 'system.audit', 'system.errors',
];

function defaultPermissionsFor(role: string): Record<string, boolean> {
  if (role === 'Super Admin') return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true]));
  if (role === 'Admin') return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, !k.startsWith('system.')]));
  if (role === 'Task Master') return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, k.startsWith('dashboard.') || k.startsWith('crm.') || k === 'comm.view' || k === 'comm.send']));
  return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, k.startsWith('dashboard.') || k.startsWith('students.view') || k.startsWith('attendance.') || k.startsWith('growth.') || k === 'comm.view' || k === 'comm.send' || k === 'fees.view']));
}

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  'Super Admin': defaultPermissionsFor('Super Admin'),
  'Admin': defaultPermissionsFor('Admin'),
  'Task Master': defaultPermissionsFor('Task Master'),
  'Teacher': defaultPermissionsFor('Teacher'),
};

const permissionsSchema = z.record(z.string(), z.record(z.string(), z.boolean()));

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
      return NextResponse.json(DEFAULT_PERMISSIONS);
    }

    try {
      return NextResponse.json(JSON.parse(setting.value));
    } catch {
      return NextResponse.json(DEFAULT_PERMISSIONS);
    }
  } catch (error) {
    console.error('Get permissions settings error:', error);
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
    const parsed = permissionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid permissions data', details: parsed.error.flatten() }, { status: 400 });
    }

    const value = JSON.stringify(parsed.data);

    try {
      await db.schoolSetting.upsert({
        where: { schoolId_key: { schoolId, key: SETTING_KEY } },
        update: { value },
        create: { schoolId, key: SETTING_KEY, value },
      });
    } catch (dbError) {
      console.error('Save permissions settings error:', dbError);
      return NextResponse.json({ error: 'Failed to save permissions settings' }, { status: 500 });
    }

    try {
      await auditLog.create({
        action: 'UPDATE',
        entity: 'SchoolSetting',
        entityId: SETTING_KEY,
        userId: authResult.userId,
        details: { key: SETTING_KEY },
      });
    } catch (auditError) {
      console.error('Audit log error (permissions):', auditError);
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error('Update permissions settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
