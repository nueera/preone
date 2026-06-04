import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { markStepComplete } from '../_helpers';

interface BranchInput {
  name: string;
  code?: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  workingDays?: number[];
  isHeadOffice?: boolean;
}

export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  const body = await request.json();
  const { branches } = body as { branches: BranchInput[] };

  if (!branches || !Array.isArray(branches) || branches.length === 0) {
    return NextResponse.json({ error: 'At least one branch is required' }, { status: 400 });
  }

  // Create all branches
  const createdBranches = await Promise.all(
    branches.map((b) =>
      db.branch.create({
        data: {
          schoolId,
          name: b.name,
          code: b.code || null,
          address: b.address || null,
          startTime: b.startTime || '08:00',
          endTime: b.endTime || '14:00',
          workingDays: b.workingDays ? JSON.stringify(b.workingDays) : '[1,2,3,4,5]',
          isHeadOffice: b.isHeadOffice ?? false,
        },
      })
    )
  );

  // Save to onboarding draft
  await db.onboardingDraft.upsert({
    where: { schoolId },
    update: { step2Branch: JSON.stringify(body) },
    create: { schoolId, step2Branch: JSON.stringify(body) },
  });

  // Mark step 1 as completed
  await markStepComplete(schoolId, 1);

  return NextResponse.json({ success: true, branches: createdBranches });
}
