import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/parent/observations — Teacher observations shared with parent
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.Parent);
    if (user instanceof NextResponse) return user;

    // Find the Parent record linked to this user
    const parent = await db.parent.findUnique({
      where: { userId: user.userId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    // Get all children of this parent
    const studentParents = await db.studentParent.findMany({
      where: { parentId: parent.id },
      select: { studentId: true },
    });
    const childIds = studentParents.map((sp) => sp.studentId);

    if (childIds.length === 0) {
      return NextResponse.json({ observations: [], total: 0 });
    }

    // Validate childId if provided
    if (childId && !childIds.includes(childId)) {
      return NextResponse.json(
        { error: 'Child not found or not associated with this parent' },
        { status: 403 }
      );
    }

    // Determine which children to query
    const targetChildIds = childId ? [childId] : childIds;

    // Fetch observations that are shared with parents
    const observations = await db.observation.findMany({
      where: {
        studentId: { in: targetChildIds },
        isShared: true,
      },
      orderBy: { date: 'desc' },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, photo: true },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
            specialization: true,
          },
        },
      },
    });

    // Group by category for easier frontend consumption
    const categories = observations.reduce<Record<string, number>>((acc, obs) => {
      acc[obs.category] = (acc[obs.category] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      observations,
      total: observations.length,
      categories,
    });
  } catch (error) {
    console.error('Parent observations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
