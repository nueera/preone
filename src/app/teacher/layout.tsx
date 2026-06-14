import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, Role } from '@/lib/auth';
import { TeacherLayoutClient } from './teacher-layout-client';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get('preone_token')?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    redirect('/login');
  }

  if (payload.role !== Role.TEACHER) {
    redirect('/login');
  }

  return <TeacherLayoutClient>{children}</TeacherLayoutClient>;
}
