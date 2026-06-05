import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, Role } from '@/lib/auth';

// PATCH /api/crm/tasks/[taskId] — Update a CRM task (Admin + TaskMaster)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const authResult = requireRole(request, Role.ADMIN, Role.TASK_MASTER);
    if (authResult instanceof NextResponse) return authResult;

    const { taskId } = await params;
    const body = await request.json();

    // Verify task exists
    const existing = await db.crmTask.findUnique({ where: { id: taskId } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const allowedFields = ['title', 'description', 'assignedTo', 'dueDate', 'priority', 'status', 'leadId'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'dueDate' && body[field]) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // If status is DONE, we can add a completedAt timestamp (store in description as note)
    if (body.status === 'DONE' && existing.status !== 'DONE') {
      updateData.description = (existing.description || '') + '\n[Completed]';
    }

    const task = await db.crmTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        lead: { select: { id: true, parentName: true, childName: true } },
      },
    });

    return NextResponse.json({ message: 'Task updated successfully', task });
  } catch (error) {
    console.error('Update CRM task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/crm/tasks/[taskId] — Delete a CRM task (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const authResult = requireRole(request, Role.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const { taskId } = await params;

    const existing = await db.crmTask.findUnique({ where: { id: taskId } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await db.crmTask.delete({ where: { id: taskId } });
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete CRM task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
