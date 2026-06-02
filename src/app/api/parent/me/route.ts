// ============================================================
// PreOne — GET /api/parent/me
// Returns parent profile + all linked children
// Used by ParentAuthContext on layout mount
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireParent, isAuthError } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    return NextResponse.json({
      parent: auth.parent,
      children: auth.children,
    });
  } catch (error) {
    console.error('Get parent profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
