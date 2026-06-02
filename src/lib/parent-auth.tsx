'use client';

// ============================================================
// PreOne — Parent Auth Context
// Provides parent data, children list, and selected child
// to all parent portal pages. Reads token from localStorage
// and fetches parent profile on mount.
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
import { parentFetch, getSelectedChildId, setSelectedChildId } from '@/lib/parent-api';

// ============================================================
// Types
// ============================================================

interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  rollNumber: string | null;
  status: string;
  isPrimary: boolean;
  className: string | null;
  programName: string | null;
  classId: string | null;
}

interface ParentInfo {
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
  kycStatus: string | null;
}

interface ParentAuthContextType {
  parent: ParentInfo | null;
  children: ChildInfo[];
  selectedChild: ChildInfo | null;
  selectedChildId: string | null;
  selectChild: (childId: string) => void;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============================================================
// Context
// ============================================================

const ParentAuthContext = createContext<ParentAuthContextType>({
  parent: null,
  children: [],
  selectedChild: null,
  selectedChildId: null,
  selectChild: () => {},
  isLoading: true,
  isError: false,
  error: null,
  refresh: async () => {},
});

export function useParentAuth() {
  return useContext(ParentAuthContext);
}

// ============================================================
// Provider
// ============================================================

export function ParentAuthProvider({ children: childNodes }: { children: ReactNode }) {
  const router = useRouter();
  const [parent, setParent] = useState<ParentInfo | null>(null);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const res = await parentFetch('/api/parent/me');
      if (!res) return;

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to load profile' }));
        throw new Error(err.error || 'Failed to load profile');
      }

      const data = await res.json();
      setParent(data.parent);

      const childList: ChildInfo[] = (data.children || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        firstName: c.firstName as string,
        lastName: c.lastName as string,
        photo: (c.photo as string) || null,
        rollNumber: (c.rollNumber as string) || null,
        status: c.status as string,
        isPrimary: c.isPrimary as boolean,
        className: (c.class as Record<string, unknown>)?.name as string || null,
        programName: ((c.class as Record<string, unknown>)?.program as Record<string, unknown>)?.name as string || null,
        classId: (c.class as Record<string, unknown>)?.id as string || null,
      }));
      setChildren(childList);

      // Update parent info with all fields from /api/parent/me response
      if (data.parent) {
        setParent((prev) => ({
          ...prev,
          id: data.parent.id as string,
          firstName: data.parent.firstName as string,
          lastName: data.parent.lastName as string,
          phone: data.parent.phone as string,
          email: data.parent.email as string | null,
          occupation: data.parent.occupation as string | null,
          address: data.parent.address as string | null,
          relation: data.parent.relation as string,
          isEmergencyContact: data.parent.isEmergencyContact as boolean,
          photo: data.parent.photo as string | null,
          kycStatus: data.parent.kycStatus as string | null,
        } as ParentInfo));
      }

      // Auto-select child: from localStorage > URL > primary > first
      const storedChildId = getSelectedChildId();
      const primaryChild = childList.find((c) => c.isPrimary);
      const defaultChild = primaryChild || childList[0];

      if (storedChildId && childList.some((c) => c.id === storedChildId)) {
        setSelectedChildIdState(storedChildId);
      } else if (defaultChild) {
        setSelectedChildIdState(defaultChild.id);
        setSelectedChildId(defaultChild.id);
      }
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to load parent profile');
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

  // Selected child computed
  const selectedChild = children.find((c) => c.id === selectedChildId) || null;

  // Select child handler
  const selectChild = useCallback((childId: string) => {
    if (children.some((c) => c.id === childId)) {
      setSelectedChildIdState(childId);
      setSelectedChildId(childId);
    }
  }, [children]);

  return (
    <ParentAuthContext.Provider
      value={{
        parent,
        children,
        selectedChild,
        selectedChildId,
        selectChild,
        isLoading,
        isError,
        error,
        refresh: fetchProfile,
      }}
    >
      {childNodes}
    </ParentAuthContext.Provider>
  );
}
