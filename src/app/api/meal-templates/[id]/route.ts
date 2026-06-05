import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireAdmin, unauthorized } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// ============================================================
// Helper: Parse [id] from URL
// ============================================================

function getIdFromUrl(request: NextRequest): string {
  const parts = request.url.split('/');
  const apiIndex = parts.indexOf('api');
  return parts[apiIndex + 2] || '';
}

// ============================================================
// GET /api/meal-templates/[id] — Single template
// Any authenticated user
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    if (!user.schoolId) {
      return NextResponse.json({ error: true, message: 'No school assigned' }, { status: 403 });
    }

    const id = getIdFromUrl(request);

    const template = await prisma.mealTemplate.findFirst({
      where: { id, schoolId: user.schoolId },
    });

    if (!template) {
      return NextResponse.json(
        { error: true, message: 'Meal template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('[MEAL_TEMPLATE_GET]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to fetch meal template' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH /api/meal-templates/[id] — Update template (Admin only)
// ============================================================

const MEAL_TYPE_ENUM = ['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK'] as const;

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  mealTypes: z.array(z.enum(MEAL_TYPE_ENUM)).optional(),
  templateData: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;
    if (!user.schoolId) {
      return NextResponse.json({ error: true, message: 'No school assigned' }, { status: 403 });
    }

    const id = getIdFromUrl(request);

    const existing = await prisma.mealTemplate.findFirst({
      where: { id, schoolId: user.schoolId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: true, message: 'Meal template not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateTemplateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.mealTypes) updateData.mealTypes = JSON.stringify(validated.mealTypes);
    if (validated.templateData !== undefined)
      updateData.templateData = JSON.stringify(validated.templateData);
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const template = await prisma.mealTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: true, message: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[MEAL_TEMPLATE_PATCH]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to update meal template' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/meal-templates/[id] — Delete template (Admin only)
// ============================================================

export async function DELETE(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;
    if (!user.schoolId) {
      return NextResponse.json({ error: true, message: 'No school assigned' }, { status: 403 });
    }

    const id = getIdFromUrl(request);

    const existing = await prisma.mealTemplate.findFirst({
      where: { id, schoolId: user.schoolId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: true, message: 'Meal template not found' },
        { status: 404 }
      );
    }

    await prisma.mealTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MEAL_TEMPLATE_DELETE]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to delete meal template' },
      { status: 500 }
    );
  }
}
