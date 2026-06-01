// ============================================================
// PreOne — GET/PATCH /api/teacher/profile
// Teacher profile view and edit (phone, address, photo only)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTeacher, isAuthError } from '@/lib/api-auth';

// GET /api/teacher/profile — Return complete teacher profile
export async function GET(request: NextRequest) {
  try {
    const auth = await requireTeacher(request);
    if (isAuthError(auth)) return auth.error;

    const { teacher } = auth;

    // Fetch full teacher profile with relations
    const profile = await db.teacher.findUnique({
      where: { id: teacher.id },
      include: {
        assignedClass: {
          include: {
            program: { select: { id: true, name: true } },
          },
        },
        branch: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, schoolId: true } },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Fetch school name if linked
    let schoolInfo = null;
    if (profile.user?.schoolId) {
      const school = await db.school.findUnique({
        where: { id: profile.user.schoolId },
        select: { id: true, name: true },
      });
      if (school) {
        schoolInfo = school;
      }
    }

    return NextResponse.json({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      dob: profile.dob ? profile.dob.toISOString().split('T')[0] : null,
      gender: profile.gender,
      address: profile.address,
      qualification: profile.qualification,
      specialization: profile.specialization,
      experience: profile.experience,
      photo: profile.photo,
      joiningDate: profile.joiningDate
        ? profile.joiningDate.toISOString().split('T')[0]
        : null,
      status: profile.status,
      assignedClass: profile.assignedClass
        ? {
            id: profile.assignedClass.id,
            name: profile.assignedClass.name,
            program: profile.assignedClass.program,
          }
        : null,
      branch: profile.branch
        ? { id: profile.branch.id, name: profile.branch.name }
        : null,
      school: schoolInfo,
    });
  } catch (error) {
    console.error('Get teacher profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/teacher/profile — Update editable fields (phone, address, photo)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireTeacher(request);
    if (isAuthError(auth)) return auth.error;

    const { teacher } = auth;
    const body = await request.json();

    // Only allow updating these fields
    const updateData: Record<string, unknown> = {};

    if (body.phone !== undefined) {
      if (typeof body.phone !== 'string' || body.phone.trim().length < 10) {
        return NextResponse.json(
          { error: 'Phone number must be at least 10 digits' },
          { status: 400 }
        );
      }
      updateData.phone = body.phone.trim();
    }

    if (body.address !== undefined) {
      if (typeof body.address !== 'string' || body.address.trim().length === 0) {
        return NextResponse.json(
          { error: 'Address cannot be empty' },
          { status: 400 }
        );
      }
      updateData.address = body.address.trim();
    }

    if (body.photo !== undefined) {
      // Photo can be a base64 string or null (to remove)
      if (body.photo !== null && typeof body.photo !== 'string') {
        return NextResponse.json(
          { error: 'Invalid photo format' },
          { status: 400 }
        );
      }
      updateData.photo = body.photo;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update teacher record
    const updated = await db.teacher.update({
      where: { id: teacher.id },
      data: updateData,
      include: {
        assignedClass: {
          include: {
            program: { select: { id: true, name: true } },
          },
        },
        branch: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, schoolId: true } },
      },
    });

    // If phone is updated, also update the linked User record's phone
    if (updateData.phone && updated.userId) {
      await db.user.update({
        where: { id: updated.userId },
        data: { phone: updateData.phone as string },
      });
    }

    // Fetch school info
    let schoolInfo = null;
    if (updated.user?.schoolId) {
      const school = await db.school.findUnique({
        where: { id: updated.user.schoolId },
        select: { id: true, name: true },
      });
      if (school) schoolInfo = school;
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        dob: updated.dob ? updated.dob.toISOString().split('T')[0] : null,
        gender: updated.gender,
        address: updated.address,
        qualification: updated.qualification,
        specialization: updated.specialization,
        experience: updated.experience,
        photo: updated.photo,
        joiningDate: updated.joiningDate
          ? updated.joiningDate.toISOString().split('T')[0]
          : null,
        status: updated.status,
        assignedClass: updated.assignedClass
          ? {
              id: updated.assignedClass.id,
              name: updated.assignedClass.name,
              program: updated.assignedClass.program,
            }
          : null,
        branch: updated.branch
          ? { id: updated.branch.id, name: updated.branch.name }
          : null,
        school: schoolInfo,
      },
    });
  } catch (error) {
    console.error('Update teacher profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
