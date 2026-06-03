import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireRole, Role } from '@/lib/auth';
import { getBranchFromRequest } from '@/lib/branch';
import { createNotification, NotificationTemplates } from '@/lib/notifications';
import { auditLog } from '@/lib/audit';

// GET /api/crm/leads — List leads with filters & pagination (Admin + TaskMaster)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    // Branch isolation — Lead has no schoolId/branchId,
    // filter by school via CrmTask.schoolId or assignedTo user's school
    const branchScope = getBranchFromRequest(request, authResult);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const stage = searchParams.get('stage') || '';
    const source = searchParams.get('source') || '';
    const priority = searchParams.get('priority') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // School isolation — filter leads associated with this school
    // Lead doesn't have schoolId, so filter via CrmTask.schoolId or assignedTo user
    // We use AND at the top level so this combines correctly with search OR filters
    const schoolFilters: Record<string, unknown>[] = [];
    if (branchScope.schoolId) {
      const schoolUsers = await db.user.findMany({
        where: { schoolId: branchScope.schoolId },
        select: { id: true },
      });
      const schoolUserIds = schoolUsers.map(u => u.id);
      schoolFilters.push({
        OR: [
          { assignedTo: { in: schoolUserIds } },
          { crmTasks: { some: { schoolId: branchScope.schoolId } } },
        ],
      });
    }

    // Stage filter (comma-separated for multi-select)
    if (stage) {
      const stages = stage.split(',').filter(Boolean);
      if (stages.length === 1) {
        where.stage = stages[0];
      } else if (stages.length > 1) {
        where.stage = { in: stages };
      }
    }

    // Source filter (comma-separated)
    if (source) {
      const sources = source.split(',').filter(Boolean);
      if (sources.length === 1) {
        where.source = sources[0];
      } else if (sources.length > 1) {
        where.source = { in: sources };
      }
    }

    // Priority filter
    if (priority) {
      where.priority = priority;
    }

    // Assigned to filter
    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const createdAt: Record<string, unknown> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
    }

    // Search filter
    if (search) {
      (where as Record<string, unknown>).OR = [
        { parentName: { contains: search } },
        { childName: { contains: search } },
        { parentPhone: { contains: search } },
        { parentEmail: { contains: search } },
      ];
    }

    // Apply school isolation as AND wrapper to combine with other filters
    const finalWhere = schoolFilters.length > 0
      ? { AND: [...schoolFilters, where] }
      : where;

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where: finalWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          followUps: {
            orderBy: { dateTime: 'desc' },
            take: 1,
          },
        },
      }),
      db.lead.count({ where: finalWhere }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/crm/leads — Create a new lead (Admin + TaskMaster)
export async function POST(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const {
      parentName,
      parentPhone,
      parentEmail,
      childName,
      childAge,
      source,
      priority,
      programInterest,
      estimatedValue,
      assignedTo,
      notes,
      nextFollowUp,
    } = body;

    // Validate required fields
    if (!parentName || parentName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Parent name is required (min 2 characters)' },
        { status: 400 }
      );
    }
    if (!parentPhone || !/^\d{10}$/.test(parentPhone)) {
      return NextResponse.json(
        { error: 'Valid 10-digit phone number is required' },
        { status: 400 }
      );
    }
    if (!childName || childName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Child name is required (min 2 characters)' },
        { status: 400 }
      );
    }
    if (!source) {
      return NextResponse.json(
        { error: 'Source is required' },
        { status: 400 }
      );
    }

    const lead = await db.lead.create({
      data: {
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentEmail: parentEmail?.trim() || null,
        childName: childName.trim(),
        childAge: childAge?.trim() || null,
        source,
        priority: priority || 'NORMAL',
        programInterest: programInterest || null,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        assignedTo: assignedTo || null,
        notes: notes?.trim() || null,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        stage: 'NEW',
      },
      include: {
        followUps: true,
      },
    });

    // ── Notify assigned user about new lead ──
    try {
      if (assignedTo && authResult.schoolId) {
        const template = NotificationTemplates.newLead(parentName.trim());
        await createNotification({
          userId: assignedTo,
          schoolId: authResult.schoolId,
          ...template,
          link: `/admin/crm/leads/${lead.id}`,
          senderId: authResult.userId,
        });
      }
    } catch (notifError) {
      console.error('Lead notification error:', notifError);
    }

    // ── Audit log ──
    try {
      await auditLog.create({
        action: 'CREATE',
        entity: 'Lead',
        entityId: lead.id,
        userId: authResult.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        details: { parentName: parentName.trim(), childName: childName.trim(), source },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json(
      { message: 'Lead created successfully', lead },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
