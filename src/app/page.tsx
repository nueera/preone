'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

// Role-based dashboard paths
const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  PARENT: '/parent/dashboard',
  TASK_MASTER: '/admin/crm',
};

export default function RootPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('preone_token');
        const userStr = localStorage.getItem('preone_user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          const role = user?.role as string;
          const dashboardPath = ROLE_DASHBOARD[role] || '/login';
          router.replace(dashboardPath);
          return;
        }
      } catch {
        // Invalid token/user data, redirect to login
      }
      router.replace('/login');
    };

    // Small delay to ensure localStorage is available (client-side only)
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [router]);

  // Show loading spinner while checking auth state
  if (!checking) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-violet-500/25">
          <Image src="/preonelogo.png" alt="PreOne" width={64} height={64} className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-muted-foreground">Redirecting...</span>
        </div>
      </div>
    </div>
  );
}
