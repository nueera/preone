import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { redirect } from 'next/navigation';
import { AdminLayoutClient } from './admin-layout-client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!['ADMIN', 'TASK_MASTER'].includes(session.user.role)) {
    redirect('/login');
  }

  return (
    <AdminLayoutClient
      userRole={session.user.role}
      onboardingComplete={session.user.onboardingComplete}
      schoolId={session.user.schoolId}
    >
      {children}
    </AdminLayoutClient>
  );
}
