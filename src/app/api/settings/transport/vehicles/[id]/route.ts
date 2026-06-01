import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// PATCH /api/settings/transport/vehicles/[id] — Update vehicle fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const {
      vehicleNo,
      type,
      capacity,
      routeId,
      driverName,
      driverPhone,
      driverLicense,
      insuranceExpiry,
      fitnessExpiry,
      isActive,
    } = body;

    // Check vehicle exists
    const existing = await db.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Validate routeId if provided
    if (routeId) {
      const route = await db.route.findUnique({ where: { id: routeId } });
      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (vehicleNo !== undefined) updateData.vehicleNo = vehicleNo;
    if (type !== undefined) updateData.type = type;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (routeId !== undefined) updateData.routeId = routeId || null;
    if (driverName !== undefined) updateData.driverName = driverName;
    if (driverPhone !== undefined) updateData.driverPhone = driverPhone;
    if (driverLicense !== undefined) updateData.driverLicense = driverLicense;
    if (insuranceExpiry !== undefined) {
      updateData.insuranceExpiry = insuranceExpiry ? new Date(insuranceExpiry) : null;
    }
    if (fitnessExpiry !== undefined) {
      updateData.fitnessExpiry = fitnessExpiry ? new Date(fitnessExpiry) : null;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedVehicle = await db.vehicle.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error('Update transport vehicle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/settings/transport/vehicles/[id] — Soft-delete (set isActive=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    // Check vehicle exists
    const existing = await db.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Soft delete — set isActive = false
    const updatedVehicle = await db.vehicle.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        vehicleNo: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: 'Vehicle deactivated successfully',
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error('Delete transport vehicle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
