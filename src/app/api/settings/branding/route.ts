import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

const SETTING_KEY = 'branding_config';

const DEFAULT_BRANDING = {
  primaryColor: '#7C3AED',
  secondaryColor: '#0EA5E9',
  accentColor: '#F97316',
  schoolName: 'PreOne Preschool',
  tagline: 'Where little minds grow',
  customCSS: `/* Custom CSS */\n.hero-gradient {\n  background: linear-gradient(135deg, #7C3AED, #0EA5E9);\n}`,
};

const brandingSchema = z.object({
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  accentColor: z.string().min(1),
  schoolName: z.string().min(1),
  tagline: z.string(),
  customCSS: z.string(),
});

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
      return NextResponse.json(DEFAULT_BRANDING);
    }

    try {
      return NextResponse.json({ ...DEFAULT_BRANDING, ...JSON.parse(setting.value) });
    } catch {
      return NextResponse.json(DEFAULT_BRANDING);
    }
  } catch (error) {
    console.error('Get branding settings error:', error);
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
    const parsed = brandingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid branding data', details: parsed.error.flatten() }, { status: 400 });
    }

    const value = JSON.stringify(parsed.data);

    try {
      await db.schoolSetting.upsert({
        where: { schoolId_key: { schoolId, key: SETTING_KEY } },
        update: { value },
        create: { schoolId, key: SETTING_KEY, value },
      });
    } catch (dbError) {
      console.error('Save branding settings error:', dbError);
      return NextResponse.json({ error: 'Failed to save branding settings' }, { status: 500 });
    }

    try {
      await auditLog.create({
        action: 'UPDATE',
        entity: 'SchoolSetting',
        entityId: SETTING_KEY,
        userId: authResult.userId,
        details: { key: SETTING_KEY, value: parsed.data },
      });
    } catch (auditError) {
      console.error('Audit log error (branding):', auditError);
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error('Update branding settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
