import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranchFromRequest, withBranchViaRelationFilter } from '@/lib/branch';
import { auditLog } from '@/lib/audit';

// GET /api/students — List students with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    // Branch isolation
    const branchScope = getBranchFromRequest(request, authResult);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const statusParam = searchParams.get('status') || '';
    const gender = searchParams.get('gender') || '';
    const bloodGroup = searchParams.get('bloodGroup') || '';

    const skip = (page - 1) * limit;

    // Build where clause — start with branch filter (Student has branchId, no schoolId)
    const where: Record<string, unknown> = withBranchViaRelationFilter(branchScope);

    if (classId) {
      where.classId = classId;
    }

    // Status can be comma-separated for multi-select
    if (statusParam) {
      const statuses = statusParam.split(',').filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    if (gender && gender !== 'All') {
      where.gender = gender;
    }

    // Blood group can be comma-separated for multi-select
    if (bloodGroup) {
      const groups = bloodGroup.split(',').filter(Boolean);
      if (groups.length === 1) {
        where.bloodGroup = groups[0];
      } else if (groups.length > 1) {
        where.bloodGroup = { in: groups };
      }
    }

    // Search across student name and parent name
    if (search) {
      (where as Record<string, unknown>).OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { rollNumber: { contains: search } },
        {
          parents: {
            some: {
              parent: {
                OR: [
                  { firstName: { contains: search } },
                  { lastName: { contains: search } },
                ],
              },
            },
          },
        },
      ];
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              program: { select: { id: true, name: true } },
            },
          },
          branch: { select: { id: true, name: true } },
          parents: {
            include: {
              parent: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                  relation: true,
                },
              },
            },
          },
        },
      }),
      db.student.count({ where }),
    ]);

    // Format response — flatten primary parent info for easy access
    const formattedStudents = students.map((s) => {
      const primaryLink = s.parents.find((p) => p.isPrimary) || s.parents[0];
      const primaryParent = primaryLink?.parent;
      return {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        dob: s.dob,
        gender: s.gender,
        bloodGroup: s.bloodGroup,
        aadhaarNumber: s.aadhaarNumber,
        photo: s.photo,
        admissionDate: s.admissionDate,
        status: s.status,
        rollNumber: s.rollNumber,
        classId: s.classId,
        branchId: s.branchId,
        class: s.class,
        branch: s.branch,
        primaryParent: primaryParent
          ? {
              id: primaryParent.id,
              firstName: primaryParent.firstName,
              lastName: primaryParent.lastName,
              phone: primaryParent.phone,
              email: primaryParent.email,
              relation: primaryParent.relation,
            }
          : null,
        parents: s.parents,
      };
    });

    return NextResponse.json({
      students: formattedStudents,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('List students error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/students — Create a new student with parents and medical record
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const {
      // Student fields
      firstName,
      lastName,
      dob,
      gender,
      bloodGroup,
      aadhaarNumber,
      classId,
      branchId,
      rollNumber,
      admissionDate,
      photo,
      // Father fields
      fatherFirstName,
      fatherLastName,
      fatherPhone,
      fatherEmail,
      fatherOccupation,
      // Mother fields
      motherFirstName,
      motherLastName,
      motherPhone,
      motherEmail,
      motherOccupation,
      // Emergency contact
      emergencyContactName,
      emergencyContactPhone,
      // Address
      address,
      // Medical fields
      allergies,
      conditions,
      medications,
      vaccinationStatus,
      doctorName,
      doctorPhone,
      medicalNotes,
    } = body;

    // Validate required student fields
    if (!firstName || !lastName || !dob || !gender) {
      return NextResponse.json(
        { error: 'firstName, lastName, dob, and gender are required' },
        { status: 400 }
      );
    }

    // Validate parent fields
    if (!fatherFirstName || !fatherLastName || !fatherPhone) {
      return NextResponse.json(
        { error: "Father's name and phone are required" },
        { status: 400 }
      );
    }

    // Create student + parents + medical in a transaction
    const student = await db.$transaction(async (tx) => {
      // 1. Create student
      const newStudent = await tx.student.create({
        data: {
          firstName,
          lastName,
          dob: new Date(dob),
          gender,
          bloodGroup: bloodGroup || null,
          aadhaarNumber: aadhaarNumber || null,
          classId: classId || null,
          branchId: branchId || null,
          rollNumber: rollNumber || null,
          admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
          photo: photo || null,
          status: 'ACTIVE',
        },
      });

      // 2. Create Father
      const father = await tx.parent.create({
        data: {
          firstName: fatherFirstName,
          lastName: fatherLastName,
          phone: fatherPhone,
          email: fatherEmail || null,
          occupation: fatherOccupation || null,
          relation: 'Father',
          isEmergencyContact: false,
          address: address || null,
        },
      });

      // Link father as primary
      await tx.studentParent.create({
        data: {
          studentId: newStudent.id,
          parentId: father.id,
          isPrimary: true,
        },
      });

      // 3. Create Mother (if provided)
      if (motherFirstName && motherLastName) {
        const mother = await tx.parent.create({
          data: {
            firstName: motherFirstName,
            lastName: motherLastName,
            phone: motherPhone || null,
            email: motherEmail || null,
            occupation: motherOccupation || null,
            relation: 'Mother',
            isEmergencyContact: false,
            address: address || null,
          },
        });

        await tx.studentParent.create({
          data: {
            studentId: newStudent.id,
            parentId: mother.id,
            isPrimary: false,
          },
        });
      }

      // 4. Create Emergency Contact (if provided and different from parents)
      if (emergencyContactName && emergencyContactPhone) {
        await tx.parent.create({
          data: {
            firstName: emergencyContactName.split(' ')[0] || emergencyContactName,
            lastName: emergencyContactName.split(' ').slice(1).join(' ') || '',
            phone: emergencyContactPhone,
            relation: 'Emergency',
            isEmergencyContact: true,
            address: address || null,
          },
        });
        // Note: Not linking emergency contact as StudentParent since it's separate
        // In a real app, you might want to link them too
      }

      // 5. Create medical record (if any data provided)
      if (allergies || conditions || medications || vaccinationStatus || doctorName) {
        await tx.medicalRecord.create({
          data: {
            studentId: newStudent.id,
            allergies: allergies || null,
            conditions: conditions || null,
            medications: medications || null,
            vaccinationStatus: vaccinationStatus || null,
            doctorName: doctorName || null,
            doctorPhone: doctorPhone || null,
            notes: medicalNotes || null,
          },
        });
      }

      return newStudent;
    });

    // Fetch complete student with relations
    const completeStudent = await db.student.findUnique({
      where: { id: student.id },
      include: {
        class: { select: { id: true, name: true, program: { select: { name: true } } } },
        branch: { select: { id: true, name: true } },
        parents: { include: { parent: true } },
        medicalRecords: true,
      },
    });

    // ── Audit log ──
    try {
      await auditLog.create({
        action: 'CREATE',
        entity: 'Student',
        entityId: student.id,
        userId: authResult.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        details: { firstName, lastName, gender, classId: classId || null, branchId: branchId || null },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json(
      { message: 'Student created successfully', student: completeStudent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
