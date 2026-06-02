// ============================================================
// PreOne — API Auth Helper for Parent Routes
// Consistent auth checking + parent identity verification
// + child ownership verification (parent can only see
// their own children's data). This is a convenience wrapper
// that re-exports requireParent from api-auth.ts and adds
// a simpler interface for settings-related routes.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireParent, isAuthError, type ParentAuthResult, type ParentAuthError } from '@/lib/api-auth';
import { db } from '@/lib/db';

// Re-export for convenience
export { isAuthError } from '@/lib/api-auth';
export type { ParentAuthResult, ParentAuthError };

/**
 * requireParentAuth — Full parent auth with DB lookup + child verification.
 * This is a convenience wrapper around requireParent() that also:
 * 1. Fetches the User record (for password change operations)
 * 2. Optionally verifies a specific childId belongs to this parent
 *
 * Use this in all /api/parent/* routes for consistent auth.
 */
export async function requireParentAuth(
  request: NextRequest,
  options?: { verifyChildId?: boolean }
): Promise<
  | (ParentAuthResult & { user: { id: string; email: string; password: string } })
  | ParentAuthError
> {
  const auth = await requireParent(request);
  if (isAuthError(auth)) return auth;

  // Fetch the User record for the parent (needed for password operations)
  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: auth.parent.email || '' },
        { email: auth.parent.phone },
      ],
      role: 'PARENT',
    },
    select: {
      id: true,
      email: true,
      password: true,
    },
  });

  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'User account not found for this parent' },
        { status: 404 }
      ),
    };
  }

  // Optionally verify childId if provided in query params
  if (options?.verifyChildId) {
    const childId = request.nextUrl.searchParams.get('childId');
    if (childId && !auth.childIds.includes(childId)) {
      return {
        error: NextResponse.json(
          { error: 'Access denied. This child is not linked to your account.' },
          { status: 403 }
        ),
      };
    }
  }

  return {
    ...auth,
    user: {
      id: user.id,
      email: user.email,
      password: user.password,
    },
  };
}
