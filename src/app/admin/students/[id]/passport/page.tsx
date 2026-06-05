'use client';

import { useParams } from 'next/navigation';
import { PassportPage } from '@/components/ui/passport-page';

export default function AdminPassportPage() {
  const params = useParams();
  return <PassportPage studentId={params.id as string} role="ADMIN" portalPrefix="/admin" />;
}
