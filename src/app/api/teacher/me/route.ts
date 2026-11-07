import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/me — Current teacher's full profile
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      include: {
        assignedClass: {
          select: {
            id: true,
            name: true,
            program: { select: { id: true, name: true } },
          },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Get school via branch
    const school = teacher.branchId
      ? await db.school.findFirst({
          where: { branches: { some: { id: teacher.branchId } } },
          select: { id: true, name: true },
        })
      : null;

    return NextResponse.json({
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      photo: teacher.photo,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      experience: teacher.experience,
      joiningDate: teacher.joiningDate,
      status: teacher.status,
      assignedClass: teacher.assignedClass
        ? {
            id: teacher.assignedClass.id,
            name: teacher.assignedClass.name,
            program: teacher.assignedClass.program,
          }
        : null,
      branch: teacher.branch
        ? { id: teacher.branch.id, name: teacher.branch.name }
        : null,
      school: school ? { id: school.id, name: school.name } : null,
    });
  } catch (error) {
    console.error('Teacher me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
