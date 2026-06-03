import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// GET /api/crm/tasks — List CRM tasks with filters (Admin + TaskMaster)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const leadId = searchParams.get('leadId') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (leadId) where.leadId = leadId;

    const tasks = await db.crmTask.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        lead: { select: { id: true, parentName: true, childName: true, stage: true } },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('List CRM tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/crm/tasks — Create a CRM task (Admin + TaskMaster)
export async function POST(request: NextRequest) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { title, description, leadId, assignedTo, dueDate, priority } = body;

    if (!title || title.trim().length < 2) {
      return NextResponse.json(
        { error: 'Task title is required (min 2 characters)' },
        { status: 400 },
      );
    }

    const task = await db.crmTask.create({
      data: {
        schoolId: authResult.schoolId || null,
        title: title.trim(),
        description: description?.trim() || null,
        leadId: leadId || null,
        assignedTo: assignedTo || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        status: 'TODO',
        createdBy: authResult.userId,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        lead: { select: { id: true, parentName: true, childName: true } },
      },
    });

    return NextResponse.json({ message: 'Task created successfully', task }, { status: 201 });
  } catch (error) {
    console.error('Create CRM task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
