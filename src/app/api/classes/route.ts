import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/classes — List classes grouped by program (for dropdowns)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const programs = await db.program.findMany({
      orderBy: { name: 'asc' },
      include: {
        classes: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { students: true } },
          },
        },
      },
    });

    // Also provide flat list of all classes
    const allClasses = await db.class.findMany({
      orderBy: { name: 'asc' },
      include: {
        program: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });

    return NextResponse.json({ programs, classes: allClasses });
  } catch (error) {
    console.error('List classes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
