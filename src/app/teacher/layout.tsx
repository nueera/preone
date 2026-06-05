import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { redirect } from 'next/navigation';
import { TeacherLayoutClient } from './teacher-layout-client';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'TEACHER') {
    redirect('/login');
  }

  return <TeacherLayoutClient>{children}</TeacherLayoutClient>;
}
