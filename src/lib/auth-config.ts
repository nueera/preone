import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            school: { select: { id: true, name: true, onboardingComplete: true } },
            branch: { select: { id: true, name: true } },
            teacher: { select: { id: true } },
          },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated. Please contact your administrator.');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId || '',
          branchId: user.branchId || '',
          isActive: user.isActive,
          onboardingComplete: user.school?.onboardingComplete ?? false,
          schoolName: user.school?.name || '',
          branchName: user.branch?.name || '',
          teacherId: user.teacher?.id,
          avatar: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user }) {
      // isActive check is done in authorize
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.branchId = user.branchId;
        token.isActive = user.isActive;
        token.onboardingComplete = user.onboardingComplete;
        token.schoolName = user.schoolName;
        token.branchName = user.branchName;
        token.teacherId = user.teacherId;
        token.avatar = user.avatar;
      }

      // Handle session update (e.g., after profile change)
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.avatar = session.avatar;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.schoolId = token.schoolId as string;
        session.user.branchId = token.branchId as string;
        session.user.isActive = token.isActive as boolean;
        session.user.onboardingComplete = token.onboardingComplete as boolean;
        session.user.schoolName = token.schoolName as string;
        session.user.branchName = token.branchName as string;
        session.user.teacherId = token.teacherId as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return baseUrl + url;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Type extensions
declare module 'next-auth' {
  interface Session {
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
  interface User {
    role: string;
    schoolId: string;
    branchId: string;
    isActive: boolean;
    onboardingComplete: boolean;
    schoolName: string;
    branchName: string;
    teacherId?: string;
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    schoolId: string;
    branchId: string;
    isActive: boolean;
    onboardingComplete: boolean;
    schoolName: string;
    branchName: string;
    teacherId?: string;
    avatar?: string;
  }
}
