// ============================================================
// PreOne — API Auth Helpers
// Enhanced auth utilities for API routes that need teacher context
// Fetches the teacher record + assigned class in one step
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
// Helper: Check if auth result is an error
// ============================================================

export function isAuthError(
  result: TeacherAuthResult | TeacherAuthError
): result is TeacherAuthError {
  return 'error' in result;
}
