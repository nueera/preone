import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/parent/children — List all children or single child details
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.role !== 'Parent') {
      return NextResponse.json({ error: 'Access denied. Parent role required.' }, { status: 403 });
    }

    // Find the Parent record linked to this user
    const parent = await db.parent.findUnique({
      where: { userId: authUser.userId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    // Get all StudentParent links for this parent
    const studentParents = await db.studentParent.findMany({
      where: { parentId: parent.id },
      select: { studentId: true, isPrimary: true },
    });

    const childIds = studentParents.map((sp) => sp.studentId);

    if (childIds.length === 0) {
      // No children found — return empty gracefully
      if (childId) {
        return NextResponse.json({ error: 'Child not found or not associated with this parent' }, { status: 404 });
      }
      return NextResponse.json({ children: [], total: 0 });
    }

    // If a specific child is requested
    if (childId) {
      // Verify the child belongs to this parent
      if (!childIds.includes(childId)) {
        return NextResponse.json({ error: 'Child not found or not associated with this parent' }, { status: 403 });
      }

      const student = await db.student.findUnique({
        where: { id: childId },
        include: {
          class: {
            include: {
              program: {
                select: { id: true, name: true, code: true, color: true, icon: true },
              },
              teacher: {
                select: { id: true, firstName: true, lastName: true, photo: true },
              },
            },
          },
          section: {
            select: { id: true, name: true },
          },
          medicalRecords: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
          siblings: {
            include: {
              sibling: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photo: true,
                  status: true,
                },
              },
            },
          },
          siblingOf: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photo: true,
                  status: true,
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

      // Combine siblings from both directions
      const siblings = [
        ...student.siblings.map((s) => ({
          id: s.sibling.id,
          firstName: s.sibling.firstName,
          lastName: s.sibling.lastName,
          photo: s.sibling.photo,
          status: s.sibling.status,
          relation: s.relation,
        })),
        ...student.siblingOf.map((s) => ({
          id: s.student.id,
          firstName: s.student.firstName,
          lastName: s.student.lastName,
          photo: s.student.photo,
          status: s.student.status,
          relation: s.relation,
        })),
      ];

      return NextResponse.json({
        child: {
          id: student.id,
          admissionNo: student.admissionNo,
          firstName: student.firstName,
          lastName: student.lastName,
          dob: student.dob,
          gender: student.gender,
          bloodGroup: student.bloodGroup,
          photo: student.photo,
          address: student.address,
          emergencyContact: student.emergencyContact,
          enrollmentDate: student.enrollmentDate,
          status: student.status,
          class: student.class,
          section: student.section,
          medicalRecords: student.medicalRecords,
          siblings,
          growthScores: student.growthScores,
        },
      });
    }

    // Return all children with basic details
    const students = await db.student.findMany({
      where: { id: { in: childIds } },
      include: {
        class: {
          include: {
            program: {
              select: { id: true, name: true, code: true, color: true, icon: true },
            },
            teacher: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
          },
        },
        section: {
          select: { id: true, name: true },
        },
        medicalRecords: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        growthScores: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        siblings: {
          include: {
            sibling: {
              select: { id: true, firstName: true, lastName: true, photo: true, status: true },
            },
          },
        },
        siblingOf: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, photo: true, status: true },
            },
          },
        },
      },
    });

    const children = students.map((student) => {
      const sp = studentParents.find((s) => s.studentId === student.id);
      const siblings = [
        ...student.siblings.map((s) => ({
          id: s.sibling.id,
          firstName: s.sibling.firstName,
          lastName: s.sibling.lastName,
          photo: s.sibling.photo,
          status: s.sibling.status,
          relation: s.relation,
        })),
        ...student.siblingOf.map((s) => ({
          id: s.student.id,
          firstName: s.student.firstName,
          lastName: s.student.lastName,
          photo: s.student.photo,
          status: s.student.status,
          relation: s.relation,
        })),
      ];

      return {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        dob: student.dob,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        photo: student.photo,
        address: student.address,
        emergencyContact: student.emergencyContact,
        enrollmentDate: student.enrollmentDate,
        status: student.status,
        class: student.class,
        section: student.section,
        medicalRecords: student.medicalRecords,
        siblings,
        growthScores: student.growthScores,
        isPrimary: sp?.isPrimary || false,
      };
    });

    return NextResponse.json({ children, total: children.length });
  } catch (error) {
    console.error('Parent children error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
