// ============================================================
// POST /api/passport/[studentId]/reactions — Add a parent reaction
// Only parents can react. Toggles reaction (add/remove).
// Body: { targetType, targetId, reaction, comment? }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireParent, isAuthError } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;

  // ── Auth: Only parents ──
  const parentAuth = await requireParent(request);
  if (isAuthError(parentAuth)) return parentAuth.error;

  // Verify child access
  if (!parentAuth.childIds.includes(studentId)) {
    return NextResponse.json(
      { error: 'Access denied. This child is not linked to your account.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { targetType, targetId, reaction, comment } = body;

    // Validation
    if (!targetType || !targetId || !reaction) {
      return NextResponse.json(
        { error: 'targetType, targetId, and reaction are required' },
        { status: 400 }
      );
    }

    const validTypes = ['memory', 'achievement', 'certificate'];
    if (!validTypes.includes(targetType)) {
      return NextResponse.json(
        { error: `Invalid targetType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validReactions = ['love', 'celebrate', 'proud', 'wow', 'heart'];
    if (!validReactions.includes(reaction)) {
      return NextResponse.json(
        { error: `Invalid reaction. Must be one of: ${validReactions.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify the target exists
    let targetExists = false;
    if (targetType === 'memory') {
      targetExists = !!(await db.memory.findFirst({ where: { id: targetId, studentId } }));
    } else if (targetType === 'achievement') {
      targetExists = !!(await db.achievement.findFirst({ where: { id: targetId, studentId } }));
    } else if (targetType === 'certificate') {
      targetExists = !!(await db.certificate.findFirst({ where: { id: targetId, studentId } }));
    }

    if (!targetExists) {
      return NextResponse.json({ error: 'Target not found for this student' }, { status: 404 });
    }

    // Upsert reaction (unique constraint on parentId + targetType + targetId)
    const existing = await db.reaction.findUnique({
      where: {
        parentId_targetType_targetId: {
          parentId: parentAuth.parent.id,
          targetType,
          targetId,
        },
      },
    });

    if (existing) {
      // If same reaction, remove it (toggle off). If different, update.
      if (existing.reaction === reaction) {
        await db.reaction.delete({ where: { id: existing.id } });
        return NextResponse.json({ action: 'removed', reaction: null });
      } else {
        const updated = await db.reaction.update({
          where: { id: existing.id },
          data: { reaction, comment: comment?.trim() || null },
        });
        return NextResponse.json({ action: 'updated', reaction: updated });
      }
    } else {
      const newReaction = await db.reaction.create({
        data: {
          studentId,
          parentId: parentAuth.parent.id,
          targetType,
          targetId,
          reaction,
          comment: comment?.trim() || null,
        },
      });
      return NextResponse.json({ action: 'created', reaction: newReaction }, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
