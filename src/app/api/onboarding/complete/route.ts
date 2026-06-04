import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashPasswordSync } from '@/lib/auth';

/**
 * POST /api/onboarding/complete
 * Finalizes onboarding by:
 * 1. Creating real records from draft data (branches, classes, subjects, teachers, students, parents)
 * 2. Marking onboardingComplete = true on School
 * 3. Cleaning up the draft
 * 4. Setting localStorage flag (via response)
 */
export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // ── 1. Update School profile from draft ──
    const schoolUpdate: Record<string, unknown> = {};
    if (body.schoolName) schoolUpdate.name = body.schoolName;
    if (body.schoolEmail) schoolUpdate.email = body.schoolEmail;
    if (body.schoolPhone) schoolUpdate.phone = body.schoolPhone;
    if (body.schoolAddress) schoolUpdate.address = body.schoolAddress;
    if (body.schoolBoard) schoolUpdate.board = body.schoolBoard;
    if (body.schoolWebsite) schoolUpdate.website = body.schoolWebsite;
    if (body.schoolLogo) schoolUpdate.logo = body.schoolLogo;

    await db.school.update({
      where: { id: schoolId },
      data: {
        ...schoolUpdate,
        onboardingComplete: true,
      },
    });

    // ── 2. Create Branches from draft ──
    const branchIdMap: Record<string, string> = {};
    const draftBranches = Array.isArray(body.branches) ? body.branches : [];

    for (const branch of draftBranches) {
      const b = branch as Record<string, unknown>;
      const created = await db.branch.create({
        data: {
          schoolId,
          name: (b.name as string) || 'Main Campus',
          code: (b.code as string) || 'MAIN',
          address: (b.address as string) || null,
          phone: (b.phone as string) || null,
          isHeadOffice: b.isPrimary === true,
          startTime: (b.startTime as string) || '08:00',
          endTime: (b.endTime as string) || '14:00',
        },
      });
      branchIdMap[b.id as string] = created.id;
    }

    // If no branches were created, create a default one
    if (draftBranches.length === 0) {
      const defaultBranch = await db.branch.create({
        data: {
          schoolId,
          name: 'Main Campus',
          code: 'MAIN',
          isHeadOffice: true,
        },
      });
      branchIdMap['default'] = defaultBranch.id;
    }

    // ── 3. Create Programs + Classes from draft ──
    const classIdMap: Record<string, string> = {};
    const draftClasses = Array.isArray(body.classes) ? body.classes : [];

    // Group classes by grade name to create programs
    const gradeNames = [...new Set(draftClasses.map((c: Record<string, unknown>) => c.name as string))];

    for (const gradeName of gradeNames) {
      const gradeClasses = draftClasses.filter(
        (c: Record<string, unknown>) => c.name === gradeName
      );
      const firstClass = gradeClasses[0] as Record<string, unknown>;
      const mappedBranchId = branchIdMap[firstClass?.branchId as string] || Object.values(branchIdMap)[0];

      const program = await db.program.create({
        data: {
          name: gradeName,
          branchId: mappedBranchId,
        },
      });

      for (const cls of gradeClasses) {
        const c = cls as Record<string, unknown>;
        const clsBranchId = branchIdMap[c.branchId as string] || Object.values(branchIdMap)[0];
        const created = await db.class.create({
          data: {
            name: gradeName,
            programId: program.id,
            section: (c.section as string) || 'A',
            branchId: clsBranchId,
            capacity: 30,
          },
        });
        classIdMap[c.id as string] = created.id;
      }
    }

    // ── 4. Create Teachers from draft ──
    const draftTeachers = Array.isArray(body.teachers) ? body.teachers : [];
    const teacherIdMap: Record<string, string> = {};

    for (const teacher of draftTeachers) {
      const t = teacher as Record<string, unknown>;
      const name = (t.name as string) || '';
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'Teacher';
      const lastName = nameParts.slice(1).join(' ') || '';

      try {
        const created = await db.teacher.create({
          data: {
            firstName,
            lastName,
            email: (t.email as string) || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.com`,
            phone: (t.phone as string) || '',
            branchId: Object.values(branchIdMap)[0],
          },
        });
        teacherIdMap[t.id as string] = created.id;
      } catch (err) {
        // Skip duplicate teacher emails
        console.error('Skip teacher (duplicate?):', err);
      }
    }

    // ── 5. Create Students + Parents from draft ──
    const draftStudents = Array.isArray(body.students) ? body.students : [];

    for (const student of draftStudents) {
      const s = student as Record<string, unknown>;
      const name = (s.name as string) || '';
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || '';
      const mappedClassId = classIdMap[s.classId as string] || Object.values(classIdMap)[0];

      try {
        // Create parent first
        const parentPhone = (s.parentPhone as string) || '';
        const parentName = (s.parentName as string) || 'Parent';

        const parent = await db.parent.create({
          data: {
            firstName: parentName.split(' ')[0] || 'Parent',
            lastName: parentName.split(' ').slice(1).join(' ') || '',
            phone: parentPhone,
            email: (s.parentEmail as string) || null,
            relation: 'Father',
            isEmergencyContact: true,
          },
        });

        // Create student
        const createdStudent = await db.student.create({
          data: {
            firstName,
            lastName,
            dob: new Date('2020-01-01'), // placeholder
            gender: 'male',
            classId: mappedClassId,
            branchId: Object.values(branchIdMap)[0],
          },
        });

        // Link student to parent
        await db.studentParent.create({
          data: {
            studentId: createdStudent.id,
            parentId: parent.id,
            isPrimary: true,
          },
        });

        // Create user account for parent if email is provided
        if (s.parentEmail) {
          try {
            const tempPassword = Math.random().toString(36).slice(2, 10);
            await db.user.create({
              data: {
                email: s.parentEmail as string,
                password: hashPasswordSync(tempPassword),
                name: parentName,
                phone: parentPhone,
                role: 'PARENT',
                schoolId,
              },
            });
          } catch {
            // Skip duplicate user emails
          }
        }
      } catch (err) {
        console.error('Skip student (error):', err);
      }
    }

    // ── 6. Create DailyUpdateConfig from draft ──
    const categories = Array.isArray(body.updateCategories) ? body.updateCategories : [];
    if (categories.length > 0) {
      const categoryMap: Record<string, boolean> = {};
      for (const cat of categories) {
        categoryMap[cat as string] = true;
      }

      await db.dailyUpdateConfig.upsert({
        where: { schoolId },
        update: {
          sendAttendance: categoryMap.attendance ?? true,
          sendMood: categoryMap.mood ?? false,
          sendActivities: categoryMap.activities ?? false,
          sendMeals: categoryMap.meals ?? false,
          sendNap: categoryMap.nap ?? false,
          sendPhotos: categoryMap.photos ?? false,
          sendNotes: categoryMap.teacher_notes ?? false,
          isActive: true,
        },
        create: {
          schoolId,
          sendAttendance: categoryMap.attendance ?? true,
          sendMood: categoryMap.mood ?? false,
          sendActivities: categoryMap.activities ?? false,
          sendMeals: categoryMap.meals ?? false,
          sendNap: categoryMap.nap ?? false,
          sendPhotos: categoryMap.photos ?? false,
          sendNotes: categoryMap.teacher_notes ?? false,
          isActive: true,
        },
      });
    }

    // ── 7. Clean up draft ──
    await db.onboardingDraft.deleteMany({
      where: { schoolId },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding complete! Your school is ready.',
      created: {
        branches: Object.keys(branchIdMap).length,
        classes: Object.keys(classIdMap).length,
        teachers: Object.keys(teacherIdMap).length,
        students: draftStudents.length,
      },
    });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
