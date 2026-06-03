import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock getAuthUser from @/lib/auth
const mockGetAuthUser = vi.fn();
vi.mock('@/lib/auth', () => ({
  getAuthUser: (...args: any[]) => mockGetAuthUser(...args),
  Role: {
    ADMIN: 'ADMIN',
    TEACHER: 'TEACHER',
    PARENT: 'PARENT',
    TASK_MASTER: 'TASK_MASTER',
  },
}));

// Mock db from @/lib/db
const mockTeacherFindUnique = vi.fn();
const mockParentFindFirst = vi.fn();
const mockStudentParentFindMany = vi.fn();
const mockParentFindUnique = vi.fn();
const mockUserFindFirst = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    teacher: {
      findUnique: (...args: any[]) => mockTeacherFindUnique(...args),
    },
    parent: {
      findFirst: (...args: any[]) => mockParentFindFirst(...args),
      findUnique: (...args: any[]) => mockParentFindUnique(...args),
    },
    studentParent: {
      findMany: (...args: any[]) => mockStudentParentFindMany(...args),
    },
    user: {
      findFirst: (...args: any[]) => mockUserFindFirst(...args),
    },
  },
}));

import {
  requireTeacher,
  requireParent,
  verifyChildAccess,
  getParentUserId,
  isAuthError,
} from '@/lib/api-auth';
import { Role } from '@/lib/auth';

// ============================================================
// requireTeacher Tests
// ============================================================

describe('requireTeacher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error if no auth', async () => {
    mockGetAuthUser.mockReturnValue(null);
    const request = new NextRequest('http://localhost/api/teacher/test');

    const result = await requireTeacher(request);

    expect(isAuthError(result)).toBe(true);
    if (isAuthError(result)) {
      expect(result.error.status).toBe(401);
      const body = await result.error.json();
      expect(body.error).toBe('Authentication required');
    }
  });

  it('returns error if wrong role', async () => {
    mockGetAuthUser.mockReturnValue({
      userId: 'user-1',
      role: Role.ADMIN,
      email: 'admin@test.com',
      name: 'Admin',
    });
    const request = new NextRequest('http://localhost/api/teacher/test');

    const result = await requireTeacher(request);

    expect(isAuthError(result)).toBe(true);
    if (isAuthError(result)) {
      expect(result.error.status).toBe(403);
      const body = await result.error.json();
      expect(body.error).toBe('Access denied. Teacher role required.');
    }
  });

  it('returns error if teacher profile not found', async () => {
    mockGetAuthUser.mockReturnValue({
      userId: 'user-2',
      role: Role.TEACHER,
      email: 'teacher@test.com',
      name: 'Teacher',
    });
    mockTeacherFindUnique.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/api/teacher/test');

    const result = await requireTeacher(request);

    expect(isAuthError(result)).toBe(true);
    if (isAuthError(result)) {
      expect(result.error.status).toBe(404);
      const body = await result.error.json();
      expect(body.error).toBe('Teacher profile not found');
    }
  });

  it('returns teacher + class info on success', async () => {
    mockGetAuthUser.mockReturnValue({
      userId: 'user-2',
      role: Role.TEACHER,
      email: 'teacher@test.com',
      name: 'Teacher',
    });

    const mockTeacher = {
      id: 'teacher-1',
      userId: 'user-2',
      firstName: 'John',
      lastName: 'Doe',
      assignedClass: {
        id: 'class-1',
        name: 'Nursery-A',
        program: { id: 'prog-1', name: 'Nursery' },
      },
    };
    mockTeacherFindUnique.mockResolvedValue(mockTeacher);

    const request = new NextRequest('http://localhost/api/teacher/test');
    const result = await requireTeacher(request);

    expect(isAuthError(result)).toBe(false);
    if (!isAuthError(result)) {
      expect(result.teacher).toEqual(mockTeacher);
      expect(result.classId).toBe('class-1');
      expect(result.classInfo).toEqual({
        id: 'class-1',
        name: 'Nursery-A',
        program: { id: 'prog-1', name: 'Nursery' },
      });
    }
  });

  it('returns null classInfo when teacher has no assigned class', async () => {
    mockGetAuthUser.mockReturnValue({
      userId: 'user-2',
      role: Role.TEACHER,
      email: 'teacher@test.com',
      name: 'Teacher',
    });

    const mockTeacher = {
      id: 'teacher-2',
      userId: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      assignedClass: null,
    };
    mockTeacherFindUnique.mockResolvedValue(mockTeacher);

    const request = new NextRequest('http://localhost/api/teacher/test');
    const result = await requireTeacher(request);

    expect(isAuthError(result)).toBe(false);
    if (!isAuthError(result)) {
      expect(result.classId).toBeNull();
      expect(result.classInfo).toBeNull();
    }
  });
});

// ============================================================
// requireParent Tests
// ============================================================

