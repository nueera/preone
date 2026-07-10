import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const PLANS = [
  { name: 'Starter', price: '₹1,999', period: '/month', students: 50, features: ['Basic Dashboard', 'Student Management', 'Attendance'] },
  { name: 'Professional', price: '₹4,999', period: '/month', students: 200, features: ['AI Insights', 'WhatsApp', 'Growth Passport', 'Custom Branding'] },
  { name: 'Enterprise', price: '₹9,999', period: '/month', students: 'Unlimited', features: ['Everything in Pro', 'API Access', 'Dedicated Support', 'Custom Integrations'] },
];

async function resolveSchoolId(authSchoolId: string | null | undefined): Promise<string | null> {
  if (authSchoolId) return authSchoolId;
  const firstSchool = await db.school.findFirst();
  return firstSchool?.id || null;
}

function getSetting(settingsMap: Map<string, string>, key: string, defaultValue: string): string {
  return settingsMap.get(key) || defaultValue;
}

function getJsonSetting<T>(settingsMap: Map<string, string>, key: string, defaultValue: T): T {
  const raw = settingsMap.get(key);
  if (!raw) return defaultValue;
  try { return JSON.parse(raw); } catch { return defaultValue; }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const schoolId = await resolveSchoolId(authResult.schoolId);
    if (!schoolId) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    const BILLING_KEYS = ['billing_plan', 'billing_date', 'billing_invoices', 'billing_ai_analyses', 'billing_whatsapp_msgs', 'billing_storage_gb'] as const;

    const [settings, studentCount, teacherCount] = await Promise.all([
      db.schoolSetting.findMany({
        where: { schoolId, key: { in: [...BILLING_KEYS] } },
      }),
      db.student.count({
        where: { branch: { schoolId } },
      }),
      db.teacher.count({
        where: { branch: { schoolId } },
      }),
    ]);

    const settingsMap = new Map<string, string>();
    for (const s of settings) {
      settingsMap.set(s.key, s.value);
    }

    const currentPlanName = getSetting(settingsMap, 'billing_plan', 'Professional');
    const billingDate = getSetting(settingsMap, 'billing_date', 'July 1, 2026');
    const invoices = getJsonSetting<Array<{ id: string; month: string; amount: string; status: string; date: string }>>(settingsMap, 'billing_invoices', [
      { id: '1', month: 'June 2026', amount: '₹4,999', status: 'PAID', date: '2026-06-01' },
      { id: '2', month: 'May 2026', amount: '₹4,999', status: 'PAID', date: '2026-05-01' },
      { id: '3', month: 'April 2026', amount: '₹4,999', status: 'PAID', date: '2026-04-01' },
      { id: '4', month: 'March 2026', amount: '₹4,999', status: 'PAID', date: '2026-03-01' },
    ]);
    const aiAnalyses = parseInt(getSetting(settingsMap, 'billing_ai_analyses', '45'));
    const whatsappMsgs = parseInt(getSetting(settingsMap, 'billing_whatsapp_msgs', '234'));
    const storageGb = parseFloat(getSetting(settingsMap, 'billing_storage_gb', '2.1'));

    const currentPlan = PLANS.find(p => p.name === currentPlanName) || PLANS[1];

    return NextResponse.json({
      currentPlan: {
        name: currentPlan.name,
        price: currentPlan.price,
        period: currentPlan.period,
        billingDate,
        features: currentPlan.features,
      },
      usage: [
        { label: 'Students', used: studentCount, limit: typeof currentPlan.students === 'number' ? currentPlan.students : 999999, color: 'text-purple-700' },
        { label: 'Teachers', used: teacherCount, limit: 20, color: 'text-blue-700' },
        { label: 'AI Analyses', used: aiAnalyses, limit: 100, color: 'text-emerald-700' },
        { label: 'WhatsApp Messages', used: whatsappMsgs, limit: 500, color: 'text-amber-700' },
        { label: 'Storage', used: storageGb, limit: 5, unit: 'GB', color: 'text-red-700' },
      ],
      plans: PLANS.map(p => ({
        ...p,
        current: p.name === currentPlanName,
      })),
      invoices,
    });
  } catch (error) {
    console.error('Get billing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
