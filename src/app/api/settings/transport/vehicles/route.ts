import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET /api/settings/transport/vehicles — List all vehicles with route info and filters
export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUser(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};

    // Filter by isActive
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Search filter
    if (search) {
      (where as Record<string, unknown>).OR = [
        { vehicleNo: { contains: search } },
        { driverName: { contains: search } },
        { type: { contains: search } },
      ];
    }

    const vehicles = await db.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        route: {
          select: {
            id: true,
            name: true,
            startPoint: true,
            endPoint: true,
          },
        },
      },
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('List transport vehicles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings/transport/vehicles — Create a new vehicle
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const {
      vehicleNo,
      type,
      capacity,
      driverName,
      driverPhone,
      routeId,
      driverLicense,
      insuranceExpiry,
      fitnessExpiry,
    } = body;

    // Validate required fields
    if (!vehicleNo || !type || !capacity || !driverName || !driverPhone) {
      return NextResponse.json(
        { error: 'vehicleNo, type, capacity, driverName, and driverPhone are required' },
        { status: 400 }
      );
    }

    // Validate routeId if provided
    if (routeId) {
      const route = await db.route.findUnique({ where: { id: routeId } });
      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }
    }

    const vehicle = await db.vehicle.create({
      data: {
        vehicleNo,
        type,
        capacity,
        driverName,
        driverPhone,
        routeId: routeId || null,
        driverLicense: driverLicense || null,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
        isActive: true,
      },
      include: {
        route: {
          select: {
            id: true,
            name: true,
            startPoint: true,
            endPoint: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Vehicle created successfully', vehicle },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create transport vehicle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
