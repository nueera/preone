'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isUnauthenticated = status === 'unauthenticated';
  const user = session?.user;

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
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
