import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hashPasswordSync,
  comparePassword,
  generateToken,
  verifyToken,
  getAuthUser,
  requireRole,
  isAdmin,
  isTeacher,
  isParent,
  isTaskMaster,
  getDashboardPath,
  hasRole,
  Role,
  unauthorized,
  forbidden,
  type TokenPayload,
} from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// Password Hashing Tests
// ============================================================

describe('hashPasswordSync & comparePassword', () => {
  it('hashPasswordSync returns a bcrypt hash', () => {
    const hash = hashPasswordSync('mypassword');
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('mypassword');
    // bcrypt hashes start with $2a$ or $2b$
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it('comparePassword returns true for correct password', async () => {
    const hash = hashPasswordSync('mypassword');
    const result = await comparePassword('mypassword', hash);
    expect(result).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const hash = hashPasswordSync('mypassword');
    const result = await comparePassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('comparePassword returns false for invalid hash', async () => {
    const result = await comparePassword('mypassword', 'not-a-hash');
    expect(result).toBe(false);
  });
});

// ============================================================
// Token Generation & Verification Tests
// ============================================================

describe('generateToken', () => {
  it('creates a token string with payload.signature format', () => {
    const token = generateToken({
      userId: 'user-1',
      role: Role.ADMIN,
      email: 'admin@test.com',
      name: 'Admin',
    });
    expect(typeof token).toBe('string');
    // Token should have exactly one dot separating payload and signature
    const parts = token.split('.');
    expect(parts.length).toBe(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it('includes branchId and schoolId in token payload', () => {
    const token = generateToken({
      userId: 'user-1',
      role: Role.TEACHER,
      email: 'teacher@test.com',
      name: 'Teacher',
      branchId: 'branch-1',
      schoolId: 'school-1',
    });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.branchId).toBe('branch-1');
    expect(payload!.schoolId).toBe('school-1');
  });
});

describe('verifyToken', () => {
  it('returns null for empty string', () => {
    expect(verifyToken('')).toBeNull();
  });

  it('returns null for token without dot', () => {
    expect(verifyToken('invalidtoken')).toBeNull();
  });

  it('returns null for token with wrong signature', () => {
    const token = generateToken({ userId: 'user-1', role: Role.ADMIN });
    // Tamper with the signature
    const [payload] = token.split('.');
    const tampered = `${payload}.deadbeefdeadbeef`;
    expect(verifyToken(tampered)).toBeNull();
  });

  it('returns null for token with invalid role', () => {
    const token = generateToken({ userId: 'user-1', role: 'INVALID_ROLE' });
    // The token was generated with an invalid role, verifyToken should reject it
    expect(verifyToken(token)).toBeNull();
  });

  it('returns payload for valid token', () => {
    const token = generateToken({
      userId: 'user-1',
      role: Role.ADMIN,
      email: 'admin@test.com',
      name: 'Admin User',
    });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe('user-1');
    expect(payload!.role).toBe(Role.ADMIN);
    expect(payload!.email).toBe('admin@test.com');
    expect(payload!.name).toBe('Admin User');
  });

  it('returns payload with TEACHER role', () => {
    const token = generateToken({ userId: 'user-2', role: Role.TEACHER });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.role).toBe(Role.TEACHER);
  });

  it('returns payload with PARENT role', () => {
    const token = generateToken({ userId: 'user-3', role: Role.PARENT });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.role).toBe(Role.PARENT);
  });

  it('returns payload with TASK_MASTER role', () => {
    const token = generateToken({ userId: 'user-4', role: Role.TASK_MASTER });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.role).toBe(Role.TASK_MASTER);
  });
});

// ============================================================
// getAuthUser Tests
// ============================================================

describe('getAuthUser', () => {
  it('returns null when no Authorization header', () => {
    const request = new NextRequest('http://localhost/api/test');
    expect(getAuthUser(request)).toBeNull();
  });

  it('returns null when Authorization header has no Bearer prefix', () => {
    const request = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Basic abc123' },
    });
    expect(getAuthUser(request)).toBeNull();
  });

  it('returns null for invalid Bearer token', () => {
    const request = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer invalid-token' },
    });
    expect(getAuthUser(request)).toBeNull();
  });

  it('extracts user from valid Bearer token', () => {
    const token = generateToken({
      userId: 'user-1',
      role: Role.ADMIN,
      email: 'admin@test.com',
      name: 'Admin',
    });
    const request = new NextRequest('http://localhost/api/test', {
      headers: { authorization: `Bearer ${token}` },
    });
    const user = getAuthUser(request);
    expect(user).not.toBeNull();
    expect(user!.userId).toBe('user-1');
    expect(user!.role).toBe(Role.ADMIN);
  });
});

// ============================================================
// requireRole Tests
// ============================================================

