import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/parent/daily-updates — Daily updates for parent's children
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
    const dateParam = searchParams.get('date'); // format: "2024-01-15"

    // Get all children of this parent
    const studentParents = await db.studentParent.findMany({
      where: { parentId: parent.id },
      select: { studentId: true },
    });
    const childIds = studentParents.map((sp) => sp.studentId);

    if (childIds.length === 0) {
      return NextResponse.json({ updates: [] });
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

    // Build where clause
    const where: Record<string, unknown> = {
      studentId: { in: targetChildIds },
      status: 'Published',
    };

    // Filter by specific date if provided
    if (dateParam) {
      const parsedDate = new Date(dateParam + 'T00:00:00.000Z');
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD (e.g., 2024-01-15)' },
          { status: 400 }
        );
      }
      const dayStart = new Date(parsedDate);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(parsedDate);
      dayEnd.setUTCHours(23, 59, 59, 999);

      where.date = {
        gte: dayStart,
        lte: dayEnd,
      };
    }

    // Fetch daily updates
    const updates = await db.dailyUpdate.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, photo: true },
        },
      },
    });

    return NextResponse.json({
      updates,
      date: dateParam || new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Parent daily-updates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
