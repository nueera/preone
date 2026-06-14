'use client';

// ============================================================
// PreOne — Client auth hook
// Reads the authenticated user from localStorage (set by the login
// page after calling /api/auth/login). The custom preone_token is the
// single source of truth across the app (middleware, API routes,
// Socket.io, and the parent/teacher fetch wrappers all use it).
// ============================================================

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const TOKEN_KEY = 'preone_token';
const USER_KEY = 'preone_user';

interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  schoolId?: string | null;
  branchId?: string | null;
  avatar?: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      setUser(raw ? (JSON.parse(raw) as AuthUser) : null);
    } catch {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Expire the cookie the middleware / server layouts read.
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
    router.push('/login');
    router.refresh();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isUnauthenticated: !user && !isLoading,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isTaskMaster: user?.role === 'TASK_MASTER',
    isTeacher: user?.role === 'TEACHER',
    isParent: user?.role === 'PARENT',
    role: user?.role,
    schoolId: user?.schoolId,
    branchId: user?.branchId,
  };
}
