import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, Role } from '@/lib/auth';
import { ParentLayoutClient } from './parent-layout-client';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get('preone_token')?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    redirect('/login');
  }

  if (payload.role !== Role.PARENT) {
    redirect('/login');
  }

  return <ParentLayoutClient>{children}</ParentLayoutClient>;
}
