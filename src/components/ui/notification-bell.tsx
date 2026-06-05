'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotificationCount } from '@/hooks/use-notifications';

// ── Notification type from API ──
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; name: string } | null;
}

// ── Type-based styles ──
const TYPE_STYLES: Record<string, { dot: string; bg: string; icon: string }> = {
  INFO:         { dot: 'bg-blue-500', bg: 'bg-blue-50/50', icon: 'ℹ️' },
  SUCCESS:      { dot: 'bg-emerald-500', bg: 'bg-emerald-50/50', icon: '✅' },
  WARNING:      { dot: 'bg-amber-500', bg: 'bg-amber-50/50', icon: '⚠️' },
  ERROR:        { dot: 'bg-red-500', bg: 'bg-red-50/50', icon: '❌' },
  ANNOUNCEMENT: { dot: 'bg-purple-500', bg: 'bg-purple-50/50', icon: '📢' },
  REMINDER:     { dot: 'bg-teal-500', bg: 'bg-teal-50/50', icon: '🔔' },
  ALERT:        { dot: 'bg-orange-500', bg: 'bg-orange-50/50', icon: '🚨' },
};

// ── Category labels ──
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
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Detect portal from pathname ──
function getPortalPrefix(pathname: string): string {
  if (pathname.startsWith('/teacher')) return '/teacher';
  if (pathname.startsWith('/parent')) return '/parent';
  return '/admin';
}

/**
 * NotificationBell — Global notification bell component.
 * Goes in every portal header. Polls every 30s for unread count.
 * Shows dropdown with recent notifications on click.
 */
export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount, refetch } = useNotificationCount();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalPrefix = getPortalPrefix(pathname);

  // ── Fetch recent notifications when dropdown opens ──
  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('preone_token');
        if (!token) return;

        const res = await fetch('/api/notifications?limit=8', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  // ── Close on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

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

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      refetch();

      // Navigate to link if provided
      if (link) {
        setIsOpen(false);
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

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refetch();
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-xl border bg-white shadow-xl dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm font-medium">No notifications</p>
                    <p className="text-xs">You're all caught up!</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => {
                      const style = TYPE_STYLES[notification.type] || TYPE_STYLES.INFO;
                      return (
                        <motion.div
                          key={notification.id}
                          className={cn(
                            'px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0 dark:hover:bg-gray-800/50 dark:border-gray-800',
                            !notification.isRead && style.bg
                          )}
                          onClick={() => markAsRead(notification.id, notification.link)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Unread dot */}
                            <div className="mt-1.5">
                              {!notification.isRead && (
                                <div className={cn('h-2 w-2 rounded-full', style.dot)} />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  'text-sm truncate',
                                  !notification.isRead
                                    ? 'font-semibold text-foreground'
                                    : 'font-medium text-muted-foreground'
                                )}>
                                  {notification.title}
                                </p>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-auto">
                                  {timeAgo(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  {CATEGORY_LABELS[notification.category] || notification.category}
                                </span>
                                {notification.link && (
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t px-4 py-2.5 dark:border-gray-800">
                <Link
                  href={`${portalPrefix}/notifications`}
                  className="text-xs font-medium text-purple-600 hover:text-purple-800 hover:underline text-center block"
                  onClick={() => setIsOpen(false)}
                >
                  View All Notifications →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
