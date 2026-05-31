import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

// GET /api/crm/leads — List leads
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get('stage') || '';
    const source = searchParams.get('source') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (stage) where.stage = stage;
    if (source) where.source = source;
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
          followUps: {
            orderBy: { dateTime: 'desc' },
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
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const {
      parentName, parentPhone, parentEmail, childName, childAge,
      source, stage, assignedTo, notes, priority, programInterest,
      estimatedValue, nextFollowUp,
    } = body;

    if (!parentName || !parentPhone || !childName) {
      return NextResponse.json(
        { error: 'parentName, parentPhone, and childName are required' },
        { status: 400 }
      );
    }

    const lead = await db.lead.create({
      data: {
        parentName,
        parentPhone,
        parentEmail,
        childName,
        childAge,
        source: source || 'WALK_IN',
        stage: stage || 'NEW',
        assignedTo: assignedTo || user.userId,
        notes,
        priority: priority || 'NORMAL',
        programInterest,
        estimatedValue,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : undefined,
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
