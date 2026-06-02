'use client';

// ============================================================
// PreOne — Parent Communication Page
// Communication Hub with two tabs:
// 1. Announcements — paginated list with type/priority badges,
//    expand/collapse content, stats row, pagination
// 2. Chat with Teacher — real-time messaging with teachers,
//    two-panel desktop layout, mobile full-screen chat
// ============================================================

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  Suspense,
} from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Megaphone, Bell, AlertCircle, RefreshCw, ChevronDown,
  ChevronLeft, ChevronRight, Paperclip, MessageSquare,
  Calendar, AlertTriangle, Inbox, Clock,
  Send, Phone, ArrowLeft, MessageCircle,
} from 'lucide-react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useParentAuth } from '@/lib/parent-auth';
import { parentPost } from '@/lib/parent-api';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useParentAnnouncements,
  useParentChatThreads,
  useParentChatMessages,
  type AnnouncementData,
  type ChatThreadData,
  type ChatMessageData,
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

const QUICK_REPLIES = [
  'Thank you for the update!',
  'Can we schedule a meeting?',
  'Noted, will follow up.',
];

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

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function formatMessageTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
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

/** Get the parent's user ID from localStorage */
function getParentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('preone_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.id || null;
  } catch {
    return null;
  }
}

/** Get initials from a name */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================
// TAB TYPE
// ============================================================

type TabKey = 'announcements' | 'chat';

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
          variant={activeTab === 'chat' ? 'default' : 'outline'}
          size="sm"
          className={`rounded-xl text-xs ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 shadow-sm'
              : 'hover:bg-sky-50 hover:text-sky-700'
          }`}
          onClick={() => handleTabSwitch('chat')}
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
          Chat with Teacher
        </Button>
      </div>

      {/* ── Tab content ── */}
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
        <ChatTab />
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
// CHAT TAB — Full Implementation
// ============================================================

