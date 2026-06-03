'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Filter, Search, ExternalLink } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { AnimatedCard } from '@/components/ui/animated-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ── Types ──
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender?: { id: string; name: string } | null;
}

// ── Constants ──
const TYPE_STYLES: Record<string, { dot: string; bg: string; border: string }> = {
  INFO:         { dot: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-l-blue-500' },
  SUCCESS:      { dot: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
  WARNING:      { dot: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-l-amber-500' },
  ERROR:        { dot: 'bg-red-500', bg: 'bg-red-50', border: 'border-l-red-500' },
  ANNOUNCEMENT: { dot: 'bg-purple-500', bg: 'bg-purple-50', border: 'border-l-purple-500' },
  REMINDER:     { dot: 'bg-teal-500', bg: 'bg-teal-50', border: 'border-l-teal-500' },
  ALERT:        { dot: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-l-orange-500' },
};

const CATEGORY_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'FEE', label: 'Fees' },
  { value: 'ADMISSION', label: 'Admission' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'GROWTH', label: 'Growth' },
  { value: 'COMMUNICATION', label: 'Messages' },
  { value: 'CRM', label: 'CRM' },
  { value: 'SYSTEM', label: 'System' },
];

const CATEGORY_LABELS: Record<string, string> = {
  ATTENDANCE: 'Attendance',
  FEE: 'Fees',
  ADMISSION: 'Admission',
  ACTIVITY: 'Activity',
  GROWTH: 'Growth',
  COMMUNICATION: 'Messages',
  SYSTEM: 'System',
  CRM: 'CRM',
};

// ── Time ago helper ──
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: diffDay > 365 ? 'numeric' : undefined });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Portal-aware prefix ──
function getPortalPrefix(pathname: string): string {
  if (pathname.startsWith('/teacher')) return '/teacher';
  if (pathname.startsWith('/parent')) return '/parent';
  return '/admin';
}

/**
 * NotificationsPage — Full-page notifications view for all portals.
 * Used by admin/notifications, teacher/notifications, parent/notifications.
 */
export function NotificationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const portalPrefix = getPortalPrefix(pathname);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const LIMIT = 15;

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: LIMIT.toString(),
      });
      if (activeCategory !== 'ALL') params.set('category', activeCategory);
      if (showUnreadOnly) params.set('unread', 'true');

      const res = await fetch(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) =>
          append ? [...prev, ...data.notifications] : data.notifications
        );
        setUnreadCount(data.unreadCount);
        setTotal(data.pagination.total);
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [activeCategory, showUnreadOnly]);

  // ── Refetch on filter change ──
  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  // ── Search filter (client-side) ──
  const filteredNotifications = searchQuery
    ? notifications.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notifications;

  // ── Mark as read ──
  const markAsRead = async (notificationId: string, link?: string | null) => {
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (link) {
        router.push(link);
      }
    } catch {
      // Silent fail
    }
  };

  // ── Mark all as read ──
  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // Silent fail
    }
  };

  // ── Delete notification ──
  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setTotal((prev) => prev - 1);
      }
    } catch {
      // Silent fail
    }
  };

  // ── Load more ──
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  // ── Portal title ──
  const portalLabel = pathname.startsWith('/teacher')
    ? 'Teacher'
    : pathname.startsWith('/parent')
    ? 'Parent'
    : 'Admin';

  return (
    <PageTransition>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'You\'re all caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={markAllRead}
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* ── Search + Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={showUnreadOnly ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5 whitespace-nowrap"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            <Filter className="h-4 w-4" />
            {showUnreadOnly ? 'Unread Only' : 'All'}
          </Button>
        </div>

        {/* ── Category Tabs ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                activeCategory === tab.value
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              )}
            >
              {tab.label}
              {tab.value !== 'ALL' && (
                <span className="ml-1 text-[10px] opacity-60">
                  ({notifications.filter((n) => n.category === tab.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Notifications List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description={
              showUnreadOnly
                ? 'You have no unread notifications.'
                : activeCategory !== 'ALL'
                ? `No ${CATEGORY_LABELS[activeCategory] || activeCategory.toLowerCase()} notifications found.`
                : 'You don\'t have any notifications yet.'
            }
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, idx) => {
                const style = TYPE_STYLES[notification.type] || TYPE_STYLES.INFO;
                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                  >
                    <AnimatedCard hover>
                      <div
                        className={cn(
                          'p-4 rounded-xl border-l-4 cursor-pointer transition-colors',
                          style.border,
                          !notification.isRead ? style.bg : 'bg-white dark:bg-gray-900'
                        )}
                        onClick={() => markAsRead(notification.id, notification.link)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Unread indicator */}
                          <div className="mt-1.5">
                            {!notification.isRead ? (
                              <div className={cn('h-2.5 w-2.5 rounded-full', style.dot)} />
                            ) : (
                              <div className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className={cn(
                                  'text-sm',
                                  !notification.isRead
                                    ? 'font-semibold text-foreground'
                                    : 'font-medium text-muted-foreground'
                                )}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                {notification.link && (
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <button
                                  onClick={(e) => deleteNotification(notification.id, e)}
                                  className="p-1 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Meta row */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                {CATEGORY_LABELS[notification.category] || notification.category}
                              </span>
                              {notification.sender && (
                                <span className="text-[10px] text-muted-foreground">
                                  from {notification.sender.name}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground ml-auto" title={formatFullDate(notification.createdAt)}>
                                {timeAgo(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                >
                  Load More ({total - notifications.length} remaining)
                </Button>
              </div>
            )}

            {/* Summary */}
            <p className="text-center text-xs text-muted-foreground pt-2">
              Showing {filteredNotifications.length} of {total} notification{total !== 1 ? 's' : ''}
              {unreadCount > 0 && ` · ${unreadCount} unread`}
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
