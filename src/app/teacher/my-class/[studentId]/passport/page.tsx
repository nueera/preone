'use client';

import { useParams } from 'next/navigation';
import { PassportPage } from '@/components/ui/passport-page';

export default function TeacherPassportPage() {
  const params = useParams();
  return <PassportPage studentId={params.studentId as string} role="TEACHER" portalPrefix="/teacher" />;
}
