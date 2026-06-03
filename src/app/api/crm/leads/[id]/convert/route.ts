import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// POST /api/crm/leads/[id]/convert — Convert an enrolled lead to a student (Admin + TaskMaster)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();

    // Verify lead exists
    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if already converted
    if (lead.convertedStudentId) {
      return NextResponse.json(
        { error: 'This lead has already been converted to a student' },
        { status: 400 }
      );
    }

    // Validate student fields
    const {
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
      // Father fields (from lead)
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
      // Address
      address,
      // Medical
      allergies,
      conditions,
      medications,
      vaccinationStatus,
      doctorName,
      doctorPhone,
      medicalNotes,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Student first name and last name are required' },
        { status: 400 }
      );
    }
    if (!dob || !gender) {
      return NextResponse.json(
        { error: 'Date of birth and gender are required' },
        { status: 400 }
      );
    }
    if (!fatherFirstName || !fatherLastName || !fatherPhone) {
      return NextResponse.json(
        { error: "Father's name and phone are required" },
        { status: 400 }
      );
    }

    // Create student + parents + update lead in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create student
      const student = await tx.student.create({
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
          studentId: student.id,
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
            studentId: student.id,
            parentId: mother.id,
            isPrimary: false,
          },
        });
      }

      // 4. Create medical record (if any data provided)
      if (allergies || conditions || medications || vaccinationStatus || doctorName) {
        await tx.medicalRecord.create({
          data: {
            studentId: student.id,
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

      // 5. Update lead — set ENROLLED + convertedStudentId
      await tx.lead.update({
        where: { id },
        data: {
          stage: 'ENROLLED',
          convertedStudentId: student.id,
        },
      });

      return student;
    });

    // Fetch complete student with relations
    const completeStudent = await db.student.findUnique({
      where: { id: result.id },
      include: {
        class: { select: { id: true, name: true, program: { select: { name: true } } } },
        branch: { select: { id: true, name: true } },
        parents: { include: { parent: true } },
        medicalRecords: true,
      },
    });

    return NextResponse.json(
      { message: 'Lead converted to student successfully', student: completeStudent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Convert lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
