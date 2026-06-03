'use client';

import { useEffect, useState, useCallback } from 'react';

interface NotificationCount {
  unreadCount: number;
  loading: boolean;
  refetch: () => void;
}

const POLL_INTERVAL = 30000; // 30 seconds

/**
 * Hook for polling unread notification count.
 * Used by NotificationBell to show badge + auto-refresh.
 */
export function useNotificationCount(): NotificationCount {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('preone_token') : null;
      if (!token) return;

      const res = await fetch('/api/notifications/count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Silent fail — polling should never crash the UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { unreadCount, loading, refetch: fetchCount };
}
