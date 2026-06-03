'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';

// TASK_MASTER can only access these admin routes
const TASK_MASTER_ALLOWED = ['/admin/dashboard', '/admin/crm'];

/**
 * Admin Layout — Client component wrapping the PreOne admin portal.
 * Provides the sidebar + header + main content structure.
 * Supports both ADMIN and TASK_MASTER roles.
 * TASK_MASTER sees same layout but sidebar only shows CRM + Dashboard.
 * data-portal="admin" for CSS theme scoping.
 * data-role attribute for role-specific styling.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Read role synchronously on first render to avoid flash
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ADMIN';
    try {
      const saved = localStorage.getItem('preone_user');
      if (saved) {
        const user = JSON.parse(saved);
        return user.role || 'ADMIN';
      }
    } catch {
      // Default to ADMIN
    }
    return 'ADMIN';
  });

  // Sync on storage changes (e.g., login/logout in another tab)
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('preone_user');
        if (saved) {
          const user = JSON.parse(saved);
          setUserRole(user.role || 'ADMIN');
        }
      } catch {
        // Ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Client-side route guard for TASK_MASTER
  useEffect(() => {
    if (userRole === 'TASK_MASTER') {
      const isAllowed = TASK_MASTER_ALLOWED.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
      );
      if (!isAllowed) {
        router.replace('/admin/crm');
      }
    }
  }, [userRole, pathname, router]);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <AdminHeader />
        <main
          className="flex-1 bg-background p-6 overflow-auto"
          data-portal="admin"
          data-role={userRole.toLowerCase()}
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
