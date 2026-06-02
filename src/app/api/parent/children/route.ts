// ============================================================
// PreOne — GET /api/parent/children
// List all children or single child details for parent
// Returns comprehensive data including parents, siblings,
// medical records, and class/teacher info
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

    // If a specific child is requested, return full details
    if (childId) {
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
          medicalRecords: { orderBy: { createdAt: 'desc' } },
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
                  class: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
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
          className: s.sibling.class?.name || null,
          rollNumber: s.sibling.rollNumber,
          relation: s.relation || 'Sibling',
        })),
        ...student.siblingsAsSibling.map((s) => ({
          id: s.student.id,
          firstName: s.student.firstName,
          lastName: s.student.lastName,
          className: s.student.class?.name || null,
          rollNumber: s.student.rollNumber,
          relation: s.relation || 'Sibling',
        })),
      ];

      // Determine emergency contact
      const emergencyContact = student.parents.find(
        (sp) => sp.parent.isEmergencyContact
      );

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
          emergencyContact: emergencyContact
            ? {
                name: `${emergencyContact.parent.firstName} ${emergencyContact.parent.lastName}`,
                phone: emergencyContact.parent.phone,
                relation: emergencyContact.parent.relation,
              }
            : null,
        },
      });
    }

    // Return all children with detailed info for the list view
    const detailedChildren = await Promise.all(
      auth.childIds.map(async (id) => {
        const student = await db.student.findUnique({
          where: { id },
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
                    class: { select: { id: true, name: true } },
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
                    class: { select: { id: true, name: true } },
                  },
                },
              },
            },
            medicalRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        });

        if (!student) return null;

        // Combine siblings from both directions
        const siblings = [
          ...student.siblingsAsStudent.map((s) => ({
            id: s.sibling.id,
            firstName: s.sibling.firstName,
            lastName: s.sibling.lastName,
            className: s.sibling.class?.name || null,
            rollNumber: s.sibling.rollNumber,
            relation: s.relation || 'Sibling',
          })),
          ...student.siblingsAsSibling.map((s) => ({
            id: s.student.id,
            firstName: s.student.firstName,
            lastName: s.student.lastName,
            className: s.student.class?.name || null,
            rollNumber: s.student.rollNumber,
            relation: s.relation || 'Sibling',
          })),
        ];

        // Determine emergency contact
        const emergencyContact = student.parents.find(
          (sp) => sp.parent.isEmergencyContact
        );

        return {
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
          emergencyContact: emergencyContact
            ? {
                name: `${emergencyContact.parent.firstName} ${emergencyContact.parent.lastName}`,
                phone: emergencyContact.parent.phone,
                relation: emergencyContact.parent.relation,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      children: detailedChildren.filter(Boolean),
      total: detailedChildren.filter(Boolean).length,
    });
  } catch (error) {
    console.error('Parent children error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
