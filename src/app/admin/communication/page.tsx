'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Megaphone,
  MessageCircle,
  Bell,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat-store';
import { useAnnouncementStore } from '@/lib/stores/announcement-store';
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/page-transition';

// ── Module Definitions ──
interface CommunicationModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  accentVar: string;
  accentHex: string;
  statLabel: string;
  illustration: string;
}

const MODULES: CommunicationModule[] = [
  {
    id: 'chat',
    title: 'Chat',
    description: 'Real-time messaging with parents and staff members',
    icon: MessageSquare,
    href: '/admin/communication/chat',
    accentVar: '--admin-info',
    accentHex: '#3B82F6',
    statLabel: 'New Messages',
    illustration: '/icons/admin/communication/chat.webp',
  },
  {
    id: 'announcements',
    title: 'Announcements',
    description: 'Broadcast important updates to parents and staff',
    icon: Megaphone,
    href: '/admin/communication/announcements',
    accentVar: '--admin-warning',
    accentHex: '#F59E0B',
    statLabel: 'New Announcements',
    illustration: '/icons/admin/communication/announcements.webp',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Stay on top of alerts and important reminders',
    icon: Bell,
    href: '/admin/communication/notifications',
    accentVar: '--admin-primary',
    accentHex: '#6366F1',
    statLabel: 'Unread Alerts',
    illustration: '/icons/admin/communication/notifications.webp',
  },
  {
    id: 'templates',
    title: 'Message Templates',
    description: 'Reusable templates for common communications',
    icon: FileText,
    href: '/admin/communication/templates',
    accentVar: '--admin-success',
    accentHex: '#10B981',
    statLabel: 'Templates Available',
    illustration: '/icons/admin/communication/templates.webp',
  },
];

// ── Illustration Fallback ──
function CardIllustration({
  icon: Icon,
  illustrationSrc,
  accentHex,
}: {
  icon: React.ElementType;
  illustrationSrc: string;
  accentHex: string;
}) {
  const [hasImage, setHasImage] = React.useState(true);

  if (!hasImage) {
    // Fallback: large white icon at 20% opacity
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Icon
          className="w-24 h-24 sm:w-28 sm:h-28"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          strokeWidth={1.2}
        />
      </div>
    );
  }

  return (
     
    <img
      src={illustrationSrc}
      alt=""
      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
      style={{ filter: 'brightness(0) invert(1) opacity(0.9)' }}
      onError={() => setHasImage(false)}
      loading="lazy"
    />
  );
}

// ── Main Page ──
export default function CommunicationCenterPage() {
  const totalUnread = useChatStore((s) => s.totalUnread);
  const { announcements, fetchAnnouncements } = useAnnouncementStore();

  useEffect(() => {
    fetchAnnouncements().catch(() => {});
  }, [fetchAnnouncements]);

  // ── Live Data Computation ──
  const chatUnread = totalUnread;
  const publishedCount = announcements?.filter((a) => a.status === 'PUBLISHED').length ?? 0;
  const draftCount = announcements?.filter((a) => a.status === 'DRAFT').length ?? 0;
  const notificationCount = chatUnread + draftCount;
  const templateCount = 24; // Static fallback — replace with API later

  const statValues: Record<string, number> = {
    chat: chatUnread,
    announcements: publishedCount,
    notifications: notificationCount,
    templates: templateCount,
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* ── Header Section ── */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
            style={{
              backgroundColor: 'var(--admin-primary-soft)',
              color: 'var(--admin-primary)',
            }}
          >
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1
              className="text-[28px] font-bold leading-tight"
              style={{ color: 'var(--admin-text)' }}
            >
              Communication Center
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              Stay connected with parents, staff &amp; students
            </p>
          </div>
        </div>

        {/* ── Cards Grid ── */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const stat = statValues[mod.id] ?? 0;
            const accentColor = `var(${mod.accentVar}, ${mod.accentHex})`;

            return (
              <StaggerItem key={mod.id}>
                <Link href={mod.href} className="group block">
                  <div
                    className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1 min-h-[260px] sm:min-h-[300px]"
                    style={{ backgroundColor: accentColor }}
                  >
                    {/* ── Main Content Area ── */}
                    <div className="flex flex-1 p-5 sm:p-6">
                      {/* Left Column (~60%) */}
                      <div className="flex-1 flex flex-col justify-between pr-2">
                        <div>
                          {/* White circle badge with colored icon */}
                          <div
                            className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-sm mb-4"
                            style={{ backgroundColor: '#FFFFFF' }}
                          >
                            <Icon
                              className="w-5 h-5 sm:w-6 sm:h-6"
                              style={{ color: accentColor }}
                            />
                          </div>

                          {/* Title */}
                          <h2 className="text-xl font-semibold text-white mb-1.5">
                            {mod.title}
                          </h2>

                          {/* Description */}
                          <p
                            className="text-[13px] leading-relaxed"
                            style={{ color: 'rgba(255,255,255,0.85)' }}
                          >
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Column — Illustration (~40%, hidden on mobile) */}
                      <div className="hidden sm:flex w-[40%] items-end justify-center">
                        <div className="w-full h-36">
                          <CardIllustration
                            icon={Icon}
                            illustrationSrc={mod.illustration}
                            accentHex={mod.accentHex}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Bottom Stat Bar ── */}
                    <div
                      className="flex items-center justify-between px-5 sm:px-6 py-3.5"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[32px] sm:text-[36px] font-bold text-white leading-none">
                          {stat}
                        </span>
                        <span
                          className="text-[13px]"
                          style={{ color: 'rgba(255,255,255,0.80)' }}
                        >
                          {mod.statLabel}
                        </span>
                      </div>
                      <ChevronRight
                        className="w-5 h-5 transition-transform duration-150 group-hover:translate-x-0.5"
                        style={{ color: 'rgba(255,255,255,0.70)' }}
                      />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
