// ============================================================
// PreOne — API Auth Helpers
// Enhanced auth utilities for API routes that need role context
// Fetches the teacher/parent record + relations in one step
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, Role } from '@/lib/auth';
import { db } from '@/lib/db';

// ============================================================
// Teacher Auth Result
// ============================================================

interface TeacherAuthResult {
  teacher: NonNullable<Awaited<ReturnType<typeof db.teacher.findUnique>>>;
  classId: string | null;
  classInfo: {
    id: string;
    name: string;
    program: { id: string; name: string };
  } | null;
}

interface TeacherAuthError {
  error: NextResponse;
}

// ============================================================
// Parent Auth Result
// ============================================================

interface ParentAuthResult {
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    occupation: string | null;
    address: string | null;
    relation: string;
    isEmergencyContact: boolean;
    photo: string | null;
    kycDoc: string | null;
    kycStatus: string | null;
    kycRejectionReason: string | null;
  };
  userId: string;
  children: Array<{
    id: string;
    firstName: string;
    lastName: string;
    photo: string | null;
    dob: Date;
    gender: string;
    bloodGroup: string | null;
    rollNumber: string | null;
    status: string;
    admissionDate: Date;
    class: {
      id: string;
      name: string;
      program: { id: string; name: string } | null;
      teacher: {
        id: string;
        firstName: string;
        lastName: string;
        photo: string | null;
        qualification: string | null;
        specialization: string | null;
        experience: number;
      } | null;
    } | null;
    isPrimary: boolean;
  }>;
  childIds: string[];
}

interface ParentAuthError {
  error: NextResponse;
}

// ============================================================
// requireTeacher — Full teacher auth with DB lookup
// Use this in all /api/teacher/* routes for consistent auth
// ============================================================

export async function requireTeacher(
  request: NextRequest
): Promise<TeacherAuthResult | TeacherAuthError> {
  // Step 1: Verify JWT token and TEACHER role
  const user = getAuthUser(request);
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (user.role !== Role.TEACHER) {
    return {
      error: NextResponse.json(
        { error: 'Access denied. Teacher role required.' },
        { status: 403 }
      ),
    };
  }

  // Step 2: Fetch teacher record with assigned class
  const teacher = await db.teacher.findUnique({
    where: { userId: user.userId },
    include: {
      assignedClass: {
        include: {
          program: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!teacher) {
    return {
      error: NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      ),
    };
  }

  // Step 3: Return structured result
  return {
    teacher: teacher as TeacherAuthResult['teacher'],
    classId: teacher.assignedClass?.id ?? null,
    classInfo: teacher.assignedClass
      ? {
          id: teacher.assignedClass.id,
          name: teacher.assignedClass.name,
          program: teacher.assignedClass.program,
        }
      : null,
  };
}

// ============================================================
// requireParent — Full parent auth with DB lookup
// Finds the parent record via User.email or User.phone matching
// Parent.email or Parent.phone, then loads all linked children
// Use this in all /api/parent/* routes for consistent auth
// ============================================================

export async function requireParent(
  request: NextRequest
): Promise<ParentAuthResult | ParentAuthError> {
  // Step 1: Verify JWT token and PARENT role
  const user = getAuthUser(request);
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (user.role !== Role.PARENT) {
    return {
      error: NextResponse.json(
        { error: 'Access denied. Parent role required.' },
        { status: 403 }
      ),
    };
  }

  // Step 2: Find parent record by matching email to the User record
  // Parents may log in with email or phone number as their username
  // The User model's email field may store a phone number for parent accounts
  const parent = await db.parent.findFirst({
    where: {
      OR: [
        { email: user.email },
        { phone: user.email },   // phone used as login username (stored in User.email)
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      occupation: true,
      address: true,
      relation: true,
      isEmergencyContact: true,
      photo: true,
      kycDoc: true,
      kycStatus: true,
      kycRejectionReason: true,
    },
  });

  if (!parent) {
    return {
      error: NextResponse.json(
        { error: 'Parent profile not found' },
        { status: 404 }
      ),
    };
  }

  // Step 3: Fetch all children linked to this parent via StudentParent
  const studentParents = await db.studentParent.findMany({
    where: { parentId: parent.id },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          dob: true,
          gender: true,
          bloodGroup: true,
          rollNumber: true,
          status: true,
          admissionDate: true,
          class: {
            select: {
              id: true,
              name: true,
              program: { select: { id: true, name: true } },
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photo: true,
                  qualification: true,
                  specialization: true,
                  experience: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const children = studentParents.map((sp) => ({
    id: sp.student.id,
    firstName: sp.student.firstName,
    lastName: sp.student.lastName,
    photo: sp.student.photo,
    dob: sp.student.dob,
    gender: sp.student.gender,
    bloodGroup: sp.student.bloodGroup,
    rollNumber: sp.student.rollNumber,
    status: sp.student.status,
    admissionDate: sp.student.admissionDate,
    class: sp.student.class,
    isPrimary: sp.isPrimary,
  }));

  const childIds = children.map((c) => c.id);

  // Step 4: Return structured result
  return {
    parent,
    userId: user.userId,
    children,
    childIds,
  };
}

// ============================================================
// verifyChildAccess — Ensure a childId belongs to this parent
// Returns a NextResponse error if child is NOT linked to parent,
// or null if access is granted
// ============================================================

export function verifyChildAccess(
  auth: ParentAuthResult,
  childId: string
): NextResponse | null {
  if (!auth.childIds.includes(childId)) {
    return NextResponse.json(
      { error: 'Access denied. This child is not linked to your account.' },
      { status: 403 }
    );
  }
  return null;
}

// ============================================================
// Helper: Check if auth result is an error (teacher)
// ============================================================

export function isAuthError(
  result: TeacherAuthResult | TeacherAuthError
): result is TeacherAuthError;

export function isAuthError(
  result: ParentAuthResult | ParentAuthError
): result is ParentAuthError;

export function isAuthError(
  result:
    | TeacherAuthResult
    | TeacherAuthError
    | ParentAuthResult
    | ParentAuthError
): result is (TeacherAuthError & ParentAuthError) {
  return 'error' in result;
}
