import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, branchFilter } from '@/lib/auth';

// GET /api/students — List all students with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const branchId = searchParams.get('branchId') || user.branchId || '';
    const status = searchParams.get('status') || '';
    const sectionId = searchParams.get('sectionId') || '';

    const skip = (page - 1) * limit;

    // Build where clause with branch isolation
    const where: Record<string, unknown> = { ...branchFilter(user) };

    if (branchId) where.branchId = branchId;
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { admissionNo: { contains: search } },
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
          section: { select: { id: true, name: true } },
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
                  isPrimary: true,
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
    const user = requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const {
      branchId,
      admissionNo,
      firstName,
      lastName,
      dob,
      gender,
      bloodGroup,
      photo,
      address,
      emergencyContact,
      classId,
      sectionId,
      status,
      // Parent info
      parentFirstName,
      parentLastName,
      parentPhone,
      parentEmail,
      parentRelation,
      parentOccupation,
    } = body;

    // Use user's branchId for branch isolation
    const effectiveBranchId = user.branchId || branchId;

    // Validation
    if (!effectiveBranchId || !firstName || !lastName || !dob) {
      return NextResponse.json(
        { error: 'branchId, firstName, lastName, and dob are required' },
        { status: 400 }
      );
    }

    // Check admission number uniqueness if provided
    if (admissionNo) {
      const existing = await db.student.findUnique({
        where: { admissionNo },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Admission number already exists' },
          { status: 409 }
        );
      }
    }

    // Create student
    const student = await db.student.create({
      data: {
        branchId: effectiveBranchId,
        admissionNo,
        firstName,
        lastName,
        dob: new Date(dob),
        gender,
        bloodGroup,
        photo,
        address,
        emergencyContact,
        classId,
        sectionId,
        status: status || 'Active',
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
          isPrimary: true,
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
        section: { select: { id: true, name: true } },
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
