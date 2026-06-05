'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ── Types ──
interface ReadReceipt {
  userId: string;
  name: string;
  avatar: string | null;
  readAt?: string;
}

interface ReadReceiptStats {
  total: number;
  read: number;
  unread: number;
}

interface AnnouncementReadReceiptsProps {
  announcementId: string;
}

// ── Helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Component ──
export function AnnouncementReadReceipts({
  announcementId,
}: AnnouncementReadReceiptsProps) {
  const [readBy, setReadBy] = useState<ReadReceipt[]>([]);
  const [notReadBy, setNotReadBy] = useState<ReadReceipt[]>([]);
  const [stats, setStats] = useState<ReadReceiptStats>({ total: 0, read: 0, unread: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadReceipts();
  }, [announcementId]);

  const fetchReadReceipts = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/announcements/${announcementId}/read-receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch read receipts');

      const data = await res.json();
      setReadBy(data.readBy || []);
      setNotReadBy(data.notReadBy || []);
      setStats(data.stats || { total: 0, read: 0, unread: 0 });
    } catch (err) {
      console.error('Failed to fetch read receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const readPercent = stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">
              Read Rate
            </span>
            <span className="text-xs font-semibold text-portal-600">
              {readPercent}%
            </span>
          </div>
          <Progress value={readPercent} className="h-2" />
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">
          <Users className="h-3 w-3 mr-1" />
          {stats.total} total
        </Badge>
      </div>

      {/* Two Columns: Read / Not Read */}
      <div className="grid grid-cols-2 gap-4">
        {/* Read Column */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-green-700">
              Read ({readBy.length})
            </span>
          </div>
          <ScrollArea className="max-h-48">
            <div className="space-y-1.5">
              {readBy.length === 0 ? (
                <p className="text-[11px] text-gray-400 py-2">No reads yet</p>
              ) : (
                readBy.map((r) => (
                  <div
                    key={r.userId}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-green-50"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[8px] bg-green-100 text-green-700">
                        {getInitials(r.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-800 truncate">
                        {r.name}
                      </p>
                      {r.readAt && (
                        <p className="text-[9px] text-gray-400">
                          {format(new Date(r.readAt), 'dd MMM, h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Not Read Column */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-xs font-semibold text-red-600">
              Not Read ({notReadBy.length})
            </span>
          </div>
          <ScrollArea className="max-h-48">
            <div className="space-y-1.5">
              {notReadBy.length === 0 ? (
                <p className="text-[11px] text-gray-400 py-2">All caught up!</p>
              ) : (
                notReadBy.map((r) => (
                  <div
                    key={r.userId}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-red-50"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[8px] bg-red-100 text-red-700">
                        {getInitials(r.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-[11px] font-medium text-gray-800 truncate">
                      {r.name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
