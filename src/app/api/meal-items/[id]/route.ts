import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// ============================================================
// Zod Schemas
// ============================================================

const AllergenTypeEnum = z.enum([
  'MILK', 'EGGS', 'FISH', 'SHELLFISH', 'TREE_NUTS', 'PEANUTS',
  'WHEAT', 'SOYBEAN', 'SESAME', 'CELERY', 'MUSTARD', 'LUPIN',
  'MOLLUSCS', 'SULPHITES', 'GLUTEN', 'HONEY', 'SUGAR',
]);

const MealTypeEnum = z.enum([
  'BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK',
]);

const updateMealItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  mealType: MealTypeEnum.optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isEggless: z.boolean().optional(),
  servingSize: z.string().optional(),
  calories: z.number().int().optional(),
  protein: z.number().optional(),
  carbohydrates: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
  sugar: z.number().optional(),
  calcium: z.number().int().optional(),
  iron: z.number().optional(),
  vitaminC: z.number().optional(),
  vitamins: z.record(z.string(), z.unknown()).optional(),
  allergens: z.array(AllergenTypeEnum).optional(),
  mayContain: z.array(AllergenTypeEnum).optional(),
  ingredients: z.array(z.unknown()).optional(),
  prepTime: z.number().int().nullable().optional(),
  cookTime: z.number().int().nullable().optional(),
  recipe: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  cuisine: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  suitableAgeMin: z.number().int().nullable().optional(),
  suitableAgeMax: z.number().int().nullable().optional(),
  costPerServing: z.number().nullable().optional(),
});

// ============================================================
// GET /api/meal-items/[id] — Single meal item
// ============================================================

export const GET = withAuth(async (req, ctx) => {
  try {
    const { id } = await ctx.params;

    const mealItem = await prisma.mealItem.findFirst({
      where: { id, schoolId: req.user.schoolId },
    });

    if (!mealItem) {
      return NextResponse.json(
        { error: 'Meal item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ mealItem });
  } catch (error) {
    console.error('[MEAL_ITEM_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal item' },
      { status: 500 }
    );
  }
});

// ============================================================
// PATCH /api/meal-items/[id] — Update meal item (Admin only)
// ============================================================

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = await ctx.params;

    const existing = await prisma.mealItem.findFirst({
      where: { id, schoolId: req.user.schoolId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Meal item not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validated = updateMealItemSchema.parse(body);

    // Build update data, converting JSON array/object fields to strings
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(validated)) {
      if (value === undefined) continue;

      if (key === 'vitamins' || key === 'allergens' || key === 'mayContain' || key === 'ingredients' || key === 'tags') {
        updateData[key] = JSON.stringify(value);
      } else {
        updateData[key] = value;
      }
    }

    const mealItem = await prisma.mealItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ mealItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[MEAL_ITEM_PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update meal item' },
      { status: 500 }
    );
  }
}, { roles: ['ADMIN'] });

// ============================================================
// DELETE /api/meal-items/[id] — Soft delete (Admin only)
// ============================================================

export const DELETE = withAuth(async (req, ctx) => {
  try {
    const { id } = await ctx.params;

    const existing = await prisma.mealItem.findFirst({
      where: { id, schoolId: req.user.schoolId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Meal item not found' },
        { status: 404 }
      );
    }

    await prisma.mealItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MEAL_ITEM_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete meal item' },
      { status: 500 }
    );
  }
}, { roles: ['ADMIN'] });
