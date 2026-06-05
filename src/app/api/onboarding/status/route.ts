import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/onboarding/status — Returns school onboarding status and list of sessions
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const school = await db.school.findFirst({ where: { id: payload.schoolId } });
    if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });

    const sessions = await db.onboardingDraft.findMany({
      where: { schoolId: school.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      onboardingComplete: school.onboardingComplete,
      sessions,
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
