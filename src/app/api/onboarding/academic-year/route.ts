import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { markStepComplete } from '../_helpers';

interface AcademicYearInput {
  name: string;
  startDate: string;
  endDate: string;
}

interface ClassInput {
  name: string;
  section?: string;
  branchId: string;
  capacity?: number;
  grade?: string;
}

export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  const body = await request.json();
  const { academicYear, classes } = body as { academicYear: AcademicYearInput; classes: ClassInput[] };

  if (!academicYear?.name) {
    return NextResponse.json({ error: 'Academic year name is required' }, { status: 400 });
  }

  if (!classes || !Array.isArray(classes) || classes.length === 0) {
    return NextResponse.json({ error: 'At least one class is required' }, { status: 400 });
  }

  // Create a Program record for the academic year
  const program = await db.program.create({
    data: {
      name: academicYear.name,
      description: `Academic Year: ${academicYear.startDate} to ${academicYear.endDate}`,
      ageMin: 2,
      ageMax: 18,
      branchId: classes[0]?.branchId || null,
    },
  });

  // Create Class records linked to branches and the program
  const createdClasses = await Promise.all(
    classes.map((c) =>
      db.class.create({
        data: {
          name: c.name,
          section: c.section || null,
          branchId: c.branchId || null,
          programId: program.id,
          capacity: c.capacity ?? 30,
        },
      })
    )
  );

  // Save to onboarding draft
  await db.onboardingDraft.upsert({
    where: { schoolId },
    update: { step3Academic: JSON.stringify({ academicYear, classes, programId: program.id }) },
    create: { schoolId, step3Academic: JSON.stringify({ academicYear, classes, programId: program.id }) },
  });

  // Mark step 2 as completed
  await markStepComplete(schoolId, 2);

  return NextResponse.json({ success: true, program, classes: createdClasses });
}
