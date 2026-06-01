import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';

/**
 * Admin Layout — Server component wrapping the PreOne admin portal.
 * Provides the sidebar + header + main content structure.
 * SidebarProvider wraps everything for state management.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 bg-gray-50 p-6 overflow-auto dark:bg-gray-950">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