describe('requireParent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error if no auth', async () => {
    mockGetAuthUser.mockReturnValue(null);
    const request = new NextRequest('http://localhost/api/parent/test');

    const result = await requireParent(request);

    expect(isAuthError(result)).toBe(true);
    if (isAuthError(result)) {
      expect(result.error.status).toBe(401);
    }
  });

  it('returns parent + children on success', async () => {
    mockGetAuthUser.mockReturnValue({
      userId: 'user-3',
      role: Role.PARENT,
      email: 'parent@test.com',
      name: 'Parent',
    });

    const mockParent = {
      id: 'parent-1',
      firstName: 'Raj',
      lastName: 'Kumar',
      phone: '9876543210',
      email: 'parent@test.com',
      occupation: 'Engineer',
      address: '123 Main St',
      relation: 'Father',
      isEmergencyContact: true,
      photo: null,
      kycDoc: null,
      kycStatus: null,
      kycRejectionReason: null,
    };
    mockParentFindFirst.mockResolvedValue(mockParent);

    const mockStudentParents = [
      {
        isPrimary: true,
        student: {
          id: 'student-1',
          firstName: 'Aarav',
          lastName: 'Kumar',
          photo: null,
          dob: new Date('2020-01-01'),
          gender: 'Male',
          bloodGroup: null,
          rollNumber: '001',
          status: 'ACTIVE',
          admissionDate: new Date('2023-01-01'),
          class: {
            id: 'class-1',
            name: 'Nursery-A',
            program: { id: 'prog-1', name: 'Nursery' },
            teacher: null,
          },
        },
      },
    ];
    mockStudentParentFindMany.mockResolvedValue(mockStudentParents);

    const request = new NextRequest('http://localhost/api/parent/test');
    const result = await requireParent(request);

    expect(isAuthError(result)).toBe(false);
    if (!isAuthError(result)) {
      expect(result.parent).toEqual(mockParent);
      expect(result.userId).toBe('user-3');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].id).toBe('student-1');
      expect(result.children[0].firstName).toBe('Aarav');
      expect(result.childIds).toEqual(['student-1']);
    }
  });
});

// ============================================================
// verifyChildAccess Tests
// ============================================================

describe('verifyChildAccess', () => {
  const parentAuth = {
    parent: {
      id: 'parent-1',
      firstName: 'Raj',
      lastName: 'Kumar',
      phone: '9876543210',
      email: 'parent@test.com',
      occupation: null,
      address: null,
      relation: 'Father',
      isEmergencyContact: true,
      photo: null,
      kycDoc: null,
      kycStatus: null,
      kycRejectionReason: null,
    },
    userId: 'user-3',
    children: [
      { id: 'child-1', firstName: 'Aarav', lastName: 'K', photo: null, dob: new Date(), gender: 'Male', bloodGroup: null, rollNumber: null, status: 'ACTIVE', admissionDate: new Date(), class: null, isPrimary: true },
      { id: 'child-2', firstName: 'Ananya', lastName: 'K', photo: null, dob: new Date(), gender: 'Female', bloodGroup: null, rollNumber: null, status: 'ACTIVE', admissionDate: new Date(), class: null, isPrimary: false },
    ],
    childIds: ['child-1', 'child-2'],
  } as any;

  it('returns null if childId is in childIds', () => {
    const result = verifyChildAccess(parentAuth, 'child-1');
    expect(result).toBeNull();
  });

  it('returns null for second child', () => {
    const result = verifyChildAccess(parentAuth, 'child-2');
    expect(result).toBeNull();
  });

  it('returns 403 if childId not in childIds', () => {
    const result = verifyChildAccess(parentAuth, 'child-999');
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });
});

// ============================================================
// getParentUserId Tests
// ============================================================

describe('getParentUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds User by parent email', async () => {
    mockParentFindUnique.mockResolvedValue({
      email: 'parent@test.com',
      phone: '9876543210',
    });
    mockUserFindFirst.mockResolvedValue({ id: 'user-3' });

    const result = await getParentUserId('parent-1');

    expect(mockParentFindUnique).toHaveBeenCalledWith({
      where: { id: 'parent-1' },
      select: { email: true, phone: true },
    });
    expect(mockUserFindFirst).toHaveBeenCalledWith({
      where: {
        role: 'PARENT',
        OR: [
          { email: 'parent@test.com' },
          { email: '9876543210' },
        ],
      },
      select: { id: true },
    });
    expect(result).toBe('user-3');
  });

  it('returns null if parent not found', async () => {
    mockParentFindUnique.mockResolvedValue(null);

    const result = await getParentUserId('nonexistent');
    expect(result).toBeNull();
    expect(mockUserFindFirst).not.toHaveBeenCalled();
  });

  it('returns null if no matching user found', async () => {
    mockParentFindUnique.mockResolvedValue({
      email: 'orphan@test.com',
      phone: '0000000000',
    });
    mockUserFindFirst.mockResolvedValue(null);

    const result = await getParentUserId('parent-2');
    expect(result).toBeNull();
  });
});

// ============================================================
// isAuthError Tests
// ============================================================

describe('isAuthError', () => {
  it('identifies error objects correctly', () => {
    const errorResult = {
      error: new Response(JSON.stringify({ error: 'test' }), { status: 401 }),
    };
    expect(isAuthError(errorResult)).toBe(true);
  });

  it('returns false for success results', () => {
    const successResult = {
      teacher: { id: 'teacher-1' },
      classId: 'class-1',
      classInfo: null,
    };
    expect(isAuthError(successResult)).toBe(false);
  });

  it('returns false for parent success results', () => {
    const successResult = {
      parent: { id: 'parent-1' },
      userId: 'user-1',
      children: [],
      childIds: [],
    };
    expect(isAuthError(successResult)).toBe(false);
  });
});
