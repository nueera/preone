import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// ============================================================
// POST /api/meal-plans/[id]/publish — Publish meal plan (Admin only)
// ============================================================

export const POST = withAuth(
  async (req, ctx) => {
    try {
      const { id } = await ctx.params;

      // Find meal plan scoped to the admin's school
      const mealPlan = await prisma.mealPlan.findFirst({
        where: { id, schoolId: req.user.schoolId },
        include: { _count: { select: { items: true } } },
      });

      if (!mealPlan) {
        return NextResponse.json(
          { error: true, message: 'Meal plan not found' },
          { status: 404 }
        );
      }

      // Cannot publish empty plan
      if (mealPlan._count.items === 0) {
        return NextResponse.json(
          { error: true, message: 'Cannot publish a meal plan with no items' },
          { status: 400 }
        );
      }

      // Update status to PUBLISHED
      const updated = await prisma.mealPlan.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedBy: req.user.id,
        },
      });

      // Notify parents of students in target classes
      let targetClassIds: string[] = [];
      try {
        targetClassIds = mealPlan.targetClassIds
          ? JSON.parse(mealPlan.targetClassIds)
          : [];
      } catch {
        targetClassIds = [];
      }

      if (targetClassIds.length > 0) {
        // Find students in those classes
        const students = await prisma.student.findMany({
          where: {
            classId: { in: targetClassIds },
            status: 'ACTIVE',
          },
          include: {
            parents: {
              include: {
                parent: {
                  select: { id: true, email: true },
                },
              },
            },
          },
        });

        // Collect parent user IDs from StudentParent → Parent → User (by email)
        const parentUserIds = new Set<string>();
        for (const student of students) {
          for (const sp of student.parents) {
            if (sp.parent.email) {
              const parentUser = await prisma.user.findFirst({
                where: {
                  email: sp.parent.email,
                  role: 'PARENT',
                  isActive: true,
                },
                select: { id: true },
              });
              if (parentUser) {
                parentUserIds.add(parentUser.id);
              }
            }
          }
        }

        // Create notifications for each parent
        if (parentUserIds.size > 0) {
          const notificationData = Array.from(parentUserIds).map((userId) => ({
            schoolId: req.user.schoolId,
            userId,
            title: 'New Meal Plan Published',
            message: `Meal plan "${mealPlan.name}" for ${new Date(mealPlan.startDate).toLocaleDateString()} - ${new Date(mealPlan.endDate).toLocaleDateString()} has been published.`,
            type: 'INFO',
            category: 'MEAL_PLAN',
            link: `/parent/meals?planId=${mealPlan.id}`,
            senderId: req.user.id,
          }));

          await prisma.notification.createMany({ data: notificationData });
        }
      }

      return NextResponse.json({ mealPlan: updated });
    } catch (error) {
      console.error('[MEAL_PLAN_PUBLISH]', error);
      return NextResponse.json(
        { error: true, message: 'Failed to publish meal plan' },
        { status: 500 }
      );
    }
  },
  { roles: ['ADMIN'] }
);
