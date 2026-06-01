'use client';

// ============================================================
// PreOne — Teacher Auth Context
// Provides teacher data, class info, and auth state to all
// teacher portal pages. Reads token from localStorage and
// fetches teacher profile on mount.
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { teacherFetch } from '@/lib/teacher-api';

// ============================================================
// Types
// ============================================================

interface TeacherClassInfo {
  id: string;
  name: string;
  program: { id: string; name: string };
}

interface TeacherInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo: string | null;
  qualification: string | null;
  specialization: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  experience: number;
  joiningDate: string;
  assignedClass: TeacherClassInfo | null;
}

interface TeacherAuthContextType {
  teacher: TeacherInfo | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============================================================
// Context
// ============================================================

const TeacherAuthContext = createContext<TeacherAuthContextType>({
  teacher: null,
  isLoading: true,
  isError: false,
  error: null,
  refresh: async () => {},
});

export function useTeacherAuth() {
  return useContext(TeacherAuthContext);
}

// ============================================================
// Provider
// ============================================================

export function TeacherAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const res = await teacherFetch('/api/teacher/profile');
      if (!res) {
        // teacherFetch already handles redirect
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to load profile' }));
        throw new Error(err.error || 'Failed to load profile');
      }

      const data = await res.json();
      setTeacher(data);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to load teacher profile');
      // If token is missing, redirect to login
      if (!localStorage.getItem('preone_token')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <TeacherAuthContext.Provider
      value={{
        teacher,
        isLoading,
        isError,
        error,
        refresh: fetchProfile,
      }}
    >
      {children}
    </TeacherAuthContext.Provider>
  );
}
