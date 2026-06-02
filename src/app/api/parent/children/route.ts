// ============================================================
// PreOne — GET /api/parent/children
// List all children or single child details for parent
// Uses requireParent for consistent auth
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError, verifyChildAccess } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    // If a specific child is requested
    if (childId) {
      const accessError = verifyChildAccess(auth, childId);
      if (accessError) return accessError;

      const student = await db.student.findUnique({
        where: { id: childId },
        include: {
          class: {
            include: {
              program: { select: { id: true, name: true } },
              teacher: { select: { id: true, firstName: true, lastName: true, photo: true, specialization: true } },
            },
          },
          parents: {
            include: {
              parent: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, relation: true, isEmergencyContact: true } },
            },
          },
          medicalRecords: { orderBy: { createdAt: 'desc' } },
          growthScores: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });

      if (!student) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }

      return NextResponse.json({
        child: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          dob: student.dob.toISOString().split('T')[0],
          gender: student.gender,
          bloodGroup: student.bloodGroup,
          photo: student.photo,
          rollNumber: student.rollNumber,
          status: student.status,
          admissionDate: student.admissionDate.toISOString().split('T')[0],
          class: student.class,
          parents: student.parents.map((sp) => ({
            isPrimary: sp.isPrimary,
            ...sp.parent,
          })),
          medicalRecords: student.medicalRecords,
          growthScores: student.growthScores,
        },
      });
    }

    // Return all children with basic details
    return NextResponse.json({
      children: auth.children,
      total: auth.children.length,
    });
  } catch (error) {
    console.error('Parent children error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
