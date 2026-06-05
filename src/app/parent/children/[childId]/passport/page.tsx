'use client';

import { useParams } from 'next/navigation';
import { PassportPage } from '@/components/ui/passport-page';

export default function ParentPassportPage() {
  const params = useParams();
  return <PassportPage studentId={params.childId as string} role="PARENT" portalPrefix="/parent" />;
}