function ChatTab() {
  const { selectedChildId } = useParentAuth();
  const isMobile = useIsMobile();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Fetch threads
  const { data: threadsData, isLoading: threadsLoading } = useParentChatThreads(selectedChildId);
  const threads = threadsData?.threads ?? [];

  // On mobile, show either list or chat — not both
  const showChatOnMobile = isMobile && selectedThreadId !== null;

  return (
    <Card className="rounded-3xl overflow-hidden h-[calc(100vh-280px)] min-h-[480px]">
      <div className="flex h-full">
        {/* ── Left Panel: Thread List ── */}
        {(!isMobile || !showChatOnMobile) && (
          <div className="flex-shrink-0 w-full md:w-80 lg:w-[340px] border-r-0 md:border-r h-full">
            <ChatThreadList
              threads={threads}
              isLoading={threadsLoading}
              selectedThreadId={selectedThreadId}
              onSelectThread={(id) => setSelectedThreadId(id)}
            />
          </div>
        )}

        {/* ── Right Panel: Chat Window ── */}
        {(!isMobile || showChatOnMobile) && (
          <div className="flex-1 min-w-0 h-full">
            {selectedThreadId ? (
              <ChatWindow
                threadId={selectedThreadId}
                onBack={() => setSelectedThreadId(null)}
                isMobile={isMobile}
              />
            ) : (
              <ChatEmptyState />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================
// CHAT THREAD LIST
// ============================================================

function ChatThreadList({
  threads,
  isLoading,
  selectedThreadId,
  onSelectThread,
}: {
  threads: ChatThreadData[];
  isLoading: boolean;
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-sky-500" />
          Conversations
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {threads.length} {threads.length === 1 ? 'teacher' : 'teachers'}
        </p>
      </div>

      <Separator />

      {/* Thread List */}
      {isLoading ? (
        <div className="flex-1 p-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3">
          <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center">
            <MessageSquare className="h-7 w-7 text-sky-300" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground">
              Start chatting with your child&apos;s teacher!
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {threads.map((thread) => (
              <ChatThreadItem
                key={thread.id}
                thread={thread}
                isSelected={thread.id === selectedThreadId}
                onClick={() => onSelectThread(thread.id)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ============================================================
// CHAT THREAD ITEM
// ============================================================

function ChatThreadItem({
  thread,
  isSelected,
  onClick,
}: {
  thread: ChatThreadData;
  isSelected: boolean;
  onClick: () => void;
}) {
  const initials = getInitials(thread.teacher.name);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
        isSelected
          ? 'bg-sky-50 border border-sky-200'
          : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          {thread.teacher.photo ? (
            <AvatarImage src={thread.teacher.photo} alt={thread.teacher.name} />
          ) : null}
          <AvatarFallback className="bg-sky-100 text-sky-700 text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        {thread.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
            {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}>
            {thread.teacher.name}
          </p>
          {thread.lastMessage && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {formatTime(thread.lastMessage.createdAt)}
            </span>
          )}
        </div>
        {thread.teacher.className && (
          <p className="text-[11px] text-sky-600 truncate">{thread.teacher.className}</p>
        )}
        {thread.lastMessage && (
          <p className={`text-xs truncate mt-0.5 ${thread.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            {thread.lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
}

// ============================================================
// CHAT WINDOW
// ============================================================

function ChatWindow({
  threadId,
  onBack,
  isMobile,
}: {
  threadId: string;
  onBack: () => void;
  isMobile: boolean;
}) {
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch messages for the selected thread
  const { data: messagesData, isLoading: messagesLoading } = useParentChatMessages(threadId);

  const teacher = messagesData?.teacher ?? null;
  const messages = messagesData?.messages ?? [];

  // Get parent user ID to determine message alignment
  const parentUserId = getParentUserId();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send Message Mutation ──
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return parentPost(`/api/parent/chat/${threadId}/messages`, {
        content,
        type: 'TEXT',
      });
    },
    onSuccess: () => {
      // Invalidate messages query to refresh
      queryClient.invalidateQueries({
        queryKey: ['parent', 'chat', 'messages', threadId],
      });
      // Invalidate threads to update last message
      queryClient.invalidateQueries({
        queryKey: ['parent', 'chat', 'threads'],
      });
      setMessageInput('');
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = messageInput.trim();
    if (!trimmed) return;
    sendMessageMutation.mutate(trimmed);
  }, [messageInput, sendMessageMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleQuickReply = useCallback(
    (text: string) => {
      sendMessageMutation.mutate(text);
    },
    [sendMessageMutation],
  );

  return (
    <div className="flex flex-col h-full">
      {/* ── Chat Header ── */}
      <div className="flex items-center gap-3 p-4 border-b flex-shrink-0">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl -ml-1 mr-0.5"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {teacher ? (
          <>
            <Avatar className="h-9 w-9">
              {teacher.photo ? (
                <AvatarImage src={teacher.photo} alt={teacher.name} />
              ) : null}
              <AvatarFallback className="bg-sky-100 text-sky-700 text-xs font-medium">
                {getInitials(teacher.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{teacher.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {teacher.className || 'Teacher'}
              </p>
            </div>
            {teacher.phone && (
              <a
                href={`tel:${teacher.phone}`}
                className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                title={`Call ${teacher.phone}`}
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </>
        ) : (
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20 mt-1.5" />
          </div>
        )}
      </div>

      {/* ── Messages Area ── */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {messagesLoading ? (
            <div className="space-y-4 py-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                >
                  <Skeleton
                    className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-40'} rounded-2xl`}
                  />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center">
                <MessageCircle className="h-7 w-7 text-sky-300" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Start the conversation!
                </p>
                <p className="text-xs text-muted-foreground">
                  Say hello to the teacher.
                </p>
              </div>
              {/* Quick replies as starters */}
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {QUICK_REPLIES.map((text) => (
                  <Button
                    key={text}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs h-7 border-sky-200 text-sky-600 hover:bg-sky-50"
                    onClick={() => handleQuickReply(text)}
                    disabled={sendMessageMutation.isPending}
                  >
                    {text}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isParent = msg.senderId === parentUserId;
                return (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    isParent={isParent}
                  />
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* ── Quick Replies (when there are messages) ── */}
      {messages.length > 0 && (
        <div className="px-4 pt-2 pb-1 flex gap-1.5 overflow-x-auto flex-shrink-0">
          {QUICK_REPLIES.map((text) => (
            <Button
              key={text}
              variant="outline"
              size="sm"
              className="rounded-full text-[11px] h-6 px-2.5 border-sky-200 text-sky-600 hover:bg-sky-50 whitespace-nowrap flex-shrink-0"
              onClick={() => handleQuickReply(text)}
              disabled={sendMessageMutation.isPending}
            >
              {text}
            </Button>
          ))}
        </div>
      )}

      {/* ── Input Area ── */}
      <div className="p-3 border-t flex-shrink-0">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-xl h-10 text-sm border-gray-200 focus-visible:ring-sky-400"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white flex-shrink-0"
            onClick={handleSend}
            disabled={!messageInput.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CHAT MESSAGE BUBBLE
// ============================================================

function ChatMessageBubble({
  message,
  isParent,
}: {
  message: ChatMessageData;
  isParent: boolean;
}) {
  return (
    <div className={`flex ${isParent ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-3.5 py-2.5 ${
          isParent
            ? 'bg-sky-500 text-white rounded-br-md'
            : 'bg-gray-100 text-foreground rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-line break-words">
          {message.content}
        </p>
        <p
          className={`text-[10px] mt-1 ${
            isParent ? 'text-sky-100' : 'text-muted-foreground'
          }`}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// CHAT EMPTY STATE (no thread selected)
// ============================================================

function ChatEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
        <MessageCircle className="h-10 w-10 text-sky-400" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-base font-semibold text-foreground">Select a conversation</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Choose a teacher from the list to start or continue a conversation.
        </p>
      </div>
    </div>
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
