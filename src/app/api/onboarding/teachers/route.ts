import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashPasswordSync } from '@/lib/auth';
import { markStepComplete, generatePassword } from '../_helpers';

interface TeacherInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification?: string;
  specialization?: string;
  branchId?: string;
  assignments?: { classId: string; role: string }[];
}

export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  const body = await request.json();
  const { teachers } = body as { teachers: TeacherInput[] };

  if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
    return NextResponse.json({ error: 'At least one teacher is required' }, { status: 400 });
  }

  const createdTeachers = [];

  for (const t of teachers) {
    if (!t.firstName || !t.lastName || !t.email || !t.phone) {
      continue;
    }

    const password = generatePassword();
    const hashedPassword = hashPasswordSync(password);

    // Create User record for teacher
    const teacherUser = await db.user.create({
      data: {
        email: t.email,
        password: hashedPassword,
        name: `${t.firstName} ${t.lastName}`,
        phone: t.phone,
        role: 'TEACHER',
        schoolId,
        branchId: t.branchId || null,
      },
    });

    // Create Teacher record
    const teacher = await db.teacher.create({
      data: {
        userId: teacherUser.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        qualification: t.qualification || null,
        specialization: t.specialization || null,
        branchId: t.branchId || null,
      },
    });

    // Assign teacher to class if class_teacher role
    if (t.assignments && Array.isArray(t.assignments)) {
      for (const assignment of t.assignments) {
        if (assignment.role === 'class_teacher' && assignment.classId) {
          await db.class.update({
            where: { id: assignment.classId },
            data: { teacherId: teacher.id },
          });
        }
      }
    }

    createdTeachers.push({ ...teacher, tempPassword: password });
  }

  // Save to onboarding draft
  await db.onboardingDraft.upsert({
    where: { schoolId },
    update: { step5Teachers: JSON.stringify(body) },
    create: { schoolId, step5Teachers: JSON.stringify(body) },
  });

  // Mark step 4 as completed
  await markStepComplete(schoolId, 4);

  return NextResponse.json({ success: true, teachers: createdTeachers });
}
