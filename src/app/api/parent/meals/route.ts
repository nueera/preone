import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// ============================================================
// GET /api/parent/meals — Parent meal view
// Query: studentId (required), date (optional, defaults to today)
// ============================================================

export const GET = withAuth(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const studentId = searchParams.get('studentId');
      const dateStr = searchParams.get('date');

      if (!studentId) {
        return NextResponse.json(
          { error: true, message: 'studentId is required' },
          { status: 400 }
        );
      }

      // Get student with allergies and class info
      const student = await prisma.student.findFirst({
        where: { id: studentId, status: 'ACTIVE' },
        include: {
          allergies: {
            where: { isActive: true },
          },
          class: { select: { id: true, name: true } },
        },
      });

      if (!student) {
        return NextResponse.json(
          { error: true, message: 'Student not found or inactive' },
          { status: 404 }
        );
      }

      // Verify this student belongs to the parent
      const parentUser = await prisma.user.findFirst({
        where: { id: req.user.id, role: 'PARENT' },
      });

      if (parentUser) {
        const parentRecord = await prisma.parent.findFirst({
          where: { email: parentUser.email },
        });

        if (parentRecord) {
          const studentParent = await prisma.studentParent.findFirst({
            where: { studentId, parentId: parentRecord.id },
          });

          if (!studentParent) {
            return NextResponse.json(
              { error: true, message: 'Student not associated with this parent account' },
              { status: 403 }
            );
          }
        }
      }

      // Student's allergen list for conflict checking
      const studentAllergens = student.allergies.map((a) => String(a.allergen));

      // Determine the target date
      const targetDate = dateStr ? new Date(dateStr) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      // Find the active meal plan that covers the target date
      const mealPlan = await prisma.mealPlan.findFirst({
        where: {
          schoolId: req.user.schoolId,
          status: 'PUBLISHED',
          startDate: { lte: targetDate },
          endDate: { gte: targetDate },
          OR: [
            { branchId: student.branchId },
            { branchId: null },
          ],
        },
        include: {
          items: {
            include: {
              mealItem: true,
            },
            orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }, { sortOrder: 'asc' }],
          },
          branch: { select: { id: true, name: true } },
        },
      });

      // Build weeklyMenu: for each day, for each meal type, include items with allergy info
      const weeklyMenu: Record<number, Record<string, Array<{
        id: string;
        mealItemId: string;
        name: string;
        image: string | null;
        calories: number;
        isVegetarian: boolean;
        allergens: string[];
        mayContain: string[];
        allergyConflict: boolean;
        conflictingAllergens: string[];
        isAlternative: boolean;
      }>>> = {};

      if (mealPlan) {
        for (const item of mealPlan.items) {
          const day = item.dayOfWeek;
          if (!weeklyMenu[day]) weeklyMenu[day] = {};
          const mt = String(item.mealType);
          if (!weeklyMenu[day][mt]) weeklyMenu[day][mt] = [];

          // Parse allergens and mayContain from JSON strings
          let itemAllergens: string[] = [];
          let itemMayContain: string[] = [];
          try {
            itemAllergens = JSON.parse(item.mealItem.allergens || '[]');
          } catch {
            itemAllergens = [];
          }
          try {
            itemMayContain = JSON.parse(item.mealItem.mayContain || '[]');
          } catch {
            itemMayContain = [];
          }

          // Check for allergy conflicts
          const combined = [...itemAllergens, ...itemMayContain];
          const conflictingAllergens = combined.filter((a) => studentAllergens.includes(a));
          const allergyConflict = conflictingAllergens.length > 0;

          weeklyMenu[day][mt].push({
            id: item.id,
            mealItemId: item.mealItemId,
            name: item.mealItem.name,
            image: item.mealItem.image,
            calories: item.mealItem.calories,
            isVegetarian: item.mealItem.isVegetarian,
            allergens: itemAllergens,
            mayContain: itemMayContain,
            allergyConflict,
            conflictingAllergens,
            isAlternative: item.isAlternative,
          });
        }
      }

      // Get today's MealFeedback for this student
      const todayStart = new Date(targetDate);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(targetDate);
      todayEnd.setHours(23, 59, 59, 999);

      const todayFeedback = await prisma.mealFeedback.findMany({
        where: {
          studentId,
          date: { gte: todayStart, lte: todayEnd },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get weekly feedback history (7 days back from target date)
      const weekStart = new Date(targetDate);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(targetDate);
      weekEnd.setHours(23, 59, 59, 999);

      const weekFeedback = await prisma.mealFeedback.findMany({
        where: {
          studentId,
          date: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { date: 'desc' },
      });

      return NextResponse.json({
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          allergies: student.allergies,
          class: student.class,
        },
        mealPlan: mealPlan
          ? {
              id: mealPlan.id,
              name: mealPlan.name,
              description: mealPlan.description,
              startDate: mealPlan.startDate,
              endDate: mealPlan.endDate,
              mealTypes: mealPlan.mealTypes,
              branch: mealPlan.branch,
              avgDailyCalories: mealPlan.avgDailyCalories,
              avgDailyProtein: mealPlan.avgDailyProtein,
            }
          : null,
        weeklyMenu,
        todayFeedback,
        weekFeedback,
      });
    } catch (error) {
      console.error('[PARENT_MEALS_GET]', error);
      return NextResponse.json(
        { error: true, message: 'Failed to fetch parent meal view' },
        { status: 500 }
      );
    }
  },
  { roles: ['PARENT'] }
);
