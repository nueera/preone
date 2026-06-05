import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAuthUser, unauthorized } from '@/lib/auth';
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

const createMealItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  mealType: MealTypeEnum,
  isVegetarian: z.boolean().default(true),
  isVegan: z.boolean().default(false),
  isEggless: z.boolean().default(true),
  servingSize: z.string().default('1 serving'),
  calories: z.number().int().default(0),
  protein: z.number().default(0),
  carbohydrates: z.number().default(0),
  fat: z.number().default(0),
  fiber: z.number().default(0),
  sugar: z.number().default(0),
  calcium: z.number().int().default(0),
  iron: z.number().default(0),
  vitaminC: z.number().default(0),
  vitamins: z.record(z.string(), z.unknown()).default({}),
  allergens: z.array(AllergenTypeEnum).default([]),
  mayContain: z.array(AllergenTypeEnum).default([]),
  ingredients: z.array(z.unknown()).default([]),
  prepTime: z.number().int().optional(),
  cookTime: z.number().int().optional(),
  recipe: z.string().optional(),
  category: z.string().optional(),
  cuisine: z.string().optional(),
  tags: z.array(z.string()).default([]),
  suitableAgeMin: z.number().int().optional(),
  suitableAgeMax: z.number().int().optional(),
  costPerServing: z.number().optional(),
});

// ============================================================
// GET /api/meal-items — List meal items with filters
// Any authenticated user
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const mealType = searchParams.get('mealType');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const allergenFree = searchParams.get('allergenFree');
    const isVegetarian = searchParams.get('isVegetarian');
    const isVegan = searchParams.get('isVegan');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {
      schoolId: user.schoolId!,
    };

    // Default to active items only, unless explicitly requested
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    } else {
      where.isActive = true;
    }

    if (mealType) {
      where.mealType = mealType;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (isVegetarian === 'true') {
      where.isVegetarian = true;
    }
    if (isVegan === 'true') {
      where.isVegan = true;
    }

    let items = await prisma.mealItem.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
    });

    // Filter out items containing specified allergens (post-query filter
    // because allergens are stored as JSON strings, not queryable natively)
    if (allergenFree) {
      const forbiddenAllergens = allergenFree
        .split(',')
        .map((a) => a.trim().toUpperCase())
        .filter(Boolean);

      if (forbiddenAllergens.length > 0) {
        items = items.filter((item) => {
          try {
            const itemAllergens: string[] = JSON.parse(item.allergens || '[]');
            const itemMayContain: string[] = JSON.parse(item.mayContain || '[]');
            const combined = [...itemAllergens, ...itemMayContain];
            return !combined.some((a) => forbiddenAllergens.includes(a));
          } catch {
            // If JSON parse fails, keep the item (safe default)
            return true;
          }
        });
      }
    }

    return NextResponse.json({ mealItems: items });
  } catch (error) {
    console.error('[MEAL_ITEMS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal items' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/meal-items — Create meal item (Admin only)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const validated = createMealItemSchema.parse(body);

    const mealItem = await prisma.mealItem.create({
      data: {
        schoolId: user.schoolId!,
        name: validated.name,
        description: validated.description,
        image: validated.image,
        mealType: validated.mealType,
        isVegetarian: validated.isVegetarian,
        isVegan: validated.isVegan,
        isEggless: validated.isEggless,
        servingSize: validated.servingSize,
        calories: validated.calories,
        protein: validated.protein,
        carbohydrates: validated.carbohydrates,
        fat: validated.fat,
        fiber: validated.fiber,
        sugar: validated.sugar,
        calcium: validated.calcium,
        iron: validated.iron,
        vitaminC: validated.vitaminC,
        // Convert JSON arrays/objects to strings for SQLite storage
        vitamins: JSON.stringify(validated.vitamins),
        allergens: JSON.stringify(validated.allergens),
        mayContain: JSON.stringify(validated.mayContain),
        ingredients: JSON.stringify(validated.ingredients),
        prepTime: validated.prepTime,
        cookTime: validated.cookTime,
        recipe: validated.recipe,
        category: validated.category,
        cuisine: validated.cuisine,
        tags: JSON.stringify(validated.tags),
        suitableAgeMin: validated.suitableAgeMin,
        suitableAgeMax: validated.suitableAgeMax,
        costPerServing: validated.costPerServing,
      },
    });

    return NextResponse.json({ mealItem }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[MEAL_ITEMS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create meal item' },
      { status: 500 }
    );
  }
}
