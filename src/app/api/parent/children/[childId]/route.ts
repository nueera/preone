// ============================================================
// PreOne — GET /api/parent/children/[childId]
// Complete child detail for parent view
// Includes: personal info, parents, medical, siblings, teacher
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError, verifyChildAccess } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const { childId } = await params;

    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    // Verify this child belongs to the authenticated parent
    const accessError = verifyChildAccess(auth, childId);
    if (accessError) return accessError;

    const student = await db.student.findUnique({
      where: { id: childId },
      include: {
        class: {
          include: {
            program: { select: { id: true, name: true } },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photo: true,
                qualification: true,
                specialization: true,
                experience: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                occupation: true,
                address: true,
                relation: true,
                isEmergencyContact: true,
              },
            },
          },
        },
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
        },
        siblingsAsStudent: {
          include: {
            sibling: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photo: true,
                rollNumber: true,
                status: true,
                dob: true,
                gender: true,
                class: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        siblingsAsSibling: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photo: true,
                rollNumber: true,
                status: true,
                dob: true,
                gender: true,
                class: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        growthScores: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Combine siblings from both relation directions
    const siblings = [
      ...student.siblingsAsStudent.map((s) => ({
        id: s.sibling.id,
        firstName: s.sibling.firstName,
        lastName: s.sibling.lastName,
        photo: s.sibling.photo,
        className: s.sibling.class?.name || null,
        rollNumber: s.sibling.rollNumber,
        relation: s.relation || 'Sibling',
        status: s.sibling.status,
        dob: s.sibling.dob.toISOString().split('T')[0],
        gender: s.sibling.gender,
      })),
      ...student.siblingsAsSibling.map((s) => ({
        id: s.student.id,
        firstName: s.student.firstName,
        lastName: s.student.lastName,
        photo: s.student.photo,
        className: s.student.class?.name || null,
        rollNumber: s.student.rollNumber,
        relation: s.relation || 'Sibling',
        status: s.student.status,
        dob: s.student.dob.toISOString().split('T')[0],
        gender: s.student.gender,
      })),
    ];

    // Determine emergency contact
    const emergencyContact = student.parents.find(
      (sp) => sp.parent.isEmergencyContact
    );

    // Get the latest medical record
    const latestMedical = student.medicalRecords[0] || null;

    return NextResponse.json({
      child: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dob: student.dob.toISOString().split('T')[0],
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        aadhaarNumber: student.aadhaarNumber,
        photo: student.photo,
        rollNumber: student.rollNumber,
        status: student.status,
        admissionDate: student.admissionDate.toISOString().split('T')[0],
        class: student.class
          ? {
              id: student.class.id,
              name: student.class.name,
              program: student.class.program,
              teacher: student.class.teacher,
            }
          : null,
        parents: student.parents.map((sp) => ({
          isPrimary: sp.isPrimary,
          ...sp.parent,
        })),
        siblings,
        medicalRecords: student.medicalRecords,
        latestMedical,
        growthScores: student.growthScores,
        emergencyContact: emergencyContact
          ? {
              name: `${emergencyContact.parent.firstName} ${emergencyContact.parent.lastName}`,
              phone: emergencyContact.parent.phone,
              relation: emergencyContact.parent.relation,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Parent child detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
