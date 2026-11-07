import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

const SETTING_KEY = 'integrations_config';

const DEFAULT_INTEGRATIONS = [
  { id: '1', name: 'WhatsApp Business API', description: 'Send messages, templates, and broadcasts via WhatsApp', status: 'CONNECTED' as const, apiKey: 'sk-whatsapp-****-****-abcd', lastSync: '5m ago' },
  { id: '2', name: 'Razorpay Payments', description: 'Process fee payments and manage subscriptions', status: 'CONNECTED' as const, apiKey: 'rzp_live_****-****-efgh', lastSync: '1h ago' },
  { id: '3', name: 'Google Workspace', description: 'Sync calendars and manage email', status: 'DISCONNECTED' as const },
  { id: '4', name: 'Webhook Service', description: 'Send real-time event notifications', status: 'ERROR' as const, webhookUrl: 'https://api.example.com/webhook', lastSync: '2d ago' },
];

const integrationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  status: z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR']),
  apiKey: z.string().optional(),
  webhookUrl: z.string().optional(),
  lastSync: z.string().optional(),
});

const integrationsSchema = z.array(integrationSchema);

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
      return NextResponse.json({ integrations: DEFAULT_INTEGRATIONS });
    }

    try {
      return NextResponse.json({ integrations: JSON.parse(setting.value) });
    } catch {
      return NextResponse.json({ integrations: DEFAULT_INTEGRATIONS });
    }
  } catch (error) {
    console.error('Get integrations settings error:', error);
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
    const parsed = integrationsSchema.safeParse(body?.integrations);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid integrations data', details: parsed.error.flatten() }, { status: 400 });
    }

    const value = JSON.stringify(parsed.data);

    try {
      await db.schoolSetting.upsert({
        where: { schoolId_key: { schoolId, key: SETTING_KEY } },
        update: { value },
        create: { schoolId, key: SETTING_KEY, value },
      });
    } catch (dbError) {
      console.error('Save integrations settings error:', dbError);
      return NextResponse.json({ error: 'Failed to save integrations settings' }, { status: 500 });
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
      console.error('Audit log error (integrations):', auditError);
    }

    return NextResponse.json({ integrations: parsed.data });
  } catch (error) {
    console.error('Update integrations settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
