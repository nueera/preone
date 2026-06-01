import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// PATCH /api/settings/branches/[id] — Update branch fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const { name, address, phone, capacity, inChargeName, inChargePhone, isActive } = body;

    // Check branch exists
    const existing = await db.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (inChargeName !== undefined) updateData.inChargeName = inChargeName;
    if (inChargePhone !== undefined) updateData.inChargePhone = inChargePhone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedBranch = await db.branch.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            students: true,
            classes: true,
            teachers: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Branch updated successfully',
      branch: updatedBranch,
    });
  } catch (error) {
    console.error('Update branch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/settings/branches/[id] — Soft-delete (set isActive=false), or hard delete if already inactive
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    // Check branch exists
    const existing = await db.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    if (existing.isActive) {
      // Soft delete — set isActive = false
      const updated = await db.branch.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: 'Branch deactivated successfully',
        branch: updated,
      });
    } else {
      // Already inactive — hard delete
      await db.branch.delete({ where: { id } });
      return NextResponse.json({
        message: 'Branch permanently deleted',
      });
    }
  } catch (error) {
    console.error('Delete branch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
