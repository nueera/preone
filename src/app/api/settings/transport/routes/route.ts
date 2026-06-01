import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET /api/settings/transport/routes — List all routes with vehicle count
export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUser(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};

    // Search filter
    if (search) {
      (where as Record<string, unknown>).OR = [
        { name: { contains: search } },
        { startPoint: { contains: search } },
        { endPoint: { contains: search } },
      ];
    }

    const routes = await db.route.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    });

    return NextResponse.json({ routes });
  } catch (error) {
    console.error('List transport routes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings/transport/routes — Create a new route
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { name, startPoint, endPoint, stops, distance, fee } = body;

    // Validate required fields
    if (!name || !startPoint || !endPoint) {
      return NextResponse.json(
        { error: 'name, startPoint, and endPoint are required' },
        { status: 400 }
      );
    }

    const route = await db.route.create({
      data: {
        name,
        startPoint,
        endPoint,
        stops: stops || null,
        distance: distance || null,
        fee: fee || null,
      },
      include: {
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Route created successfully', route },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create transport route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
