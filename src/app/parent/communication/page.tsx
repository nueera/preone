'use client';

// ============================================================
// PreOne — Parent Communication Page
// Communication Hub with two tabs:
// 1. Announcements — paginated list with type/priority badges,
//    expand/collapse content, stats row, pagination
// 2. Messages — placeholder coming-soon card
// ============================================================

import React, { useState, useMemo, Suspense } from 'react';
import {
  Megaphone, Bell, AlertCircle, RefreshCw, ChevronDown,
  ChevronLeft, ChevronRight, Paperclip, MessageSquare,
  Calendar, AlertTriangle, Inbox, Clock,
} from 'lucide-react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useParentAuth } from '@/lib/parent-auth';
import {
  useParentAnnouncements,
  type AnnouncementData,
} from '@/hooks/use-parent';

// ============================================================
// CONSTANTS — Badge Configs
// ============================================================

const TYPE_BADGES: Record<string, { label: string; class: string }> = {
  GENERAL: { label: 'General', class: 'bg-sky-100 text-sky-700' },
  HOLIDAY: { label: 'Holiday', class: 'bg-purple-100 text-purple-700' },
  EVENT:   { label: 'Event',   class: 'bg-emerald-100 text-emerald-700' },
  URGENT:  { label: 'Urgent',  class: 'bg-red-100 text-red-700' },
  ACADEMIC:{ label: 'Academic',class: 'bg-blue-100 text-blue-700' },
  FEE:     { label: 'Fee',     class: 'bg-amber-100 text-amber-700' },
};

const PRIORITY_BADGES: Record<string, { label: string; class: string }> = {
  LOW:     { label: 'Low',     class: 'bg-gray-100 text-gray-600' },
  NORMAL:  { label: 'Normal',  class: 'bg-blue-100 text-blue-600' },
  HIGH:    { label: 'High',    class: 'bg-amber-100 text-amber-600' },
  CONCERN: { label: 'Concern', class: 'bg-red-100 text-red-600' },
};

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getTypeBadge(type: string) {
  return TYPE_BADGES[type] || { label: type, class: 'bg-gray-100 text-gray-600' };
}

function getPriorityBadge(priority: string) {
  return PRIORITY_BADGES[priority] || { label: priority, class: 'bg-gray-100 text-gray-600' };
}

