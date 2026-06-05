import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// ============================================================
// GET /api/meal-items/allergy-safe — Allergy-safe meal items
// Query: studentId (required), mealType (optional)
// ============================================================

export const GET = withAuth(async (req, ctx) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const mealType = searchParams.get('mealType');

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required' },
        { status: 400 }
      );
    }

    // Get student's active allergies
    const studentAllergies = await prisma.studentAllergy.findMany({
      where: { studentId, isActive: true },
      select: {
        id: true,
        allergen: true,
        severity: true,
        reaction: true,
        notes: true,
        diagnosedDate: true,
        isVerified: true,
      },
    });

    // Build the list of dangerous allergen types (uppercase strings matching AllergenType enum)
    const dangerousAllergens = studentAllergies.map((a) => String(a.allergen));

    // Build base query for meal items
    const where: Record<string, unknown> = {
      schoolId: req.user.schoolId,
      isActive: true,
    };

    if (mealType) {
      where.mealType = mealType;
    }

    const allItems = await prisma.mealItem.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
    });

    // Filter items: exclude those whose allergens or mayContain arrays
    // include any of the student's allergens (parsed from JSON string fields)
    const safeItems: typeof allItems[number][] = [];
    let unsafeCount = 0;

    for (const item of allItems) {
      try {
        const itemAllergens: string[] = JSON.parse(item.allergens || '[]');
        const itemMayContain: string[] = JSON.parse(item.mayContain || '[]');
        const combined = [...itemAllergens, ...itemMayContain];

        const hasConflict = combined.some((a) => dangerousAllergens.includes(a));
        if (hasConflict) {
          unsafeCount++;
        } else {
          safeItems.push(item);
        }
      } catch {
        // If JSON parse fails, include the item as safe (conservative default)
        safeItems.push(item);
      }
    }

    return NextResponse.json({
      studentAllergies,
      dangerousAllergens,
      safeItems,
      unsafeCount,
    });
  } catch (error) {
    console.error('[ALLERGY_SAFE_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch allergy-safe items' },
      { status: 500 }
    );
  }
});
