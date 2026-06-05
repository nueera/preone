"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { initClientErrorHandler } from '@/lib/client-error-handler';

export function ErrorHandlerProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    initClientErrorHandler(
      session?.user?.id,
      (session?.user as any)?.role,
      (session?.user as any)?.schoolId,
    );
  }, [session?.user?.id, (session?.user as any)?.role, (session?.user as any)?.schoolId]);

  return <>{children}</>;
}
