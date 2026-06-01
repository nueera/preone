import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/teacher/students/[studentId] — Full student detail for teacher view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = requireRole(request, Role.TEACHER);
    if (user instanceof NextResponse) return user;

    const { studentId } = await params;

    // Find the teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: user.userId },
      select: { id: true, branchId: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Find the assigned class for this teacher
    const assignedClass = await db.class.findFirst({
      where: { teacherId: teacher.id },
      select: { id: true },
    });

    if (!assignedClass) {
      return NextResponse.json({ error: 'No class assigned' }, { status: 404 });
    }

    // Get the student — must belong to the teacher's class (branch isolation)
    const student = await db.student.findFirst({
      where: { id: studentId, classId: assignedClass.id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            program: { select: { id: true, name: true } },
          },
        },
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
                occupation: true,
                address: true,
                relation: true,
                isEmergencyContact: true,
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
            notes: true,
          },
        },
        growthScores: {
          select: {
            id: true,
            period: true,
            creativity: true,
            communication: true,
            social: true,
            confidence: true,
            cognitive: true,
            physical: true,
            overall: true,
            comments: true,
            assessedBy: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        attendance: {
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
            },
          },
          select: {
            id: true,
            date: true,
            status: true,
            checkInTime: true,
            checkOutTime: true,
          },
          orderBy: { date: 'desc' },
        },
        dailyUpdates: {
          select: {
            id: true,
            date: true,
            breakfast: true,
            breakfastMenu: true,
            lunch: true,
            lunchMenu: true,
            snacks: true,
            snacksMenu: true,
            sleepStart: true,
            sleepEnd: true,
            sleepQuality: true,
            moodMorning: true,
            moodAfternoon: true,
            waterGlasses: true,
            highlights: true,
            status: true,
          },
          orderBy: { date: 'desc' },
          take: 7,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found in your class' }, { status: 404 });
    }

    // Compute attendance stats for this month
    const presentDays = student.attendance.filter((a) => a.status === 'PRESENT').length;
    const absentDays = student.attendance.filter((a) => a.status === 'ABSENT').length;
    const lateDays = student.attendance.filter((a) => a.status === 'LATE').length;
    const totalDays = student.attendance.length;
    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

    // Check medical alerts
    const hasAllergies = student.medicalRecords.some(
      (m) => m.allergies && m.allergies.trim() !== '' && m.allergies.toLowerCase() !== 'none' && m.allergies.toLowerCase() !== 'nil'
    );
    const hasConditions = student.medicalRecords.some(
      (m) => m.conditions && m.conditions.trim() !== '' && m.conditions.toLowerCase() !== 'none' && m.conditions.toLowerCase() !== 'nil'
    );

    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dob: student.dob,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        aadhaarNumber: student.aadhaarNumber,
        photo: student.photo,
        rollNumber: student.rollNumber,
        admissionDate: student.admissionDate,
        status: student.status,
        class: student.class,
        parents: student.parents.map((sp) => ({
          isPrimary: sp.isPrimary,
          parent: {
            id: sp.parent.id,
            firstName: sp.parent.firstName,
            lastName: sp.parent.lastName,
            phone: sp.parent.phone,
            email: sp.parent.email,
            occupation: sp.parent.occupation,
            address: sp.parent.address,
            relation: sp.parent.relation,
            isEmergencyContact: sp.parent.isEmergencyContact,
          },
        })),
        medicalRecords: student.medicalRecords,
        medicalAlerts: hasAllergies || hasConditions,
        growthScores: student.growthScores,
        attendance: {
          thisMonth: {
            present: presentDays,
            absent: absentDays,
            late: lateDays,
            rate: attendanceRate,
          },
          records: student.attendance.map((a) => ({
            date: a.date,
            status: a.status,
            checkInTime: a.checkInTime,
            checkOutTime: a.checkOutTime,
          })),
        },
        recentDailyUpdates: student.dailyUpdates,
      },
    });
  } catch (error) {
    console.error('Teacher student detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
