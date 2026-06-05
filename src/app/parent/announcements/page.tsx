'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Megaphone,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  Paperclip,
  Download,
  Inbox,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAnnouncementStore } from '@/lib/stores/announcement-store';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// ── Badge Configs ──
const TYPE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  GENERAL: { label: 'General', bg: 'bg-gray-100', color: 'text-gray-700' },
  EVENT: { label: 'Event', bg: 'bg-amber-100', color: 'text-amber-700' },
  HOLIDAY: { label: 'Holiday', bg: 'bg-purple-100', color: 'text-purple-700' },
  FEE_REMINDER: { label: 'Fee', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  EMERGENCY: { label: 'Emergency', bg: 'bg-red-100', color: 'text-red-700' },
  ACHIEVEMENT: { label: 'Achievement', bg: 'bg-emerald-100', color: 'text-emerald-700' },
  CONCERN: { label: 'Concern', bg: 'bg-orange-100', color: 'text-orange-700' },
};

const PRIORITY_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  LOW: { label: 'Low', bg: 'bg-green-100', color: 'text-green-700' },
  NORMAL: { label: 'Normal', bg: 'bg-sky-100', color: 'text-sky-700' },
  HIGH: { label: 'High', bg: 'bg-amber-100', color: 'text-amber-700' },
  CONCERN: { label: 'Concern', bg: 'bg-red-100', color: 'text-red-700' },
};

// ── Main Page ──
export default function ParentAnnouncementsPage() {
  const {
    announcements,
    isLoading,
    fetchAnnouncements,
    markAsRead,
  } = useAnnouncementStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Fetch published announcements ──
  const loadData = useCallback(async () => {
    await fetchAnnouncements({ status: 'PUBLISHED' });
  }, [fetchAnnouncements]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Computed ──
  const displayAnnouncements = useMemo(() => {
    if (!searchQuery) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    );
  }, [announcements, searchQuery]);

  // ── Handle click: mark as read + expand ──
  const handleClick = async (id: string) => {
    const announcement = announcements.find((a) => a.id === id);
    if (announcement && !announcement.isRead) {
      await markAsRead(id);
    }
    setExpandedId(expandedId === id ? null : id);
  };

  // ── Parse attachments ──
  const parseAttachments = (attachments: string | null | undefined): string[] => {
    if (!attachments) return [];
    try {
      return JSON.parse(attachments);
    } catch {
      return attachments.split(',').filter(Boolean);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-portal-600" />
            Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with school announcements
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="gap-1 rounded-xl"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full rounded-xl"
        />
      </div>

      {/* Unread indicator */}
      {announcements.filter((a) => !a.isRead).length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-portal-50 rounded-xl border border-portal-200">
          <div className="h-2 w-2 rounded-full bg-portal-500 animate-pulse" />
          <span className="text-xs font-medium text-portal-700">
            {announcements.filter((a) => !a.isRead).length} unread announcement
            {announcements.filter((a) => !a.isRead).length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Announcement List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : displayAnnouncements.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Inbox className="h-12 w-12 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">
              No announcements yet
            </p>
            <p className="text-xs text-gray-400">
              Announcements from the school will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayAnnouncements.map((announcement) => {
            const typeBadge = TYPE_BADGES[announcement.type] || TYPE_BADGES.GENERAL;
            const priorityBadge = PRIORITY_BADGES[announcement.priority] || PRIORITY_BADGES.NORMAL;
            const isExpanded = expandedId === announcement.id;
            const isUrgent =
              announcement.priority === 'HIGH' ||
              announcement.priority === 'CONCERN' ||
              announcement.type === 'EMERGENCY';
            const attachments = parseAttachments(announcement.attachments);

            return (
              <Card
                key={announcement.id}
                className={cn(
                  'rounded-2xl transition-all hover:shadow-md cursor-pointer',
                  !announcement.isRead && 'ring-2 ring-portal-300',
                  isUrgent && !announcement.isRead && 'ring-red-300'
                )}
                onClick={() => handleClick(announcement.id)}
              >
                <CardContent className="p-4">
                  {/* Unread dot + Title */}
                  <div className="flex items-start gap-3">
                    {!announcement.isRead && (
                      <div className="h-2.5 w-2.5 rounded-full bg-portal-500 shrink-0 mt-1.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          'text-sm font-semibold leading-snug',
                          !announcement.isRead ? 'text-gray-900' : 'text-gray-700'
                        )}
                      >
                        {announcement.title}
                      </h3>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge
                          className={cn(
                            'text-[10px] border-0 font-medium',
                            typeBadge.bg,
                            typeBadge.color
                          )}
                        >
                          {typeBadge.label}
                        </Badge>
                        {(announcement.priority === 'HIGH' ||
                          announcement.priority === 'CONCERN') && (
                          <Badge
                            className={cn(
                              'text-[10px] border-0 font-medium',
                              priorityBadge.bg,
                              priorityBadge.color
                            )}
                          >
                            {priorityBadge.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cover Image */}
                  {announcement.coverImage && (
                    <div className="mt-3 rounded-xl overflow-hidden">
                      <img
                        src={announcement.coverImage}
                        alt={announcement.title}
                        className="w-full h-36 object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                    <p className="whitespace-pre-line">
                      {isExpanded
                        ? announcement.content
                        : announcement.content.length > 200
                          ? announcement.content.slice(0, 200) + '...'
                          : announcement.content}
                    </p>
                    {announcement.content.length > 200 && !isExpanded && (
                      <span className="text-xs text-portal-600 font-medium">
                        {' '}Read more
                      </span>
                    )}
                  </div>

                  {/* Attachments */}
                  {attachments.length > 0 && isExpanded && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-portal-600 hover:text-portal-700 bg-portal-50 px-2 py-1 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Paperclip className="h-3 w-3" />
                          <Download className="h-3 w-3" />
                          Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {announcement.publishedAt
                        ? formatDistanceToNow(new Date(announcement.publishedAt), {
                            addSuffix: true,
                          })
                        : formatDistanceToNow(new Date(announcement.createdAt), {
                            addSuffix: true,
                          })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
