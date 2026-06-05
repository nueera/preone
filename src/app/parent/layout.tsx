import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { redirect } from 'next/navigation';
import { ParentLayoutClient } from './parent-layout-client';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'PARENT') {
    redirect('/login');
  }

  return <ParentLayoutClient>{children}</ParentLayoutClient>;
}
