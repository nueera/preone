import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

// GET /api/students — List all students with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { rollNumber: { contains: search } },
      ];
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          class: {
            select: { id: true, name: true, program: { select: { name: true } } },
          },
          branch: { select: { id: true, name: true } },
          parents: {
            include: {
              parent: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                  relation: true,
                },
              },
            },
          },
          _count: {
            select: {
              attendance: true,
              invoices: true,
              observations: true,
            },
          },
        },
      }),
      db.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List students error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/students — Create a new student
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const {
      branchId,
      firstName,
      lastName,
      dob,
      gender,
      bloodGroup,
      classId,
      rollNumber,
      // Parent info
      parentFirstName,
      parentLastName,
      parentPhone,
      parentEmail,
      parentRelation,
      parentOccupation,
    } = body;

    if (!firstName || !lastName || !dob) {
      return NextResponse.json(
        { error: 'firstName, lastName, and dob are required' },
        { status: 400 }
      );
    }

    // Create student
    const student = await db.student.create({
      data: {
        branchId: branchId || null,
        firstName,
        lastName,
        dob: new Date(dob),
        gender,
        bloodGroup,
        classId: classId || null,
        rollNumber,
        status: 'ACTIVE',
      },
    });

    // Create parent if provided
    if (parentFirstName && parentLastName && parentPhone) {
      const parent = await db.parent.create({
        data: {
          firstName: parentFirstName,
          lastName: parentLastName,
          phone: parentPhone,
          email: parentEmail,
          relation: parentRelation || 'Father',
          occupation: parentOccupation,
          isEmergencyContact: true,
        },
      });

      // Link parent to student
      await db.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          isPrimary: true,
        },
      });
    }

    // Fetch the complete student with relations
    const completeStudent = await db.student.findUnique({
      where: { id: student.id },
      include: {
        class: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Student created successfully', student: completeStudent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
