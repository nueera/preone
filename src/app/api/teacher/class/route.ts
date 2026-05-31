import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/teacher/class — Teacher's class details with student list
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.role !== 'Teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
    }

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: authUser.userId },
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
            minAge: true,
            maxAge: true,
            color: true,
            icon: true,
          },
        },
        branch: {
          select: { id: true, name: true, phone: true, email: true },
        },
        sections: {
          select: { id: true, name: true, capacity: true, isActive: true },
        },
      },
    });

    if (!assignedClass) {
      return NextResponse.json({
        classInfo: null,
        students: [],
        message: 'No class assigned to this teacher',
      });
    }

    // Get students in the class with parent contacts and medical alerts
    const students = await db.student.findMany({
      where: { classId: assignedClass.id, status: 'Active' },
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true,
        bloodGroup: true,
        photo: true,
        emergencyContact: true,
        sectionId: true,
        section: { select: { id: true, name: true } },
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                alternatePhone: true,
                email: true,
                relation: true,
                isPrimary: true,
                occupation: true,
              },
            },
          },
          orderBy: { isPrimary: 'desc' },
        },
        medicalRecords: {
          where: { isActive: true, recordType: { in: ['Allergy', 'Condition', 'Medication', 'Emergency'] } },
          select: {
            id: true,
            recordType: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return NextResponse.json({
      classInfo: {
        id: assignedClass.id,
        name: assignedClass.name,
        capacity: assignedClass.capacity,
        roomNo: assignedClass.roomNo,
        floor: assignedClass.floor,
        academicYear: assignedClass.academicYear,
        isActive: assignedClass.isActive,
        program: assignedClass.program,
        branch: assignedClass.branch,
        sections: assignedClass.sections,
      },
      students,
      studentCount: students.length,
    });
  } catch (error) {
    console.error('Teacher class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
