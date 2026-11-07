import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/settings/transport/stats — Transport overview stats
export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUser(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const [totalRoutes, totalVehicles, pickupDropResult] = await Promise.all([
      db.route.count(),
      db.vehicle.count({ where: { isActive: true } }),
      db.pickupDrop.findMany({
        select: { studentId: true },
        distinct: ['studentId'],
      }),
    ]);

    return NextResponse.json({
      totalRoutes,
      totalVehicles,
      totalStudentsUsingTransport: pickupDropResult.length,
    });
  } catch (error) {
    console.error('Transport stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
