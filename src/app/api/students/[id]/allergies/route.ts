import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { AllergenType } from '@prisma/client';
import { z } from 'zod';

// ============================================================
// Zod Schemas
// ============================================================

const AllergenTypeEnum = z.enum([
  'MILK', 'EGGS', 'FISH', 'SHELLFISH', 'TREE_NUTS', 'PEANUTS',
  'WHEAT', 'SOYBEAN', 'SESAME', 'CELERY', 'MUSTARD', 'LUPIN',
  'MOLLUSCS', 'SULPHITES', 'GLUTEN', 'HONEY', 'SUGAR',
]);

const AllergySeverityEnum = z.enum(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']);

const addAllergySchema = z.object({
  allergen: AllergenTypeEnum,
  severity: AllergySeverityEnum.default('MILD'),
  reaction: z.string().optional(),
  notes: z.string().optional(),
  diagnosedDate: z.string().optional(),
  diagnosedBy: z.string().optional(),
  actionPlan: z.string().optional(),
});

// ============================================================
// GET /api/students/[id]/allergies — List allergies for a student
// ============================================================

export const GET = withAuth(async (req, ctx) => {
  try {
    const { id: studentId } = await ctx.params;

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: true, message: 'Student not found' },
        { status: 404 }
      );
    }

    const allergies = await prisma.studentAllergy.findMany({
      where: {
        studentId,
        isActive: true,
      },
      orderBy: { severity: 'desc' },
    });

    return NextResponse.json({ allergies });
  } catch (error) {
    console.error('[STUDENT_ALLERGIES_GET]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to fetch student allergies' },
      { status: 500 }
    );
  }
});

// ============================================================
// POST /api/students/[id]/allergies — Add allergy (Admin/Parent only)
// ============================================================

export const POST = withAuth(
  async (req, ctx) => {
    try {
      const { id: studentId } = await ctx.params;

      // Verify student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return NextResponse.json(
          { error: true, message: 'Student not found' },
          { status: 404 }
        );
      }

      const body = await req.json();
      const validated = addAllergySchema.parse(body);

      // Check for @@unique constraint — if active allergy already exists for this student+allergen, return 409
      const existing = await prisma.studentAllergy.findFirst({
        where: {
          studentId,
          allergen: validated.allergen,
          isActive: true,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: true, message: `Student already has an active ${validated.allergen} allergy record` },
          { status: 409 }
        );
      }

      // If PARENT role, auto-verify the allergy
      const isVerified = req.user.role === 'PARENT';
      const verifiedBy = req.user.role === 'PARENT' ? req.user.id : null;
      const verifiedAt = req.user.role === 'PARENT' ? new Date() : null;

      const allergy = await prisma.studentAllergy.create({
        data: {
          studentId,
          allergen: validated.allergen,
          severity: validated.severity,
          reaction: validated.reaction,
          notes: validated.notes,
          diagnosedDate: validated.diagnosedDate ? new Date(validated.diagnosedDate) : null,
          diagnosedBy: validated.diagnosedBy,
          actionPlan: validated.actionPlan,
          isVerified,
          verifiedBy,
          verifiedAt,
        },
      });

      // If severity is SEVERE or LIFE_THREATENING, create notification for the class teacher
      if (validated.severity === 'SEVERE' || validated.severity === 'LIFE_THREATENING') {
        try {
          if (student.classId) {
            const classWithTeacher = await prisma.class.findUnique({
              where: { id: student.classId },
              include: {
                teacher: {
                  include: { user: true },
                },
              },
            });

            if (classWithTeacher?.teacher?.user) {
              await prisma.notification.create({
                data: {
                  schoolId: req.user.schoolId,
                  userId: classWithTeacher.teacher.user.id,
                  title: `⚠️ Severe Allergy Alert: ${student.firstName} ${student.lastName}`,
                  message: `Student ${student.firstName} ${student.lastName} has a ${validated.severity} allergy to ${validated.allergen}. Please review the action plan.`,
                  type: 'ALLERGY_ALERT',
                  category: 'ALLERGY',
                  senderId: req.user.id,
                },
              });
            }
          }
        } catch (notificationError) {
          // Don't fail the main request if notification creation fails
          console.error('[STUDENT_ALLERGIES_POST_NOTIFICATION]', notificationError);
        }
      }

      return NextResponse.json({ allergy }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: true, message: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }
      console.error('[STUDENT_ALLERGIES_POST]', error);
      return NextResponse.json(
        { error: true, message: 'Failed to add student allergy' },
        { status: 500 }
      );
    }
  },
  { roles: ['ADMIN', 'PARENT'] }
);

// ============================================================
// DELETE /api/students/[id]/allergies — Soft delete (Admin/Parent only)
// Query param: allergen (required) — uses compound unique key [studentId, allergen]
// ============================================================

export const DELETE = withAuth(
  async (req, ctx) => {
    try {
      const { id: studentId } = await ctx.params;
      const { searchParams } = new URL(req.url);
      const allergen = searchParams.get('allergen');

      if (!allergen) {
        return NextResponse.json(
          { error: true, message: 'allergen query parameter is required' },
          { status: 400 }
        );
      }

      // Validate allergen against enum values
      const validAllergens = Object.values(AllergenType) as string[];
      if (!validAllergens.includes(allergen)) {
        return NextResponse.json(
          { error: true, message: `Invalid allergen value: ${allergen}` },
          { status: 400 }
        );
      }

      // Check if the allergy record exists and is active using the compound unique key
      const existing = await prisma.studentAllergy.findUnique({
        where: {
          studentId_allergen: {
            studentId,
            allergen: allergen as AllergenType,
          },
        },
      });

      if (!existing || !existing.isActive) {
        return NextResponse.json(
          { error: true, message: 'Active allergy record not found for this student and allergen' },
          { status: 404 }
        );
      }

      // Soft delete: set isActive to false using the compound unique key
      await prisma.studentAllergy.update({
        where: {
          studentId_allergen: {
            studentId,
            allergen: allergen as AllergenType,
          },
        },
        data: { isActive: false },
      });

      return NextResponse.json({ deactivated: true });
    } catch (error) {
      console.error('[STUDENT_ALLERGIES_DELETE]', error);
      return NextResponse.json(
        { error: true, message: 'Failed to deactivate student allergy' },
        { status: 500 }
      );
    }
  },
  { roles: ['ADMIN', 'PARENT'] }
);
