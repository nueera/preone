'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SessionEntryPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  useEffect(() => {
    const fetchAndRedirect = async () => {
      const token = localStorage.getItem('preone_token');
      try {
        const res = await fetch(`/api/onboarding/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const step = data.session.currentStep || 0;
          router.replace(`/admin/onboarding/${sessionId}/step/${Math.max(step + 1, 1)}`);
        } else {
          router.replace('/admin/onboarding');
        }
      } catch {
        router.replace('/admin/onboarding');
      }
    };
    fetchAndRedirect();
  }, [sessionId, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--preone-primary)]" />
    </div>
  );
}
