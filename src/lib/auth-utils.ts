import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ====== PASSWORD UTILITIES ======

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hash);
}

// ====== OTP ======

export async function createOTP(email: string, purpose: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any existing OTPs for this email+purpose
  await prisma.otp.updateMany({
    where: { email, purpose, isUsed: false },
    data: { isUsed: true },
  });

  const otp = await prisma.otp.create({
    data: { email, code, purpose, expiresAt },
  });

  return otp;
}

export async function verifyOTP(email: string, code: string, purpose: string): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: {
      email,
      code,
      purpose,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) return false;

  await prisma.otp.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });

  return true;
}

// ====== RATE LIMITING (in-memory) ======

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now - record.lastAttempt > windowMs) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  record.lastAttempt = now;
  return { allowed: true, remaining: maxAttempts - record.count };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    if (now - record.lastAttempt > 30 * 60 * 1000) {
      loginAttempts.delete(key);
    }
  }
}, 30 * 60 * 1000);

// ====== SESSION HELPERS ======

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// ====== withAuth WRAPPER for API routes ======

interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    schoolId: string;
    branchId: string;
    isActive: boolean;
    onboardingComplete: boolean;
    schoolName: string;
    branchName: string;
    teacherId?: string;
    avatar?: string;
  };
}

type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

interface WithAuthOptions {
  roles?: string[];
}

export function withAuth(
  handler: AuthenticatedHandler,
  options: WithAuthOptions = {}
) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: true, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (options.roles && !options.roles.includes(session.user.role)) {
      return NextResponse.json(
        { error: true, message: 'You do not have permission to access this resource' },
        { status: 403 }
      );
    }

    if (!session.user.isActive) {
      return NextResponse.json(
        { error: true, message: 'Account has been deactivated' },
        { status: 403 }
      );
    }

    // Attach user to request
    const authenticatedReq = Object.assign(req, { user: session.user });

    return handler(authenticatedReq, ctx);
  };
}

// ====== SCHOOL ISOLATION ======

export async function requireSchoolAccess(userSchoolId: string, resourceSchoolId: string) {
  if (userSchoolId !== resourceSchoolId) {
    throw new Error('Access denied. Resource belongs to a different school.');
  }
}

// ====== TOKEN GENERATION (for API key auth) ======

export function generateApiToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}
