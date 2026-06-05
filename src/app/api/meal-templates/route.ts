import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// ============================================================
// GET /api/meal-templates — List templates for school
// ============================================================

export const GET = withAuth(async (req, ctx) => {
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {
      schoolId: req.user.schoolId,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const templates = await prisma.mealTemplate.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[MEAL_TEMPLATES_GET]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to fetch meal templates' },
      { status: 500 }
    );
  }
});

// ============================================================
// POST /api/meal-templates — Create template (Admin only)
// ============================================================

const MEAL_TYPE_ENUM = ['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK'] as const;

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  mealTypes: z.array(z.enum(MEAL_TYPE_ENUM)).min(1, 'At least one meal type is required'),
  templateData: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
});

export const POST = withAuth(
  async (req) => {
    try {
      const body = await req.json();
      const validated = createTemplateSchema.parse(body);

      const template = await prisma.mealTemplate.create({
        data: {
          schoolId: req.user.schoolId,
          name: validated.name,
          description: validated.description ?? null,
          mealTypes: JSON.stringify(validated.mealTypes),
          templateData: JSON.stringify(validated.templateData),
        },
      });

      return NextResponse.json({ template }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: true, message: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }
      console.error('[MEAL_TEMPLATES_POST]', error);
      return NextResponse.json(
        { error: true, message: 'Failed to create meal template' },
        { status: 500 }
      );
    }
  },
  { roles: ['ADMIN'] }
);
