import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, Role, generateToken } from '@/lib/auth';

// GET /api/branches — List branches for the current user's school
// Auth: Any authenticated user
// Returns list of branches for the user's school
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const schoolId = user.schoolId;
    if (!schoolId) {
      return NextResponse.json({ branches: [], currentBranchId: null });
    }

    const branches = await db.branch.findMany({
      where: { schoolId, isActive: true },
      select: { id: true, name: true, address: true, phone: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      branches,
      currentBranchId: user.branchId || null,
      schoolId,
    });
  } catch (error) {
    console.error('List branches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/branches — Switch active branch
// Auth: ADMIN or TASK_MASTER only
// Body: { branchId: string | null }
// Returns new token with updated branchId
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only ADMIN and TASK_MASTER can switch branches
    if (user.role !== Role.ADMIN && user.role !== Role.TASK_MASTER) {
      return NextResponse.json(
        { error: 'Only administrators can switch branches' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { branchId } = body;

    // If branchId is provided, validate it belongs to the user's school
    if (branchId) {
      const schoolId = user.schoolId;
      if (!schoolId) {
        return NextResponse.json(
          { error: 'No school associated with your account' },
          { status: 400 }
        );
      }

      const branch = await db.branch.findFirst({
        where: { id: branchId, schoolId, isActive: true },
        select: { id: true, name: true },
      });

      if (!branch) {
        return NextResponse.json(
          { error: 'Branch not found or not accessible' },
          { status: 404 }
        );
      }
    }

    // Generate a new token with the updated branchId
    const newToken = generateToken({
      userId: user.userId,
      role: user.role,
      email: user.email,
      name: user.name,
      schoolId: user.schoolId,
      branchId: branchId || null,
    });

    return NextResponse.json({
      message: branchId ? 'Branch switched successfully' : 'Switched to all branches view',
      token: newToken,
      branchId: branchId || null,
    });
  } catch (error) {
    console.error('Switch branch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
