import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// ============================================================
// Helper: Recalculate nutrition summary
// ============================================================

async function recalculateNutritionSummary(mealPlanId: string) {
  // Get all non-alternative items with their mealItem nutrition data
  const items = await prisma.mealPlanItem.findMany({
    where: { mealPlanId, isAlternative: false },
    include: {
      mealItem: {
        select: {
          calories: true,
          protein: true,
          calcium: true,
          iron: true,
          vitaminC: true,
        },
      },
    },
  });

  // Group by dayOfWeek, sum per day, then average across days
  const byDay: Record<
    number,
    { calories: number; protein: number; iron: number; calcium: number; vitaminC: number }
  > = {};

  for (const item of items) {
    const d = item.dayOfWeek;
    if (!byDay[d]) {
      byDay[d] = { calories: 0, protein: 0, iron: 0, calcium: 0, vitaminC: 0 };
    }
    byDay[d].calories += item.mealItem?.calories ?? 0;
    byDay[d].protein += item.mealItem?.protein ?? 0;
    byDay[d].iron += item.mealItem?.iron ?? 0;
    byDay[d].calcium += item.mealItem?.calcium ?? 0;
    byDay[d].vitaminC += item.mealItem?.vitaminC ?? 0;
  }

  const dayKeys = Object.keys(byDay);
  const dayCount = dayKeys.length || 1;

  let totalCalories = 0;
  let totalProtein = 0;
  let totalIron = 0;
  let totalCalcium = 0;
  let totalVitaminC = 0;

  for (const key of dayKeys) {
    totalCalories += byDay[Number(key)].calories;
    totalProtein += byDay[Number(key)].protein;
    totalIron += byDay[Number(key)].iron;
    totalCalcium += byDay[Number(key)].calcium;
    totalVitaminC += byDay[Number(key)].vitaminC;
  }

  await prisma.mealPlan.update({
    where: { id: mealPlanId },
    data: {
      avgDailyCalories: Math.round(totalCalories / dayCount),
      avgDailyProtein:
        Math.round((totalProtein / dayCount) * 10) / 10,
      avgDailyIron:
        Math.round((totalIron / dayCount) * 10) / 10,
      avgDailyCalcium: Math.round(totalCalcium / dayCount),
      avgDailyVitaminC: Math.round(totalVitaminC / dayCount),
    },
  });
}

// ============================================================
// GET /api/meal-plans/[id]/items — Get all items for a meal plan
// ============================================================

export const GET = withAuth(async (req, ctx) => {
  try {
    const { id } = await ctx.params;

    // Verify meal plan exists and belongs to school
    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id, schoolId: req.user.schoolId },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    const items = await prisma.mealPlanItem.findMany({
      where: { mealPlanId: id },
      include: {
        mealItem: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { mealType: 'asc' },
        { sortOrder: 'asc' },
      ],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('[MEAL_PLAN_ITEMS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plan items' },
      { status: 500 }
    );
  }
});

// ============================================================
// PUT /api/meal-plans/[id]/items — Replace all items (Admin only)
// ============================================================

const mealPlanItemSchema = z.object({
  mealItemId: z.string(),
  dayOfWeek: z.number().int().min(1).max(5),
  mealType: z.enum([
    'BREAKFAST',
    'MID_MORNING_SNACK',
    'LUNCH',
    'AFTERNOON_SNACK',
  ]),
  isAlternative: z.boolean().default(false),
  alternativeFor: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

const replaceItemsSchema = z.object({
  items: z.array(mealPlanItemSchema),
});

export const PUT = withAuth(
  async (req, ctx) => {
    try {
      const { id } = await ctx.params;

      // Verify meal plan exists and belongs to school
      const mealPlan = await prisma.mealPlan.findFirst({
        where: { id, schoolId: req.user.schoolId },
      });

      if (!mealPlan) {
        return NextResponse.json(
          { error: 'Meal plan not found' },
          { status: 404 }
        );
      }

      const body = await req.json();
      const validated = replaceItemsSchema.parse(body);

      // Validate all meal item IDs exist
      const mealItemIds = [...new Set(validated.items.map((i) => i.mealItemId))];
      const mealItems = await prisma.mealItem.findMany({
        where: {
          id: { in: mealItemIds },
          schoolId: req.user.schoolId,
          isActive: true,
        },
      });

      const foundIds = new Set(mealItems.map((i) => i.id));
      const missingIds = mealItemIds.filter((mid) => !foundIds.has(mid));
      if (missingIds.length > 0) {
        return NextResponse.json(
          { error: 'Some meal items not found or inactive', missingIds },
          { status: 400 }
        );
      }

      const mealItemMap = new Map(mealItems.map((i) => [i.id, i]));

      // Delete existing items (full replace)
      await prisma.mealPlanItem.deleteMany({
        where: { mealPlanId: id },
      });

      // Create new MealPlanItems
      const created = await prisma.mealPlanItem.createMany({
        data: validated.items.map((item) => ({
          mealPlanId: id,
          mealItemId: item.mealItemId,
          dayOfWeek: item.dayOfWeek,
          mealType: item.mealType,
          isAlternative: item.isAlternative,
          alternativeFor: item.alternativeFor ?? null,
          sortOrder: item.sortOrder,
        })),
      });

      // Increment usageCount on referenced MealItems
      for (const mealItemId of mealItemIds) {
        await prisma.mealItem.update({
          where: { id: mealItemId },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Recalculate nutrition summary
      await recalculateNutritionSummary(id);

      // Check for allergy conflicts: for each non-alternative item,
      // check if any student in target classes has allergies matching
      // the meal item's allergens
      const warnings: Array<{
        studentName: string;
        allergen: string;
        mealItem: string;
      }> = [];

      let targetClassIds: string[] = [];
      try {
        targetClassIds = mealPlan.targetClassIds
          ? JSON.parse(mealPlan.targetClassIds)
          : [];
      } catch {
        targetClassIds = [];
      }

      if (targetClassIds.length > 0) {
        // Get students in target classes with active allergies
        const students = await prisma.student.findMany({
          where: {
            classId: { in: targetClassIds },
            status: 'ACTIVE',
          },
          include: {
            allergies: {
              where: { isActive: true },
              select: { allergen: true },
            },
          },
        });

        // Only check non-alternative items for conflicts
        const nonAlternativeItems = validated.items.filter(
          (item) => !item.isAlternative
        );

        for (const student of students) {
          if (student.allergies.length === 0) continue;
          const studentAllergens = student.allergies.map((a) =>
            String(a.allergen)
          );

          for (const item of nonAlternativeItems) {
            const mealItemData = mealItemMap.get(item.mealItemId);
            if (!mealItemData) continue;

            try {
              const itemAllergens: string[] = JSON.parse(
                mealItemData.allergens || '[]'
              );
              const itemMayContain: string[] = JSON.parse(
                mealItemData.mayContain || '[]'
              );
              const combined = [...itemAllergens, ...itemMayContain];

              const conflictingAllergens = combined.filter((a) =>
                studentAllergens.includes(a)
              );
              if (conflictingAllergens.length > 0) {
                warnings.push({
                  studentName: `${student.firstName} ${student.lastName}`,
                  allergen: conflictingAllergens.join(', '),
                  mealItem: mealItemData.name,
                });
              }
            } catch {
              // Skip JSON parse errors
            }
          }
        }
      }

      return NextResponse.json(
        { created: created.count, warnings },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }
      console.error('[MEAL_PLAN_ITEMS_PUT]', error);
      return NextResponse.json(
        { error: 'Failed to replace meal plan items' },
        { status: 500 }
      );
    }
  },
  { roles: ['ADMIN'] }
);
