import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireAdmin, unauthorized } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ============================================================
// GET /api/meal-plans — List meal plans with filters
// Any authenticated user
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    if (!user.schoolId) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const branchId = searchParams.get('branchId');

    const where: Record<string, unknown> = {
      schoolId: user.schoolId,
    };

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (from || to) {
      where.AND = [
        { startDate: { lte: to ? new Date(to) : undefined } },
        { endDate: { gte: from ? new Date(from) : undefined } },
      ].filter((f) => {
        const vals = Object.values(f);
        return vals.some((v) => v !== undefined);
      });
    }

    const mealPlans = await db.mealPlan.findMany({
      where,
      include: {
        _count: { select: { items: true } },
        branch: { select: { name: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ mealPlans });
  } catch (error) {
    console.error('[MEAL_PLANS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/meal-plans — Create meal plan (Admin only)
// ============================================================

const MealTypeEnum = z.enum([
  'BREAKFAST',
  'MID_MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
]);

const createMealPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  branchId: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  mealTypes: z.array(MealTypeEnum).default([
    'BREAKFAST',
    'MID_MORNING_SNACK',
    'LUNCH',
    'AFTERNOON_SNACK',
  ]),
  targetClassIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;
    if (!user.schoolId) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createMealPlanSchema.parse(body);

    // Validate endDate > startDate
    if (validated.endDate <= validated.startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping meal plans
    // Same schoolId, same branchId (or both null), status in DRAFT/PUBLISHED, date ranges overlap
    const overlapping = await db.mealPlan.findFirst({
      where: {
        schoolId: user.schoolId,
        status: { in: ['DRAFT', 'PUBLISHED'] },
        ...(validated.branchId
          ? { branchId: validated.branchId }
          : { branchId: null }),
        startDate: { lte: validated.endDate },
        endDate: { gte: validated.startDate },
      },
    });

    if (overlapping) {
      return NextResponse.json(
        {
          error:
            'A meal plan already exists that overlaps with the specified date range for this branch',
          overlappingPlan: { id: overlapping.id, name: overlapping.name },
        },
        { status: 409 }
      );
    }

    // Stringify mealTypes and targetClassIds before saving (SQLite compat)
    const mealPlan = await db.mealPlan.create({
      data: {
        schoolId: user.schoolId,
        branchId: validated.branchId ?? null,
        name: validated.name,
        description: validated.description ?? null,
        startDate: validated.startDate,
        endDate: validated.endDate,
        mealTypes: JSON.stringify(validated.mealTypes),
        targetClassIds: validated.targetClassIds
          ? JSON.stringify(validated.targetClassIds)
          : null,
        status: 'DRAFT',
      },
    });

    return NextResponse.json({ mealPlan }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[MEAL_PLANS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create meal plan' },
      { status: 500 }
    );
  }
}
