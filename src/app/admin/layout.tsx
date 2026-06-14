import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, Role } from '@/lib/auth';
import { db } from '@/lib/db';
import { AdminLayoutClient } from './admin-layout-client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get('preone_token')?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    redirect('/login');
  }

  if (payload.role !== Role.ADMIN && payload.role !== Role.TASK_MASTER) {
    redirect('/login');
  }

  // onboardingComplete drives the admin-layout-client setup-wizard redirect.
  let onboardingComplete = true;
  if (payload.schoolId) {
    const school = await db.school.findUnique({
      where: { id: payload.schoolId },
      select: { onboardingComplete: true },
    });
    onboardingComplete = school?.onboardingComplete ?? false;
  }

  return (
    <AdminLayoutClient
      userRole={payload.role}
      onboardingComplete={onboardingComplete}
      schoolId={payload.schoolId ?? ''}
    >
      {children}
    </AdminLayoutClient>
  );
}
