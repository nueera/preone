// ============================================================
// GET  /api/passport/[studentId]/certificates — List certificates
// POST /api/passport/[studentId]/certificates — Issue certificate (admin only)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, Role } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const certificates = await db.certificate.findMany({
    where: { studentId },
    orderBy: { issuedAt: 'desc' },
  });

  return NextResponse.json({ certificates });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Only admins can issue certificates
  if (user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Only admins can issue certificates' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, template, pdfUrl, issuedAt } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const certificate = await db.certificate.create({
      data: {
        studentId,
        title: title.trim(),
        template: template?.trim() || null,
        pdfUrl: pdfUrl?.trim() || null,
        issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
      },
    });

    return NextResponse.json({ certificate }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
