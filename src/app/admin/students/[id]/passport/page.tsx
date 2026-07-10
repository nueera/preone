'use client';

import { useParams } from 'next/navigation';
import { PassportPage } from '@/components/ui/passport-page';
import {
  WarmPremium,
  WarmCard,
  WarmCardHeader,
  WarmCardTitle,
  WarmCardDescription,
  WarmCardContent,
  WarmCardFooter,
  WarmSectionHeading,
  WarmEmptyState,
  WarmButton,
  WarmStatCard,
  WarmPill,
} from '@/components/warm-premium';

export default function AdminPassportPage() {
  const params = useParams();
  return (
    <WarmPremium className="min-h-screen">
      <PassportPage studentId={params.id as string} role="ADMIN" portalPrefix="/admin" />
    </WarmPremium>
  );
}
