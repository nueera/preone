import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashPasswordSync } from '@/lib/auth';
import { markStepComplete, generatePassword } from '../_helpers';

interface StudentInput {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  classId?: string;
  bloodGroup?: string;
  admissionNo?: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  parentEmail?: string;
}

export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  const body = await request.json();
  const { students } = body as { students: StudentInput[] };

  if (!students || !Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: 'At least one student is required' }, { status: 400 });
  }

  const createdStudents = [];

  for (const s of students) {
    if (!s.firstName || !s.lastName || !s.dob || !s.gender) {
      continue;
    }

    // Get the branchId from the class if available
    let branchId: string | null = null;
    if (s.classId) {
      const cls = await db.class.findUnique({ where: { id: s.classId } });
      branchId = cls?.branchId ?? null;
    }

    // Create Student record
    const student = await db.student.create({
      data: {
        firstName: s.firstName,
        lastName: s.lastName,
        dob: new Date(s.dob),
        gender: s.gender,
        bloodGroup: s.bloodGroup || null,
        classId: s.classId || null,
        branchId,
      },
    });

    // Create Parent records if parent info is provided
    if (s.fatherName || s.motherName) {
      const parentEmail = s.parentEmail || null;

      if (s.fatherName && s.fatherPhone) {
        const father = await db.parent.create({
          data: {
            firstName: s.fatherName,
            lastName: s.lastName,
            phone: s.fatherPhone,
            email: parentEmail,
            relation: 'FATHER',
            isEmergencyContact: true,
          },
        });

        await db.studentParent.create({
          data: { studentId: student.id, parentId: father.id, isPrimary: true },
        });

        // Create User for parent if email exists
        if (parentEmail) {
          const existingUser = await db.user.findUnique({ where: { email: parentEmail } });
          if (!existingUser) {
            const password = generatePassword();
            const hashedPassword = hashPasswordSync(password);
            await db.user.create({
              data: {
                email: parentEmail,
                password: hashedPassword,
                name: `${s.fatherName} ${s.lastName}`,
                phone: s.fatherPhone,
                role: 'PARENT',
                schoolId,
              },
            });
          }
        }
      }

      if (s.motherName && s.motherPhone) {
        const motherEmail = s.fatherName ? null : parentEmail;
        const mother = await db.parent.create({
          data: {
            firstName: s.motherName,
            lastName: s.lastName,
            phone: s.motherPhone,
            email: motherEmail,
            relation: 'MOTHER',
            isEmergencyContact: !s.fatherName,
          },
        });

        await db.studentParent.create({
          data: { studentId: student.id, parentId: mother.id, isPrimary: !s.fatherName },
        });

        // Create User for mother if she has her own email
        if (motherEmail && !s.fatherName) {
          const password = generatePassword();
          const hashedPassword = hashPasswordSync(password);
          await db.user.create({
            data: {
              email: motherEmail,
              password: hashedPassword,
              name: `${s.motherName} ${s.lastName}`,
              phone: s.motherPhone,
              role: 'PARENT',
              schoolId,
            },
          });
        }
      }
    }

    createdStudents.push(student);
  }

  // Save to onboarding draft
  await db.onboardingDraft.upsert({
    where: { schoolId },
    update: { step6Students: JSON.stringify(body) },
    create: { schoolId, step6Students: JSON.stringify(body) },
  });

  // Mark step 5 as completed
  await markStepComplete(schoolId, 5);

  return NextResponse.json({ success: true, students: createdStudents });
}
