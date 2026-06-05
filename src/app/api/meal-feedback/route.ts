import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole, Role, unauthorized } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// ============================================================
// GET /api/meal-feedback — Query by filters
// Any authenticated user
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');
    const mealType = searchParams.get('mealType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    } else if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        dateFilter.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateFilter.lte = e;
      }
      where.date = dateFilter;
    }

    if (mealType) {
      where.mealType = mealType;
    }

    const feedbacks = await prisma.mealFeedback.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('[MEAL_FEEDBACK_GET]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to fetch meal feedback' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/meal-feedback — Submit feedback (Teacher or Admin)
// Supports single or array of feedbacks
// Also updates DailyUpdate flat fields for backward compatibility
// ============================================================

const MEAL_TYPE_ENUM = ['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK'] as const;

const singleFeedbackSchema = z.object({
  mealPlanItemId: z.string().min(1, 'mealPlanItemId is required'),
  studentId: z.string().min(1, 'studentId is required'),
  date: z.string().min(1, 'date is required'),
  mealType: z.enum(MEAL_TYPE_ENUM),
  rating: z.number().int().min(1).max(5),
  eatenPercent: z.number().int().refine(
    (v) => [0, 25, 50, 75, 100].includes(v),
    { message: 'eatenPercent must be one of 0, 25, 50, 75, 100' }
  ),
  comments: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, Role.TEACHER, Role.ADMIN);
    if (user instanceof NextResponse) return user;

    const body = await request.json();

    // Support both single object and array of feedbacks
    let feedbacks: z.infer<typeof singleFeedbackSchema>[];

    if (Array.isArray(body)) {
      feedbacks = z.array(singleFeedbackSchema).parse(body);
    } else {
      const validated = singleFeedbackSchema.parse(body);
      feedbacks = [validated];
    }

    let createdCount = 0;

    for (const fb of feedbacks) {
      const feedbackDate = new Date(fb.date);
      const startOfDay = new Date(fb.date);
      startOfDay.setHours(0, 0, 0, 0);

      // Create MealFeedback record
      await prisma.mealFeedback.create({
        data: {
          mealPlanItemId: fb.mealPlanItemId,
          studentId: fb.studentId,
          date: feedbackDate,
          mealType: fb.mealType,
          rating: fb.rating,
          eatenPercent: fb.eatenPercent,
          comments: fb.comments ?? null,
          reportedBy: user.userId,
        },
      });

      createdCount++;

      // ---- Backward compatibility: update DailyUpdate flat fields ----
      // Map mealType to DailyUpdate field names
      const fieldMapping: Record<string, { meal: string; menu: string }> = {
        BREAKFAST: { meal: 'breakfast', menu: 'breakfastMenu' },
        MID_MORNING_SNACK: { meal: 'snacks', menu: 'snacksMenu' },
        LUNCH: { meal: 'lunch', menu: 'lunchMenu' },
        AFTERNOON_SNACK: { meal: 'snacks', menu: 'snacksMenu' },
      };

      const fields = fieldMapping[fb.mealType];
      if (!fields) continue;

      // Get the meal item name for the menu field
      const mealPlanItem = await prisma.mealPlanItem.findUnique({
        where: { id: fb.mealPlanItemId },
        include: { mealItem: { select: { name: true } } },
      });

      const menuName = mealPlanItem?.mealItem?.name ?? '';
      const mealStatus = `${fb.eatenPercent}% eaten`;

      // Upsert DailyUpdate using the @@unique(studentId, date) key
      await prisma.dailyUpdate.upsert({
        where: {
          studentId_date: {
            studentId: fb.studentId,
            date: startOfDay,
          },
        },
        create: {
          studentId: fb.studentId,
          date: startOfDay,
          [fields.meal]: mealStatus,
          [fields.menu]: menuName,
        },
        update: {
          [fields.meal]: mealStatus,
          [fields.menu]: menuName,
        },
      });
    }

    return NextResponse.json({ created: createdCount }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: true, message: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[MEAL_FEEDBACK_POST]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to submit meal feedback' },
      { status: 500 }
    );
  }
}