describe('requireRole', () => {
  it('returns 401 when no auth', () => {
    const request = new NextRequest('http://localhost/api/test');
    const result = requireRole(request, Role.ADMIN);
    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(401);
  });

  it('returns 403 for wrong role', () => {
    const token = generateToken({ userId: 'user-1', role: Role.PARENT });
    const request = new NextRequest('http://localhost/api/test', {
      headers: { authorization: `Bearer ${token}` },
    });
    const result = requireRole(request, Role.ADMIN);
    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(403);
  });

  it('returns user for correct role', () => {
    const token = generateToken({
      userId: 'user-1',
      role: Role.ADMIN,
      email: 'admin@test.com',
      name: 'Admin',
    });
    const request = new NextRequest('http://localhost/api/test', {
      headers: { authorization: `Bearer ${token}` },
    });
    const result = requireRole(request, Role.ADMIN);
    expect(result).not.toBeInstanceOf(NextResponse);
    const user = result as TokenPayload;
    expect(user.userId).toBe('user-1');
    expect(user.role).toBe(Role.ADMIN);
  });

  it('returns user when role is one of multiple allowed roles', () => {
    const token = generateToken({
      userId: 'user-1',
      role: Role.TEACHER,
      email: 'teacher@test.com',
      name: 'Teacher',
    });
    const request = new NextRequest('http://localhost/api/test', {
      headers: { authorization: `Bearer ${token}` },
    });
    const result = requireRole(request, Role.ADMIN, Role.TEACHER);
    expect(result).not.toBeInstanceOf(NextResponse);
    const user = result as TokenPayload;
    expect(user.role).toBe(Role.TEACHER);
  });
});

// ============================================================
// Role Helper Tests
// ============================================================

describe('Role helpers', () => {
  const adminUser: TokenPayload = { userId: '1', email: 'a@test.com', name: 'Admin', role: Role.ADMIN };
  const teacherUser: TokenPayload = { userId: '2', email: 't@test.com', name: 'Teacher', role: Role.TEACHER };
  const parentUser: TokenPayload = { userId: '3', email: 'p@test.com', name: 'Parent', role: Role.PARENT };
  const taskMasterUser: TokenPayload = { userId: '4', email: 'tm@test.com', name: 'TM', role: Role.TASK_MASTER };

  it('isAdmin returns true only for ADMIN', () => {
    expect(isAdmin(adminUser)).toBe(true);
    expect(isAdmin(teacherUser)).toBe(false);
    expect(isAdmin(parentUser)).toBe(false);
    expect(isAdmin(taskMasterUser)).toBe(false);
  });

  it('isTeacher returns true only for TEACHER', () => {
    expect(isTeacher(adminUser)).toBe(false);
    expect(isTeacher(teacherUser)).toBe(true);
    expect(isTeacher(parentUser)).toBe(false);
    expect(isTeacher(taskMasterUser)).toBe(false);
  });

  it('isParent returns true only for PARENT', () => {
    expect(isParent(adminUser)).toBe(false);
    expect(isParent(teacherUser)).toBe(false);
    expect(isParent(parentUser)).toBe(true);
    expect(isParent(taskMasterUser)).toBe(false);
  });

  it('isTaskMaster returns true only for TASK_MASTER', () => {
    expect(isTaskMaster(adminUser)).toBe(false);
    expect(isTaskMaster(teacherUser)).toBe(false);
    expect(isTaskMaster(parentUser)).toBe(false);
    expect(isTaskMaster(taskMasterUser)).toBe(true);
  });
});

// ============================================================
// getDashboardPath Tests
// ============================================================

describe('getDashboardPath', () => {
  it('returns /admin/dashboard for ADMIN', () => {
    expect(getDashboardPath(Role.ADMIN)).toBe('/admin/dashboard');
  });

  it('returns /admin/crm for TASK_MASTER', () => {
    expect(getDashboardPath(Role.TASK_MASTER)).toBe('/admin/crm');
  });

  it('returns /teacher/dashboard for TEACHER', () => {
    expect(getDashboardPath(Role.TEACHER)).toBe('/teacher/dashboard');
  });

  it('returns /parent/dashboard for PARENT', () => {
    expect(getDashboardPath(Role.PARENT)).toBe('/parent/dashboard');
  });
});

// ============================================================
// hasRole Tests
// ============================================================

describe('hasRole', () => {
  const adminUser: TokenPayload = { userId: '1', email: 'a@test.com', name: 'Admin', role: Role.ADMIN };
  const teacherUser: TokenPayload = { userId: '2', email: 't@test.com', name: 'Teacher', role: Role.TEACHER };

  it('returns true when user role is in allowed list', () => {
    expect(hasRole(adminUser, Role.ADMIN)).toBe(true);
    expect(hasRole(adminUser, Role.ADMIN, Role.TEACHER)).toBe(true);
  });

  it('returns false when user role is not in allowed list', () => {
    expect(hasRole(teacherUser, Role.ADMIN)).toBe(false);
    expect(hasRole(teacherUser, Role.PARENT, Role.ADMIN)).toBe(false);
  });

  it('returns true for multiple roles including user role', () => {
    expect(hasRole(teacherUser, Role.ADMIN, Role.TEACHER, Role.PARENT)).toBe(true);
  });
});

// ============================================================
// unauthorized & forbidden Tests
// ============================================================

describe('unauthorized & forbidden', () => {
  it('unauthorized returns 401 response', async () => {
    const response = unauthorized();
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe(true);
    expect(body.message).toBe('Authentication required');
  });

  it('forbidden returns 403 response', async () => {
    const response = forbidden();
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe(true);
  });
});
