import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// ============================================================
// GET /api/meal-plans/[id] — Single meal plan with items
// ============================================================

export const GET = withAuth(async (req, ctx) => {
  try {
    const { id } = await ctx.params;

    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id, schoolId: req.user.schoolId },
      include: {
        branch: { select: { name: true } },
        items: {
          include: {
            mealItem: true,
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { mealType: 'asc' },
            { sortOrder: 'asc' },
          ],
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error('[MEAL_PLAN_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    );
  }
});

// ============================================================
// PATCH /api/meal-plans/[id] — Update meal plan (Admin only)
// ============================================================

const MealTypeEnum = z.enum([
  'BREAKFAST',
  'MID_MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
]);

const updateMealPlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  mealTypes: z.array(MealTypeEnum).optional(),
  targetClassIds: z.array(z.string()).nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const PATCH = withAuth(
  async (req, ctx) => {
    try {
      const { id } = await ctx.params;

      const existing = await prisma.mealPlan.findFirst({
        where: { id, schoolId: req.user.schoolId },
      });

      if (!existing) {
        return NextResponse.json(
          { error: 'Meal plan not found' },
          { status: 404 }
        );
      }

      const body = await req.json();
      const validated = updateMealPlanSchema.parse(body);

      // If status changed to ARCHIVED, just update and return
      if (validated.status === 'ARCHIVED' && Object.keys(validated).length === 1) {
        const mealPlan = await prisma.mealPlan.update({
          where: { id },
          data: { status: 'ARCHIVED' },
          include: {
            items: {
              include: { mealItem: true },
              orderBy: [
                { dayOfWeek: 'asc' },
                { mealType: 'asc' },
                { sortOrder: 'asc' },
              ],
            },
          },
        });
        return NextResponse.json({ mealPlan });
      }

      // Validate date range if dates are being updated
      const startDate = validated.startDate ?? existing.startDate;
      const endDate = validated.endDate ?? existing.endDate;

      if (endDate < startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }

      // Build update data
      const updateData: Record<string, unknown> = {};

      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.description !== undefined)
        updateData.description = validated.description;
      if (validated.branchId !== undefined)
        updateData.branchId = validated.branchId;
      if (validated.startDate !== undefined)
        updateData.startDate = startDate;
      if (validated.endDate !== undefined) updateData.endDate = endDate;

      // Stringify mealTypes and targetClassIds before saving
      if (validated.mealTypes !== undefined)
        updateData.mealTypes = JSON.stringify(validated.mealTypes);
      if (validated.targetClassIds !== undefined)
        updateData.targetClassIds = validated.targetClassIds
          ? JSON.stringify(validated.targetClassIds)
          : null;

      if (validated.status !== undefined) updateData.status = validated.status;

      const mealPlan = await prisma.mealPlan.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            include: { mealItem: true },
            orderBy: [
              { dayOfWeek: 'asc' },
              { mealType: 'asc' },
              { sortOrder: 'asc' },
            ],
          },
        },
      });

      return NextResponse.json({ mealPlan });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }
      console.error('[MEAL_PLAN_PATCH]', error);
      return NextResponse.json(
        { error: 'Failed to update meal plan' },
        { status: 500 }
      );
    }
  },
  { roles: ['ADMIN'] }
);

// ============================================================
// DELETE /api/meal-plans/[id] — Delete meal plan (Admin only)
// ============================================================

export const DELETE = withAuth(
  async (req, ctx) => {
    try {
      const { id } = await ctx.params;

      const existing = await prisma.mealPlan.findFirst({
        where: { id, schoolId: req.user.schoolId },
      });

      if (!existing) {
        return NextResponse.json(
          { error: 'Meal plan not found' },
          { status: 404 }
        );
      }

      // Cascade will delete items, but be explicit
      await prisma.mealPlanItem.deleteMany({
        where: { mealPlanId: id },
      });

      await prisma.mealPlan.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[MEAL_PLAN_DELETE]', error);
      return NextResponse.json(
        { error: 'Failed to delete meal plan' },
        { status: 500 }
      );
    }
  },
  { roles: ['ADMIN'] }
);
