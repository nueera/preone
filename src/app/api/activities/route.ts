import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import { getBranchFromRequest, withBranchFilter } from '@/lib/branch';

// GET /api/activities — List activities with filters & pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUser(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Branch isolation
    const branchScope = getBranchFromRequest(request, authResult);
    const branchFilter = withBranchFilter(branchScope);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const classId = searchParams.get('classId') || '';
    const isPublished = searchParams.get('isPublished') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause — start with branch filter via class relation
    // Activity doesn't have branchId, so filter through class.branchId
    const branchWhere = Object.keys(branchFilter).length > 0
      ? { class: branchFilter }
      : branchScope.isAllBranches && branchScope.schoolId
        ? { class: { branch: { schoolId: branchScope.schoolId } } }
        : {};

    const where: Record<string, unknown> = { ...branchWhere };

    // Type filter (comma-separated for multi-select)
    if (type) {
      const types = type.split(',').filter(Boolean);
      if (types.length === 1) {
        where.type = types[0];
      } else if (types.length > 1) {
        where.type = { in: types };
      }
    }

    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    if (classId) {
      where.classId = classId;
    }

    if (isPublished !== '') {
      where.isPublished = isPublished === 'true';
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo + 'T23:59:59.999Z');
      where.date = dateFilter;
    }

    if (search) {
      (where as Record<string, unknown>).OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [activities, total] = await Promise.all([
      db.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          class: {
            select: { id: true, name: true, program: { select: { name: true } } },
          },
        },
      }),
      db.activity.count({ where }),
    ]);

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/activities — Create a new activity
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const {
      title,
      type,
      description,
      date,
      startTime,
      endTime,
      classId,
      location,
      materials,
      learningOutcomes,
      media,
      isPublished,
      publishedAt,
      status,
      createdBy,
    } = body;

    if (!title || title.trim().length < 2) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const shouldPublish = isPublished !== false;

    const activity = await db.activity.create({
      data: {
        title: title.trim(),
        type,
        description: description?.trim() || null,
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        classId: classId || null,
        location: location?.trim() || null,
        materials: materials?.trim() || null,
        learningOutcomes: learningOutcomes?.trim() || null,
        media: media || null,
        isPublished: shouldPublish,
        publishedAt: shouldPublish ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
        status: status || 'UPCOMING',
        createdBy: createdBy || authResult.userId,
      },
      include: {
        class: {
          select: { id: true, name: true, program: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(
      { message: 'Activity created successfully', activity },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