/** Count announcements published in the current month */
function countThisMonth(announcements: AnnouncementData[]): number {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  return announcements.filter((a) => {
    const dateStr = a.publishedAt || a.createdAt;
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
}

// ============================================================
// TAB TYPE
// ============================================================

type TabKey = 'announcements' | 'messages';

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CommunicationPage() {
  return (
    <Suspense fallback={<CommunicationLoadingSkeleton />}>
      <CommunicationContent />
    </Suspense>
  );
}

// ============================================================
// CONTENT (wrapped in Suspense)
// ============================================================

function CommunicationContent() {
  const { selectedChild, selectedChildId, children, selectChild } = useParentAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('announcements');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, refetch } = useParentAnnouncements(currentPage);

  const announcements = data?.announcements ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  // Stats
  const urgentCount = useMemo(
    () => announcements.filter((a) => a.type === 'URGENT' || a.priority === 'CONCERN').length,
    [announcements],
  );
  const thisMonthCount = useMemo(() => countThisMonth(announcements), [announcements]);

  // Reset page when switching tabs
  const handleTabSwitch = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === 'announcements') {
      setCurrentPage(1);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <Card className="rounded-3xl border-0 bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Megaphone className="h-6 w-6" />
                Communication Hub
              </h1>
              <p className="text-sky-100 mt-1">
                Stay updated with announcements and messages
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Switch Child */}
              {children.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-sm"
                    >
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Switch Child
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {children.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        className={c.id === selectedChildId ? 'bg-sky-50' : ''}
                        onClick={() => selectChild(c.id)}
                      >
                        <Avatar className="h-5 w-5 mr-2">
                          <AvatarFallback className="text-[8px] bg-sky-100 text-sky-700">
                            {c.firstName[0]}{c.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        {c.firstName} {c.lastName} — {c.className || 'No class'}
                        {c.id === selectedChildId && (
                          <Badge className="ml-2 bg-sky-100 text-sky-700 text-[9px]">Active</Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {selectedChild && (
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {selectedChild.firstName} {selectedChild.lastName}
                  </p>
                  <p className="text-xs text-sky-200">
                    {selectedChild.className || 'No class'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-2">
        <Button
          variant={activeTab === 'announcements' ? 'default' : 'outline'}
          size="sm"
          className={`rounded-xl text-xs ${
            activeTab === 'announcements'
              ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 shadow-sm'
              : 'hover:bg-sky-50 hover:text-sky-700'
          }`}
          onClick={() => handleTabSwitch('announcements')}
        >
          <Megaphone className="h-3.5 w-3.5 mr-1.5" />
          Announcements
        </Button>
        <Button
          variant={activeTab === 'messages' ? 'default' : 'outline'}
          size="sm"
          className={`rounded-xl text-xs ${
            activeTab === 'messages'
              ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 shadow-sm'
              : 'hover:bg-sky-50 hover:text-sky-700'
          }`}
          onClick={() => handleTabSwitch('messages')}
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
          Messages
        </Button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'announcements' ? (
        <AnnouncementsTab
          announcements={announcements}
          total={total}
          urgentCount={urgentCount}
          thisMonthCount={thisMonthCount}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
        />
      ) : (
        <MessagesTab />
      )}
    </div>
  );
}

// ============================================================
// ANNOUNCEMENTS TAB
// ============================================================

function AnnouncementsTab({
  announcements,
  total,
  urgentCount,
  thisMonthCount,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  isError,
  onRetry,
}: {
  announcements: AnnouncementData[];
  total: number;
  urgentCount: number;
  thisMonthCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  // ── Loading state ──
  if (isLoading && announcements.length === 0) {
    return <CommunicationLoadingSkeleton />;
  }

  // ── Error state ──
  if (isError && announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">Failed to load announcements</p>
        <Button onClick={onRetry} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-3xl border bg-sky-50 border-sky-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-xl bg-sky-100">
                <Bell className="h-4 w-4 text-sky-600" />
              </div>
              <span className="text-xl font-bold text-sky-600">{total}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Announcements</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-xl bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-xl font-bold text-red-600">{urgentCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Urgent</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-xl bg-emerald-100">
                <Calendar className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-xl font-bold text-emerald-600">{thisMonthCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Announcement Cards ── */}
      {announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      ) : (
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-muted-foreground">No announcements yet</p>
              <p className="text-xs text-muted-foreground">
                Announcements from the school will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs h-8"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs h-8"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ANNOUNCEMENT CARD
// ============================================================

function AnnouncementCard({ announcement }: { announcement: AnnouncementData }) {
  const [expanded, setExpanded] = useState(false);
  const typeBadge = getTypeBadge(announcement.type);
  const priorityBadge = getPriorityBadge(announcement.priority);

  const isLongContent = announcement.content.length > 200;
  const displayContent = expanded
    ? announcement.content
    : announcement.content.slice(0, 200);

  const publishedDate = announcement.publishedAt
    ? formatDate(announcement.publishedAt)
    : null;
  const createdDate = formatDate(announcement.createdAt);

  const hasAttachments = !!announcement.attachments;

  // Visual emphasis for urgent/concern
  const isUrgent = announcement.type === 'URGENT' || announcement.priority === 'CONCERN' || announcement.priority === 'HIGH';

  return (
    <Card className={`rounded-3xl transition-all ${isUrgent ? 'border-red-200 bg-red-50/20' : ''}`}>
      <CardContent className="p-5">
        <div className="space-y-3">
          {/* Title + Badges Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="text-sm font-semibold leading-snug">
                  {announcement.title}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <Badge className={`${typeBadge.class} text-[10px] border-0 font-medium`}>
                  {typeBadge.label}
                </Badge>
                <Badge className={`${priorityBadge.class} text-[10px] border-0 font-medium`}>
                  {priorityBadge.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p className="whitespace-pre-line" style={{
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
              overflow: expanded ? 'visible' : 'hidden',
            }}>
              {expanded ? announcement.content : displayContent}
            </p>
            {isLongContent && (
              <Button
                variant="link"
                size="sm"
                className="text-xs text-sky-600 hover:text-sky-700 p-0 h-auto mt-1 font-medium"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Show less' : 'Read more'}
              </Button>
            )}
          </div>

          {/* Footer: Date + Attachment */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{publishedDate || createdDate}</span>
              {!publishedDate && (
                <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-600 bg-amber-50 ml-1">
                  Draft
                </Badge>
              )}
            </div>
            {hasAttachments && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" />
                <span>Attachment</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MESSAGES TAB (Coming Soon)
// ============================================================

function MessagesTab() {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center shadow-lg">
          <MessageSquare className="h-10 w-10 text-white" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Messaging Feature Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Direct messaging between parents and teachers will be available here.
            Stay tuned for real-time conversations, group chats, and message notifications.
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-sky-200 text-sky-600 bg-sky-50">
          Under Development
        </Badge>
      </CardContent>
    </Card>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function CommunicationLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <Skeleton className="h-28 w-full rounded-3xl" />

      {/* Tab skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
