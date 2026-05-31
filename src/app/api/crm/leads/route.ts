import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, branchFilter } from '@/lib/auth';

// GET /api/crm/leads — List leads with pipeline stage
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || user.branchId || '';
    const stage = searchParams.get('stage') || '';
    const source = searchParams.get('source') || '';
    const priority = searchParams.get('priority') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause with branch isolation
    const where: Record<string, unknown> = { ...branchFilter(user) };
    if (branchId) where.branchId = branchId;
    if (stage) where.stage = stage;
    if (source) where.source = source;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (search) {
      where.OR = [
        { parentName: { contains: search } },
        { childName: { contains: search } },
        { parentPhone: { contains: search } },
        { parentEmail: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { id: true, name: true } },
          followUps: {
            orderBy: { followUpDate: 'desc' },
            take: 5,
          },
          _count: { select: { followUps: true } },
        },
      }),
      db.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/crm/leads — Create new lead
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const {
      branchId, parentName, parentPhone, parentEmail, parentOccupation,
      parentAddress, childName, childDob, childGender, programInterest,
      source, sourceDetail, stage, assignedTo, notes, priority,
      nextFollowUpDate, expectedEnrollmentDate, estimatedFee,
    } = body;

    // Use user's branchId for branch isolation
    const effectiveBranchId = user.branchId || branchId;

    if (!effectiveBranchId || !parentName || !parentPhone || !childName) {
      return NextResponse.json(
        { error: 'branchId, parentName, parentPhone, and childName are required' },
        { status: 400 }
      );
    }

    const lead = await db.lead.create({
      data: {
        branchId: effectiveBranchId,
        parentName,
        parentPhone,
        parentEmail,
        parentOccupation,
        parentAddress,
        childName,
        childDob: childDob ? new Date(childDob) : undefined,
        childGender,
        programInterest,
        source: source || 'WalkIn',
        sourceDetail,
        stage: stage || 'NewInquiry',
        assignedTo: assignedTo || user.userId,
        notes,
        priority: priority || 'Medium',
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
        expectedEnrollmentDate: expectedEnrollmentDate ? new Date(expectedEnrollmentDate) : undefined,
        estimatedFee,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { message: 'Lead created successfully', lead },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
