import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { getBranchFromRequest, withBranchFilter } from '@/lib/branch';

// GET /api/growth/achievements — List student achievements (badges/awards/etc.)
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const branchScope = getBranchFromRequest(request, user);
    const branchFilter = withBranchFilter(branchScope);
    const studentWhere =
      Object.keys(branchFilter).length > 0
        ? branchFilter
        : branchScope.isAllBranches && branchScope.schoolId
          ? { branch: { schoolId: branchScope.schoolId } }
          : null;
    const where: Record<string, unknown> = studentWhere ? { student: studentWhere } : {};

    const achievements = await db.achievement.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
      include: { student: { select: { firstName: true, lastName: true } } },
    });

    return NextResponse.json({
      achievements: achievements.map((a) => ({
        id: a.id,
        student: `${a.student.firstName} ${a.student.lastName}`,
        title: a.title,
        description: a.description || '',
        icon: a.icon || '🏆',
        date: a.date || a.createdAt,
      })),
    });
  } catch (error) {
    console.error('List achievements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
