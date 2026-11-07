'use client';

import { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatNewThreadDialog } from './chat-new-thread-dialog';
import {
  Search,
  Plus,
  Pin,
  Volume2,
  VolumeX,
  Users,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export function ChatThreadList() {
  const threads = useChatStore((s) => s.threads);
  const activeThread = useChatStore((s) => s.activeThread);
  const setActiveThread = useChatStore((s) => s.setActiveThread);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const loadThreads = useChatStore((s) => s.loadThreads);
  const totalUnread = useChatStore((s) => s.totalUnread);

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const filteredThreads = useMemo(() => {
    let result = [...threads];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.participants?.some((p) =>
            p.user?.name?.toLowerCase().includes(q)
          ) ||
          t.lastMessagePreview?.toLowerCase().includes(q)
      );
    }

    // Sort: pinned first, then by lastMessageAt
    result.sort((a, b) => {
      const aPinned = a.participants?.some((p) => p.isPinned) ? 1 : 0;
      const bPinned = b.participants?.some((p) => p.isPinned) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      const aDate = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bDate = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bDate - aDate;
    });

    return result;
  }, [threads, searchQuery]);

  const isOnline = (userId: string) =>
    onlineUsers.some((u) => u.userId === userId);

  const getThreadDisplayName = (thread: (typeof threads)[0]) => {
    if (thread.name) return thread.name;
    if (thread.type === 'DIRECT') {
      const other = thread.participants?.find(
        (p) => p.userId !== 'current'
      );
      return other?.user?.name || 'Direct Message';
    }
    return 'Group Chat';
  };

  const getThreadAvatar = (thread: (typeof threads)[0]) => {
    if (thread.type === 'DIRECT') {
      const other = thread.participants?.[0];
      return other?.user?.avatar || null;
    }
    return null;
  };

  const getThreadInitials = (thread: (typeof threads)[0]) => {
    const name = getThreadDisplayName(thread);
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-default)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Messages
            </h2>
            {totalUnread > 0 && (
              <Badge className="bg-[var(--preone-primary)] text-white text-xs px-2 py-0.5 rounded-full">
                {totalUnread > 99 ? '99+' : totalUnread}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-[var(--preone-primary-50)]"
            onClick={() => setShowNewThread(true)}
          >
            <Plus className="h-4 w-4 text-[var(--text-secondary)]" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-xl bg-[var(--bg-secondary)] border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredThreads.length === 0 ? (
            <EmptyThreadList searchQuery={searchQuery} />
          ) : (
            filteredThreads.map((thread, idx) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isActive={activeThread?.id === thread.id}
                isOnline={isOnline}
                displayName={getThreadDisplayName(thread)}
                avatar={getThreadAvatar(thread)}
                initials={getThreadInitials(thread)}
                onClick={() => setActiveThread(thread)}
                index={idx}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* New Thread Dialog */}
      <ChatNewThreadDialog
        open={showNewThread}
        onOpenChange={setShowNewThread}
      />
    </div>
  );
}

// ─── Thread Item ────────────────────────────────────────

interface ThreadItemProps {
  thread: ReturnType<typeof useChatStore.getState>['threads'][0];
  isActive: boolean;
  isOnline: (userId: string) => boolean;
  displayName: string;
  avatar: string | null;
  initials: string;
  onClick: () => void;
  index: number;
}

function ThreadItem({
  thread,
  isActive,
  isOnline,
  displayName,
  avatar,
  initials,
  onClick,
  index,
}: ThreadItemProps) {
  const isPinned = thread.participants?.some((p) => p.isPinned);
  const isMuted = thread.participants?.some((p) => p.isMuted);
  const firstParticipant = thread.participants?.[0];
  const onlineStatus = firstParticipant
    ? isOnline(firstParticipant.userId)
    : false;

  const lastMessageTime = thread.lastMessageAt
    ? formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: false })
    : '';

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left group',
        isActive
          ? 'bg-gradient-to-r from-[var(--preone-primary)]/10 to-[var(--preone-blue)]/10 border border-[var(--preone-primary)]/20'
          : 'hover:bg-[var(--bg-secondary)] border border-transparent'
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11 rounded-xl">
          {avatar && <AvatarImage src={avatar} alt={displayName} />}
          <AvatarFallback
            className={cn(
              'rounded-xl text-sm font-semibold',
              thread.type === 'DIRECT'
                ? 'bg-gradient-to-br from-[var(--preone-primary)] to-[var(--preone-blue)] text-white'
                : 'bg-gradient-to-br from-[var(--preone-orange)] to-[var(--preone-pink)] text-white'
            )}
          >
            {thread.type === 'CLASS_GROUP' ? (
              <Users className="h-4 w-4" />
            ) : (
              initials
            )}
          </AvatarFallback>
        </Avatar>
        {/* Online indicator */}
        {onlineStatus && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--preone-green)] border-2 border-[var(--bg-primary)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {isPinned && (
              <Pin className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
            )}
            <span
              className={cn(
                'text-sm truncate',
                isActive
                  ? 'font-semibold text-[var(--text-primary)]'
                  : 'font-medium text-[var(--text-primary)]',
                thread.unreadCount > 0 && 'font-semibold'
              )}
            >
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isMuted && (
              <VolumeX className="h-3 w-3 text-[var(--text-muted)]" />
            )}
            <span className="text-[11px] text-[var(--text-muted)]">
              {lastMessageTime}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-[var(--text-muted)] truncate pr-2">
            {thread.lastMessagePreview || 'No messages yet'}
          </p>
          {thread.unreadCount > 0 && (
            <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--preone-primary)] text-white text-[11px] font-semibold flex items-center justify-center">
              {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Empty State ────────────────────────────────────────

function EmptyThreadList({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mb-3">
        <MessageCircle className="w-8 h-8 text-[var(--text-muted)]" />
      </div>
      <p className="text-sm text-[var(--text-muted)] text-center">
        {searchQuery
          ? `No conversations matching "${searchQuery}"`
          : 'No conversations yet'}
      </p>
      {!searchQuery && (
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Start a new chat to get going
        </p>
      )}
    </div>
  );
}
