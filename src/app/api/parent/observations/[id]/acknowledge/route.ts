// ============================================================
// PreOne — PATCH /api/parent/observations/[id]/acknowledge
// Parent acknowledges a shared observation
// Sets parentAck = true and optionally adds a comment
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireParent, isAuthError } from '@/lib/api-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const { id } = await params;

    // Find the observation
    const observation = await db.observation.findUnique({
      where: { id },
      select: { id: true, studentId: true, isShared: true },
    });

    if (!observation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    // Verify the observation's student belongs to this parent
    if (!auth.childIds.includes(observation.studentId)) {
      return NextResponse.json(
        { error: 'Access denied. This observation is not for your child.' },
        { status: 403 }
      );
    }

    if (!observation.isShared) {
      return NextResponse.json(
        { error: 'This observation is not shared with parents.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { comment } = body;

    const updated = await db.observation.update({
      where: { id },
      data: {
        parentAck: true,
        ...(comment ? { parentComment: comment } : {}),
      },
    });

    return NextResponse.json({
      message: 'Observation acknowledged',
      observation: {
        id: updated.id,
        parentAck: updated.parentAck,
        parentComment: updated.parentComment,
      },
    });
  } catch (error) {
    console.error('Acknowledge observation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
