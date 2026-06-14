"use client";

import { useEffect } from 'react';
import { initClientErrorHandler } from '@/lib/client-error-handler';

export function ErrorHandlerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Read the current user (set by the login flow) for error attribution.
    let user: { id?: string; role?: string; schoolId?: string } = {};
    try {
      user = JSON.parse(localStorage.getItem('preone_user') || '{}');
    } catch {
      user = {};
    }
    initClientErrorHandler(user?.id, user?.role, user?.schoolId);
  }, []);

  return <>{children}</>;
}
