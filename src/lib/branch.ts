// ============================================================
// PreOne — Branch Isolation Utility
//
// All API routes that return data scoped to a branch MUST use
// these utilities to ensure data isolation between branches of
// the same school.
//
// Usage in API routes:
//   import { withBranchFilter, getBranchFromRequest } from '@/lib/branch';
//
//   const branchScope = getBranchFromRequest(request, user);
//   const students = await db.student.findMany({
//     where: {
//       schoolId: user.schoolId,
//       ...withBranchFilter(branchScope),
//     }
//   });
// ============================================================

import { NextRequest } from 'next/server';
import { TokenPayload, Role } from '@/lib/auth';

// ── Types ──

export interface BranchScope {
  branchId: string | null;   // null = all branches (school-level access)
  schoolId: string;
  isAllBranches: boolean;    // true if user can see all branches
}

// ── Core Functions ──

/**
 * Get branch scope from request context and user token.
 *
 * - If user has a branchId, they're scoped to that branch
 * - If user is ADMIN with no branchId, they can see all branches
 *   but can also pass ?branchId=xxx to filter to a specific branch
 * - Teachers are always scoped to their assigned branch
 * - Parents see data for branches where their children are enrolled
 */
export function getBranchFromRequest(
  request: NextRequest,
  user: TokenPayload
): BranchScope {
  const schoolId = user.schoolId || '';

  // ADMIN without branchId can see all branches
  // But can filter by branchId query param
  if (user.role === Role.ADMIN && !user.branchId) {
    const queryBranchId = request.nextUrl.searchParams.get('branchId');
    return {
      branchId: queryBranchId || null,
      schoolId,
      isAllBranches: !queryBranchId,
    };
  }

  // TASK_MASTER with no branchId, same as admin
  if (user.role === Role.TASK_MASTER && !user.branchId) {
    const queryBranchId = request.nextUrl.searchParams.get('branchId');
    return {
      branchId: queryBranchId || null,
      schoolId,
      isAllBranches: !queryBranchId,
    };
  }

  // All other users are scoped to their branch
  return {
    branchId: user.branchId || null,
    schoolId,
    isAllBranches: false,
  };
}

/**
 * Create a Prisma where clause filter for branch isolation.
 *
 * Returns an object that can be spread into a Prisma `where` clause:
 * - If branchId is set, returns { branchId }
 * - If allBranches (admin), returns {} (no filter — sees everything in school)
 *
 * ALWAYS combine with schoolId filter in the same where clause!
 */
export function withBranchFilter(scope: BranchScope): Record<string, unknown> {
  if (scope.isAllBranches) {
    return {}; // No branch filter — admin sees all
  }
  if (scope.branchId) {
    return { branchId: scope.branchId };
  }
  return {}; // Fallback — no filter
}

/**
 * Create a full school+branch where clause.
 * This is the recommended way to filter queries on models that
 * have BOTH schoolId and branchId fields directly (e.g. User, Branch, CrmTask).
 */
export function withSchoolBranchFilter(scope: BranchScope): Record<string, unknown> {
  return {
    ...(scope.schoolId ? { schoolId: scope.schoolId } : {}),
    ...withBranchFilter(scope),
  };
}

/**
 * Create a where clause for models that have branchId but NOT schoolId directly.
 * (e.g. Student, Teacher, Class, Program)
 *
 * - If branchId is set: returns { branchId }
 * - If allBranches (admin): returns { branch: { schoolId } } — filters via relation
 *
 * This ensures admins see only data from branches in their school,
 * while branch-scoped users see only their branch's data.
 */
export function withBranchViaRelationFilter(scope: BranchScope): Record<string, unknown> {
  if (scope.isAllBranches) {
    // Admin seeing all branches — but still scoped to school via branch relation
    if (scope.schoolId) {
      return { branch: { schoolId: scope.schoolId } };
    }
    return {};
  }
  if (scope.branchId) {
    return { branchId: scope.branchId };
  }
  return {};
}

/**
 * Validate that a record belongs to the user's accessible branch.
 * Returns true if access is allowed, false otherwise.
 */
export function validateBranchAccess(
  record: { branchId: string | null },
  scope: BranchScope
): boolean {
  if (scope.isAllBranches) return true; // Admin can access any branch
  if (!scope.branchId) return true; // No branch restriction
  return record.branchId === scope.branchId;
}

/**
 * Get branch info for display in UI.
 */
export async function getBranchInfo(branchId: string | null) {
  if (!branchId) return null;
  const { db } = await import('@/lib/db');
  return db.branch.findUnique({
    where: { id: branchId },
    select: { id: true, name: true, schoolId: true },
  });
}

/**
 * List all branches for a school (for branch switcher).
 */
export async function getSchoolBranches(schoolId: string) {
  const { db } = await import('@/lib/db');
  return db.branch.findMany({
    where: { schoolId, isActive: true },
    select: { id: true, name: true, address: true },
    orderBy: { name: 'asc' },
  });
}
