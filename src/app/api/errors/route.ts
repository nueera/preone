import { NextRequest, NextResponse } from 'next/server';
import { logFrontendError } from '@/lib/error-logger';
import { z } from 'zod';

const frontendErrorSchema = z.object({
  message: z.string().min(1),
  stack: z.string().optional(),
  type: z.string().optional(),
  url: z.string().optional(),
  lineNumber: z.number().optional(),
  columnName: z.number().optional(),
  fileName: z.string().optional(),
  userId: z.string().optional(),
  userRole: z.string().optional(),
  schoolId: z.string().optional(),
  breadcrumbs: z.array(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Simple in-memory rate limiting
const errorReports = new Map<string, { count: number; resetAt: number }>();
const MAX_REPORTS_PER_MINUTE = 10;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Rate limit check
    const now = Date.now();
    const record = errorReports.get(ip);
    if (record && record.resetAt > now && record.count >= MAX_REPORTS_PER_MINUTE) {
      return NextResponse.json({ logged: false, reason: 'rate_limited' }, { status: 429 });
    }

    if (!record || record.resetAt <= now) {
      errorReports.set(ip, { count: 1, resetAt: now + 60000 });
    } else {
      record.count++;
    }

    const body = await req.json();
    const data = frontendErrorSchema.parse(body);

    await logFrontendError({
      ...data,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ logged: true }, { status: 200 });
  } catch (error) {
    console.error('[Error API] Failed to log frontend error:', error);
    return NextResponse.json({ logged: false }, { status: 500 });
  }
}
