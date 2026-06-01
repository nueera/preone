import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/class — Teacher's assigned class with full student list
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, branchId: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Find the assigned class
    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            description: true,
            ageMin: true,
            ageMax: true,
          },
        },
        branch: {
          select: { id: true, name: true, phone: true, address: true },
        },
      },
    });

    if (!assignedClass) {
      return NextResponse.json({
        classInfo: null,
        students: [],
        totalStudents: 0,
        message: 'No class assigned to this teacher',
      });
    }

    // Get students in the class with parent contacts and medical alerts
    const students = await db.student.findMany({
      where: { classId: assignedClass.id, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true,
        bloodGroup: true,
        aadhaarNumber: true,
        photo: true,
        rollNumber: true,
        admissionDate: true,
        status: true,
        parents: {
          select: {
            isPrimary: true,
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                relation: true,
                occupation: true,
              },
            },
          },
          orderBy: { isPrimary: 'desc' },
        },
        medicalRecords: {
          select: {
            id: true,
            allergies: true,
            conditions: true,
            medications: true,
            vaccinationStatus: true,
            doctorName: true,
            doctorPhone: true,
          },
        },
        growthScores: {
          select: {
            id: true,
            period: true,
            overall: true,
            creativity: true,
            communication: true,
            social: true,
            confidence: true,
            cognitive: true,
            physical: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { firstName: 'asc' },
    });

    // Process students to add computed fields
    const processedStudents = students.map((student) => {
      // Check for medical alerts (non-null, non-empty allergies or conditions)
      const hasAllergies = student.medicalRecords.some(
        (m) => m.allergies && m.allergies.trim() !== '' && m.allergies.toLowerCase() !== 'none' && m.allergies.toLowerCase() !== 'nil'
      );
      const hasConditions = student.medicalRecords.some(
        (m) => m.conditions && m.conditions.trim() !== '' && m.conditions.toLowerCase() !== 'none' && m.conditions.toLowerCase() !== 'nil'
      );
      const medicalAlerts = hasAllergies || hasConditions;

      // Get latest growth score
      const latestGrowth = student.growthScores[0] || null;

      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        photo: student.photo,
        rollNumber: student.rollNumber,
        dob: student.dob,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        aadhaarNumber: student.aadhaarNumber,
        status: student.status,
        admissionDate: student.admissionDate,
        medicalAlerts,
        growthScore: latestGrowth
          ? {
              overall: latestGrowth.overall ?? 0,
              period: latestGrowth.period,
              creativity: latestGrowth.creativity,
              communication: latestGrowth.communication,
              social: latestGrowth.social,
              confidence: latestGrowth.confidence,
              cognitive: latestGrowth.cognitive,
              physical: latestGrowth.physical,
            }
          : null,
        parents: student.parents.map((sp) => ({
          isPrimary: sp.isPrimary,
          parent: {
            id: sp.parent.id,
            firstName: sp.parent.firstName,
            lastName: sp.parent.lastName,
            phone: sp.parent.phone,
            email: sp.parent.email,
            relation: sp.parent.relation,
            occupation: sp.parent.occupation,
          },
        })),
        medicalRecords: student.medicalRecords,
      };
    });

    return NextResponse.json({
      classInfo: {
        id: assignedClass.id,
        name: assignedClass.name,
        capacity: assignedClass.capacity,
        roomNo: assignedClass.roomNo,
        section: assignedClass.section,
        program: assignedClass.program,
        branch: assignedClass.branch,
      },
      students: processedStudents,
      totalStudents: processedStudents.length,
    });
  } catch (error) {
    console.error('Teacher class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
