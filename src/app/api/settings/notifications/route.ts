import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// Notification config key mapping
const SMS_KEYS = ['notif_sms_provider', 'notif_sms_api_key', 'notif_sms_sender_id'] as const;
const WHATSAPP_KEYS = ['notif_whatsapp_provider', 'notif_whatsapp_api_key', 'notif_whatsapp_template_id'] as const;
const EMAIL_KEYS = ['notif_email_host', 'notif_email_port', 'notif_email_username', 'notif_email_password', 'notif_email_from_name'] as const;
const PUSH_KEYS = ['notif_push_project_id', 'notif_push_server_key'] as const;
const MATRIX_KEYS = ['notif_matrix'] as const;

const ALL_NOTIF_KEYS = [...SMS_KEYS, ...WHATSAPP_KEYS, ...EMAIL_KEYS, ...PUSH_KEYS, ...MATRIX_KEYS] as const;

// Helper to strip prefix and convert to camelCase field name
function keyToField(key: string): string {
  // notif_sms_provider -> provider, notif_sms_api_key -> apiKey, notif_email_from_name -> fromName
  const parts = key.replace('notif_', '').split('_');
  // parts[0] is the group (sms, whatsapp, email, push, matrix)
  const fieldParts = parts.slice(1);
  if (fieldParts.length === 0) return parts[0]; // e.g. "matrix"
  return fieldParts[0] + fieldParts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

// Helper to resolve schoolId
async function resolveSchoolId(authSchoolId: string | null | undefined): Promise<string | null> {
  if (authSchoolId) return authSchoolId;
  const firstSchool = await db.school.findFirst();
  return firstSchool?.id || null;
}

// GET /api/settings/notifications — Return notification config grouped by channel
export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUser(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const schoolId = await resolveSchoolId(authResult.schoolId);
    if (!schoolId) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    // Fetch all notification settings for this school
    const settings = await db.schoolSetting.findMany({
      where: {
        schoolId,
        key: { in: [...ALL_NOTIF_KEYS] },
      },
    });

    // Create a map for quick lookup
    const settingsMap = new Map<string, string>();
    for (const s of settings) {
      settingsMap.set(s.key, s.value);
    }

    // Build grouped response
    const sms: Record<string, string> = {};
    for (const key of SMS_KEYS) {
      const field = keyToField(key);
      sms[field] = settingsMap.get(key) || '';
    }

    const whatsapp: Record<string, string> = {};
    for (const key of WHATSAPP_KEYS) {
      const field = keyToField(key);
      whatsapp[field] = settingsMap.get(key) || '';
    }

    const email: Record<string, string> = {};
    for (const key of EMAIL_KEYS) {
      const field = keyToField(key);
      email[field] = settingsMap.get(key) || '';
    }

    const push: Record<string, string> = {};
    for (const key of PUSH_KEYS) {
      const field = keyToField(key);
      push[field] = settingsMap.get(key) || '';
    }

    // Matrix is a JSON string
    const matrixRaw = settingsMap.get('notif_matrix') || '';
    let matrix: unknown = null;
    if (matrixRaw) {
      try {
        matrix = JSON.parse(matrixRaw);
      } catch {
        matrix = matrixRaw;
      }
    }

    return NextResponse.json({
      notifications: {
        sms,
        whatsapp,
        email,
        push,
        matrix,
      },
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/settings/notifications — Save notification config
export async function PATCH(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const schoolId = await resolveSchoolId(authResult.schoolId);
    if (!schoolId) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    const body = await request.json();
    const { sms, whatsapp, email, push, matrix } = body as {
      sms?: Record<string, string>;
      whatsapp?: Record<string, string>;
      email?: Record<string, string>;
      push?: Record<string, string>;
      matrix?: unknown;
    };

    // Flatten groups into key-value pairs
    const flatSettings: { key: string; value: string }[] = [];

    if (sms) {
      for (const key of SMS_KEYS) {
        const field = keyToField(key);
        if (sms[field] !== undefined) {
          flatSettings.push({ key, value: String(sms[field]) });
        }
      }
    }

    if (whatsapp) {
      for (const key of WHATSAPP_KEYS) {
        const field = keyToField(key);
        if (whatsapp[field] !== undefined) {
          flatSettings.push({ key, value: String(whatsapp[field]) });
        }
      }
    }

    if (email) {
      for (const key of EMAIL_KEYS) {
        const field = keyToField(key);
        if (email[field] !== undefined) {
          flatSettings.push({ key, value: String(email[field]) });
        }
      }
    }

    if (push) {
      for (const key of PUSH_KEYS) {
        const field = keyToField(key);
        if (push[field] !== undefined) {
          flatSettings.push({ key, value: String(push[field]) });
        }
      }
    }

    if (matrix !== undefined) {
      const matrixValue = typeof matrix === 'string' ? matrix : JSON.stringify(matrix);
      flatSettings.push({ key: 'notif_matrix', value: matrixValue });
    }

    // Upsert each setting
    const upserts = flatSettings.map(({ key, value }) =>
      db.schoolSetting.upsert({
        where: {
          schoolId_key: { schoolId, key },
        },
        update: { value },
        create: { schoolId, key, value },
      })
    );

    await Promise.all(upserts);

    return NextResponse.json({
      message: 'Notification settings saved successfully',
      updatedCount: upserts.length,
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
