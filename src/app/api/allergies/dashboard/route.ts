import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// ============================================================
// GET /api/allergies/dashboard — Allergy Dashboard Stats (Admin only)
// Returns school-scoped statistics for the allergy management dashboard
// ============================================================

export const GET = withAuth(
  async (req) => {
    try {
      const schoolId = req.user.schoolId;

      // School-scoped filter: allergies where student → branch → schoolId matches
      const schoolFilter = {
        student: {
          branch: { schoolId },
        },
      };

      // 1. Total students with active allergies (distinct studentId count)
      const studentsWithAllergies = await prisma.studentAllergy.groupBy({
        by: ['studentId'],
        where: {
          isActive: true,
          ...schoolFilter,
        },
        _count: { studentId: true },
      });
      const totalStudentsWithAllergies = studentsWithAllergies.length;

      // 2. Allergen distribution (groupBy allergen, count, order by count desc)
      const allergenDistributionRaw = await prisma.studentAllergy.groupBy({
        by: ['allergen'],
        where: {
          isActive: true,
          ...schoolFilter,
        },
        _count: { allergen: true },
        orderBy: { _count: { allergen: 'desc' } },
      });
      const allergenDistribution = allergenDistributionRaw.map((item) => ({
        allergen: item.allergen,
        count: item._count.allergen,
      }));

      // 3. Severity distribution (groupBy severity, count)
      const severityDistributionRaw = await prisma.studentAllergy.groupBy({
        by: ['severity'],
        where: {
          isActive: true,
          ...schoolFilter,
        },
        _count: { severity: true },
      });
      const severityDistribution = severityDistributionRaw.map((item) => ({
        severity: item.severity,
        count: item._count.severity,
      }));

      // 4. Critical allergies: SEVERE/LIFE_THREATENING active allergies with student details
      const criticalAllergies = await prisma.studentAllergy.findMany({
        where: {
          isActive: true,
          severity: { in: ['SEVERE', 'LIFE_THREATENING'] },
          ...schoolFilter,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              class: {
                select: {
                  name: true,
                  section: true,
                },
              },
            },
          },
        },
        orderBy: { severity: 'desc' },
      });

      // 5. Unverified count: active allergies where isVerified is false
      const unverifiedCount = await prisma.studentAllergy.count({
        where: {
          isActive: true,
          isVerified: false,
          ...schoolFilter,
        },
      });

      return NextResponse.json({
        totalStudentsWithAllergies,
        allergenDistribution,
        severityDistribution,
        criticalAllergies: criticalAllergies.map((a) => ({
          id: a.id,
          allergen: a.allergen,
          severity: a.severity,
          reaction: a.reaction,
          actionPlan: a.actionPlan,
          isVerified: a.isVerified,
          student: {
            id: a.student.id,
            firstName: a.student.firstName,
            lastName: a.student.lastName,
            className: a.student.class?.name ?? null,
            classSection: a.student.class?.section ?? null,
          },
        })),
        unverifiedCount,
      });
    } catch (error) {
      console.error('[ALLERGIES_DASHBOARD_GET]', error);
      return NextResponse.json(
        { error: true, message: 'Failed to fetch allergy dashboard stats' },
        { status: 500 }
      );
    }
  },
  { roles: ['ADMIN'] }
);
