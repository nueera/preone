'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Plus,
  ArrowLeft,
  Phone,
  RefreshCw,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/lib/stores/chat-store';
import { toast } from 'sonner';

// ── Helpers ──
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── ChatLayout Component ──
export function ChatLayout() {
  const {
    threads,
    activeThread,
    messages,
    isConnected,
    totalUnread,
    connect,
    disconnect,
    loadThreads,
    loadMessages,
    sendMessage,
    setActiveThread,
    markAsRead,
  } = useChatStore();

  // Get current user ID from token for message alignment
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId || payload.id);
      } catch {
        // ignore
      }
    }
  }, []);

  const [chatSearch, setChatSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Connect on mount ──
  useEffect(() => {
    const token = getToken();
    if (token) {
      connect(token);
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // ── Load threads ──
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Filtered threads ──
  const filteredThreads = useMemo(() => {
    if (!chatSearch) return threads;
    const q = chatSearch.toLowerCase();
    return threads.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.participants?.some(
          (p) =>
            p.user?.name?.toLowerCase().includes(q)
        )
    );
  }, [threads, chatSearch]);

  // ── Current messages ──
  const currentMessages = activeThread
    ? messages[activeThread.id] || []
    : [];

  // ── Handle select thread ──
  const handleSelectThread = useCallback(
    (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (thread) {
        setActiveThread(thread);
        setMobileShowChat(true);
      }
    },
    [threads, setActiveThread]
  );

  // ── Handle send ──
  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !activeThread) return;
    try {
      setSending(true);
      sendMessage({
        threadId: activeThread.id,
        content: newMessage.trim(),
        type: 'TEXT',
      });
      setNewMessage('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }, [newMessage, activeThread, sendMessage]);

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {/* ── Left Panel: Thread List ── */}
      <div
        className={cn(
          'flex flex-col w-full lg:w-80 shrink-0 bg-white rounded-2xl shadow-sm border overflow-hidden',
          mobileShowChat ? 'hidden lg:flex' : 'flex'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-portal-500" />
              Messages
            </h2>
            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <Badge className="bg-portal-500 text-white text-[10px] px-1.5">
                  {totalUnread}
                </Badge>
              )}
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-gray-300'
                )}
                title={isConnected ? 'Connected' : 'Disconnected'}
              />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className="pl-8 h-8 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Thread List */}
        <ScrollArea className="flex-1">
          {threads.length === 0 && !chatSearch ? (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <MessageSquare className="h-10 w-10 text-gray-200" />
              <p className="text-xs text-gray-500 text-center">
                No conversations yet
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filteredThreads.map((thread) => {
                const isSelected = activeThread?.id === thread.id;
                const lastParticipant = thread.participants?.[0];
                const displayName =
                  thread.name || lastParticipant?.user?.name || 'Unknown';

                return (
                  <button
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl transition-all',
                      isSelected
                        ? 'bg-portal-50 border border-portal-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-portal-100 text-portal-700 text-xs font-semibold">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-xs truncate',
                              thread.unreadCount > 0
                                ? 'font-semibold text-gray-900'
                                : 'font-medium text-gray-700'
                            )}
                          >
                            {displayName}
                          </span>
                          {thread.lastMessageAt && (
                            <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                              {formatTime(thread.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        {thread.lastMessagePreview && (
                          <p
                            className={cn(
                              'text-[10px] truncate mt-0.5',
                              thread.unreadCount > 0
                                ? 'text-gray-700 font-medium'
                                : 'text-gray-500'
                            )}
                          >
                            {thread.lastMessagePreview}
                          </p>
                        )}
                      </div>
                      {thread.unreadCount > 0 && (
                        <Badge className="bg-portal-500 text-white text-[9px] min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Right Panel: Chat Window ── */}
      <div
        className={cn(
          'flex flex-col flex-1 bg-white rounded-2xl shadow-sm overflow-hidden',
          mobileShowChat ? 'flex' : 'hidden lg:flex'
        )}
      >
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 lg:hidden rounded-lg text-gray-500"
                onClick={() => {
                  setMobileShowChat(false);
                  setActiveThread(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-portal-100 text-portal-700 text-xs font-semibold">
                  {getInitials(activeThread.name || 'Chat')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {activeThread.name || 'Conversation'}
                </div>
                <div className="text-[10px] text-gray-500">
                  {activeThread.participants?.length || 0} participants
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {currentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageSquare className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-xs text-gray-500">
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex',
                          isOwn ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[75%] px-3.5 py-2',
                            isOwn
                              ? 'bg-portal-600 text-white rounded-2xl rounded-br-md'
                              : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md'
                          )}
                        >
                          {!isOwn && (
                            <p className="text-[10px] font-semibold text-portal-600 mb-0.5">
                              {msg.sender?.name || 'Unknown'}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed break-words">
                            {msg.isDeleted ? 'This message was deleted' : msg.content}
                          </p>
                          <div
                            className={cn(
                              'flex items-center justify-end gap-1 mt-1',
                              isOwn ? 'text-portal-200' : 'text-gray-400'
                            )}
                          >
                            <span className="text-[9px]">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex items-end gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl h-10 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sending}
                />
                <Button
                  className="bg-portal-600 hover:bg-portal-700 rounded-xl h-10 w-10 p-0 shrink-0"
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 rounded-full bg-portal-50 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-portal-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Select a Conversation
            </h3>
            <p className="text-xs text-gray-500">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
