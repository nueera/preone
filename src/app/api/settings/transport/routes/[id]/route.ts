import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// PATCH /api/settings/transport/routes/[id] — Update route fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const { name, startPoint, endPoint, stops, distance, fee } = body;

    // Check route exists
    const existing = await db.route.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (startPoint !== undefined) updateData.startPoint = startPoint;
    if (endPoint !== undefined) updateData.endPoint = endPoint;
    if (stops !== undefined) updateData.stops = stops;
    if (distance !== undefined) updateData.distance = distance;
    if (fee !== undefined) updateData.fee = fee;

    const updatedRoute = await db.route.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Route updated successfully',
      route: updatedRoute,
    });
  } catch (error) {
    console.error('Update transport route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/settings/transport/routes/[id] — Delete route (only if no vehicles assigned)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    // Check route exists
    const existing = await db.route.findUnique({
      where: { id },
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Check if vehicles are assigned
    if (existing._count.vehicles > 0) {
      return NextResponse.json(
        { error: 'Cannot delete route with assigned vehicles. Remove vehicles first.' },
        { status: 400 }
      );
    }

    await db.route.delete({ where: { id } });

    return NextResponse.json({
      message: 'Route deleted successfully',
    });
  } catch (error) {
    console.error('Delete transport route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
