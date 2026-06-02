import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/teachers/[id]/reviews — Get performance reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const teacher = await db.teacher.findUnique({ where: { id } });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const reviews = await db.performanceReview.findMany({
      where: { teacherId: id },
      orderBy: { reviewDate: 'desc' },
    });

    // Calculate overall average
    const overallRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
      : 0;

    return NextResponse.json({ reviews, overallRating });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teachers/[id]/reviews — Add performance review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const {
      period, teachingQuality, studentEngagement, communication,
      punctuality, professionalDev, comments,
    } = body;

    if (!period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 });
    }

    const teacher = await db.teacher.findUnique({ where: { id } });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const tq = parseInt(teachingQuality) || 0;
    const se = parseInt(studentEngagement) || 0;
    const comm = parseInt(communication) || 0;
    const punc = parseInt(punctuality) || 0;
    const pd = parseInt(professionalDev) || 0;

    // Clamp to 1-5
    const clamp = (v: number) => Math.max(1, Math.min(5, v));
    const overallRating = (clamp(tq) + clamp(se) + clamp(comm) + clamp(punc) + clamp(pd)) / 5;

    const review = await db.performanceReview.create({
      data: {
        teacherId: id,
        period,
        teachingQuality: clamp(tq),
        studentEngagement: clamp(se),
        communication: clamp(comm),
        punctuality: clamp(punc),
        professionalDev: clamp(pd),
        overallRating: Math.round(overallRating * 100) / 100,
        comments: comments || null,
        reviewerName: authResult.name || 'Admin',
      },
    });

    return NextResponse.json(
      { message: 'Review added successfully', review },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
