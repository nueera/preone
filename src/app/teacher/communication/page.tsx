'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Megaphone,
  Search,
  Phone,
  Send,
  Paperclip,
  ArrowLeft,
  Plus,
  AlertTriangle,
  Clock,
  Check,
  CheckCheck,
  Smile,
  X,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PORTAL_THEMES, COMMUNICATION_COLORS } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.teacher;

// ── Types ──
interface Announcement {
  id: string;
  title: string;
  type: string;
  priority: string;
  content: string;
  attachments: string | null;
  publishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface ChatThread {
  id: string;
  type: string;
  title: string | null;
  participant: {
    userId: string;
    name: string;
    role: string;
    childName: string | null;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    type: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: string;
  mediaUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ParentOption {
  userId: string;
  name: string;
  childName: string;
  phone: string;
  relation: string;
}

// ── Config ──
const ANNOUNCEMENT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  General:  { label: 'General',  color: 'text-gray-700',    bg: COMMUNICATION_COLORS.ANNOUNCEMENT?.bg || 'bg-gray-100',    emoji: '📋' },
  Urgent:   { label: 'Urgent',   color: COMMUNICATION_COLORS.ALERT?.text || 'text-red-700',     bg: COMMUNICATION_COLORS.ALERT?.bg || 'bg-red-100',     emoji: '🚨' },
  Academic: { label: 'Academic', color: COMMUNICATION_COLORS.MESSAGE?.text || 'text-blue-700',    bg: COMMUNICATION_COLORS.MESSAGE?.bg || 'bg-blue-100',    emoji: '📚' },
  Event:    { label: 'Event',    color: COMMUNICATION_COLORS.EVENT?.text || 'text-purple-700',  bg: COMMUNICATION_COLORS.EVENT?.bg || 'bg-purple-100',  emoji: '🎉' },
  Holiday:  { label: 'Holiday',  color: 'text-green-700',   bg: 'bg-green-100',   emoji: '🏖️' },
  Fee:      { label: 'Fee',      color: 'text-yellow-700',  bg: 'bg-yellow-100',  emoji: '💰' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  LOW:     { label: 'Low',      color: 'text-gray-600',   bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  NORMAL:  { label: 'Normal',   color: 'text-blue-700',   bg: 'bg-blue-100',   dot: 'bg-blue-500' },
  HIGH:    { label: 'High',     color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },
  CONCERN: { label: 'Concern',  color: 'text-red-700',    bg: 'bg-red-100',    dot: 'bg-red-500' },
};

const QUICK_REPLIES = [
  "Good morning! Your child is doing well today.",
  "Just wanted to share a positive observation about your child.",
  "Could we schedule a meeting to discuss your child's progress?",
  "Thank you for your cooperation.",
];

// ── Helpers ──
function getInitials(name: string): string {
  return name.split(' ').map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
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
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * CommunicationContent — Inner component
 */
function CommunicationContent() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── State ──
  const [activeTab, setActiveTab] = useState('announcements');

  // Announcements state
  const [annLoading, setAnnLoading] = useState(true);
  const [annError, setAnnError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annFilterType, setAnnFilterType] = useState('all');
  const [annFilterPriority, setAnnFilterPriority] = useState('all');

  // Chat state
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread'>('all');

  // New chat dialog
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);

  // Mobile responsive: track if showing chat on mobile
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // ── Current user ID (for message alignment) ──
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ── Fetch announcements ──
  const fetchAnnouncements = useCallback(async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) { router.push('/login'); return; }

    try {
      setAnnLoading(true);
      setAnnError(null);

      const params = new URLSearchParams();
      if (annFilterType !== 'all') params.set('type', annFilterType);
      if (annFilterPriority !== 'all') params.set('priority', annFilterPriority);

      const res = await fetch(`/api/teacher/announcements?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load announcements');
      const json = await res.json();
      setAnnouncements(json.announcements || []);
    } catch (err: any) {
      setAnnError(err.message || 'Something went wrong');
    } finally {
      setAnnLoading(false);
    }
  }, [router, annFilterType, annFilterPriority]);

  // ── Fetch chat threads ──
  const fetchThreads = useCallback(async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setChatLoading(true);
      setChatError(null);

      const res = await fetch('/api/teacher/chat/threads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load threads');
      const json = await res.json();
      setThreads(json.threads || []);
    } catch (err: any) {
      setChatError(err.message || 'Something went wrong');
    } finally {
      setChatLoading(false);
    }
  }, []);

  // ── Fetch messages for a thread ──
  const fetchMessages = useCallback(async (threadId: string) => {
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setMessagesLoading(true);
      const res = await fetch(`/api/teacher/chat/${threadId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load messages');
      const json = await res.json();
      setMessages(json.messages || []);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // ── Send message ──
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThreadId) return;
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setSending(true);
      const res = await fetch(`/api/teacher/chat/${selectedThreadId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: 'TEXT',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send');
      }

      setNewMessage('');
      await fetchMessages(selectedThreadId);
      await fetchThreads(); // Update last message in thread list
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ── Create new thread ──
  const handleCreateThread = async () => {
    if (!selectedParentId) {
      toast.error('Please select a parent');
      return;
    }
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setCreatingThread(true);
      const res = await fetch('/api/teacher/chat/threads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: selectedParentId,
          type: 'PARENT_TEACHER',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create thread');
      }

      const json = await res.json();
      toast.success('Chat thread created');
      setShowNewChatDialog(false);
      setSelectedParentId('');
      await fetchThreads();

      // Auto-select the new/existing thread
      if (json.thread?.id) {
        setSelectedThreadId(json.thread.id);
        fetchMessages(json.thread.id);
        setMobileShowChat(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create thread');
    } finally {
      setCreatingThread(false);
    }
  };

  // ── Fetch parent options for new chat ──
  const fetchParentOptions = useCallback(async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      const res = await fetch('/api/teacher/class', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();

      const parents: ParentOption[] = [];
      for (const student of json.students || []) {
        for (const sp of student.parents || []) {
          if (sp.parent?.id) {
            parents.push({
              userId: sp.parent.userId || sp.parent.id,
              name: `${sp.parent.firstName} ${sp.parent.lastName}`,
              childName: `${student.firstName} ${student.lastName}`,
              phone: sp.parent.phone || '',
              relation: sp.parent.relation || 'Parent',
            });
          }
        }
      }
      setParentOptions(parents);
    } catch {
      // silently fail
    }
  }, []);

  // ── Effects ──
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    if (activeTab === 'chat' && threads.length === 0 && !chatLoading) {
      fetchThreads();
    }
  }, [activeTab, threads.length, chatLoading, fetchThreads]);

  useEffect(() => {
    // Get current user ID from token
    const token = localStorage.getItem('preone_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Computed: filtered threads ──
  const filteredThreads = useMemo(() => {
    let result = threads;
    if (chatFilter === 'unread') {
      result = result.filter((t) => t.unreadCount > 0);
    }
    if (chatSearch) {
      const q = chatSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.participant?.name?.toLowerCase().includes(q) ||
          t.participant?.childName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [threads, chatFilter, chatSearch]);

  // ── Computed: selected thread ──
  const selectedThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || null;
  }, [threads, selectedThreadId]);

  // ── Loading state ──
  if (annLoading && activeTab === 'announcements' && announcements.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56 rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-portal-500" />
              Communication
            </h1>
          </div>
        </CardContent>
      </Card>

      {/* ── Main Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 rounded-xl">
          <TabsTrigger value="announcements" className="rounded-lg text-xs">
            <Megaphone className="h-3.5 w-3.5 mr-1" /> Announcements
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-lg text-xs">
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat with Parents
          </TabsTrigger>
        </TabsList>

        {/* ────────────────────────────────────────────────────────────
            ANNOUNCEMENTS TAB
        ──────────────────────────────────────────────────────────── */}
        <TabsContent value="announcements" className="space-y-4 mt-4">
          {/* Filters */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={annFilterType} onValueChange={setAnnFilterType}>
                  <SelectTrigger className="w-[130px] h-8 text-xs rounded-xl">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(ANNOUNCEMENT_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.emoji} {cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={annFilterPriority} onValueChange={setAnnFilterPriority}>
                  <SelectTrigger className="w-[130px] h-8 text-xs rounded-xl">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Announcements List */}
          {annError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</h3>
              <p className="text-gray-500 mb-4">{annError}</p>
              <Button onClick={fetchAnnouncements} className="bg-portal-600 hover:bg-portal-700 rounded-xl">Retry</Button>
            </div>
          ) : announcements.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-16 text-center">
                <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Announcements</h3>
                <p className="text-sm text-gray-500">There are no announcements for you at this time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => {
                const typeConfig = ANNOUNCEMENT_TYPE_CONFIG[ann.type] || ANNOUNCEMENT_TYPE_CONFIG.General;
                const priConfig = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.NORMAL;

                return (
                  <Card key={ann.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${typeConfig.bg} flex items-center justify-center text-lg shrink-0`}>
                          {typeConfig.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-sm font-semibold text-gray-900">{ann.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${typeConfig.bg} ${typeConfig.color} border-0 text-[10px] px-2 py-0.5`}>
                              {typeConfig.label}
                            </Badge>
                            <Badge className={`${priConfig.bg} ${priConfig.color} border-0 text-[10px] px-2 py-0.5 flex items-center gap-1`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${priConfig.dot}`} />
                              {priConfig.label}
                            </Badge>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {ann.publishedAt ? formatFullDate(ann.publishedAt) : 'Draft'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
                            {ann.content}
                          </p>
                          {ann.attachments && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                              <Paperclip className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{ann.attachments}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            CHAT WITH PARENTS TAB
        ──────────────────────────────────────────────────────────── */}
        <TabsContent value="chat" className="mt-4">
          <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
            {/* ── Left Panel: Chat List ── */}
            <div className={`${
              mobileShowChat ? 'hidden lg:flex' : 'flex'
            } flex-col w-full lg:w-80 shrink-0 bg-white rounded-2xl shadow-md border-0 overflow-hidden`}>
              {/* Search & Filter */}
              <div className="p-3 border-b border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      placeholder="Search parent..."
                      className="pl-8 h-8 text-xs rounded-xl"
                    />
                  </div>
                  <Button
                    className="bg-portal-600 hover:bg-portal-700 rounded-xl h-8 w-8 p-0 shrink-0"
                    onClick={() => {
                      fetchParentOptions();
                      setShowNewChatDialog(true);
                    }}
                    title="New Chat"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                      chatFilter === 'all'
                        ? `${theme.selectedClass}`
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                    onClick={() => setChatFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                      chatFilter === 'unread'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                    onClick={() => setChatFilter('unread')}
                  >
                    Unread
                  </button>
                </div>
              </div>

              {/* Thread List */}
              <div className="flex-1 overflow-y-auto">
                {chatLoading ? (
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                  </div>
                ) : chatError ? (
                  <div className="p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">{chatError}</p>
                    <Button variant="ghost" size="sm" className="text-xs mt-2" onClick={fetchThreads}>Retry</Button>
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">No Conversations</h3>
                    <p className="text-[10px] text-gray-500 mb-3">
                      Start a chat with a parent from your class!
                    </p>
                    <Button
                      size="sm"
                      className="bg-portal-600 hover:bg-portal-700 rounded-xl text-[10px]"
                      onClick={() => {
                        fetchParentOptions();
                        setShowNewChatDialog(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> New Chat
                    </Button>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <button
                      key={thread.id}
                      className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        selectedThreadId === thread.id ? theme.selectedClass : ''
                      } ${thread.unreadCount > 0 ? 'bg-blue-50/50' : ''}`}
                      onClick={() => {
                        setSelectedThreadId(thread.id);
                        fetchMessages(thread.id);
                        setMobileShowChat(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className={`${theme.avatarFallbackClass} text-xs font-semibold`}>
                            {thread.participant ? getInitials(thread.participant.name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-900 truncate">
                              {thread.participant?.name || 'Unknown'}
                            </span>
                            {thread.lastMessage && (
                              <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                {formatTime(thread.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          {thread.participant?.childName && (
                            <p className="text-[10px] text-gray-500 truncate">
                              {thread.participant.childName}&apos;s {thread.participant.role === 'PARENT' ? 'Parent' : thread.participant.role}
                            </p>
                          )}
                          {thread.lastMessage && (
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">
                              {thread.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {thread.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white border-0 text-[9px] min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ── Right Panel: Chat Window ── */}
            <div className={`${
              mobileShowChat ? 'flex' : 'hidden lg:flex'
            } flex-col flex-1 bg-white rounded-2xl shadow-md overflow-hidden`}>
              {selectedThread ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 border-b border-gray-100 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 lg:hidden rounded-lg text-gray-500"
                      onClick={() => {
                        setMobileShowChat(false);
                        setSelectedThreadId(null);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={`${theme.avatarFallbackClass} text-xs font-semibold`}>
                        {selectedThread.participant ? getInitials(selectedThread.participant.name) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedThread.participant?.name || 'Unknown'}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {selectedThread.participant?.childName
                          ? `Child: ${selectedThread.participant.childName}`
                          : selectedThread.participant?.role || ''}
                      </div>
                    </div>
                    {selectedThread.participant && (
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${(selectedThread.participant as any).phone || ''}`}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-portal-600 transition-colors"
                          title="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messagesLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-10 rounded-xl max-w-[70%]" />
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-xs text-gray-500">Start the conversation! Say hello to the parent.</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.senderId === currentUserId;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[75%] ${
                              isOwn
                                ? 'bg-portal-600 text-white rounded-2xl rounded-br-md'
                                : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md'
                            } px-3.5 py-2`}>
                              <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${
                                isOwn ? 'text-emerald-200' : 'text-gray-400'
                              }`}>
                                <span className="text-[9px]">{formatMessageTime(msg.createdAt)}</span>
                                {isOwn && (
                                  msg.isRead
                                    ? <CheckCheck className="h-3 w-3" />
                                    : <Check className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Replies */}
                  <div className="px-3 py-1.5 border-t border-gray-50">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {QUICK_REPLIES.map((reply, i) => (
                        <button
                          key={i}
                          className="text-[10px] px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full hover:bg-portal-50 hover:text-portal-700 whitespace-nowrap transition-colors shrink-0"
                          onClick={() => setNewMessage(reply)}
                        >
                          {reply.length > 35 ? reply.substring(0, 35) + '...' : reply}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t border-gray-100">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="min-h-[40px] max-h-[120px] rounded-xl text-sm resize-none pr-10"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                      </div>
                      <Button
                        className="bg-portal-600 hover:bg-portal-700 rounded-xl h-10 w-10 p-0 shrink-0"
                        onClick={handleSendMessage}
                        disabled={sending || !newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare className="h-16 w-16 text-gray-200 mb-4" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Select a Conversation</h3>
                  <p className="text-xs text-gray-500">Choose a parent from the list to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ────────────────────────────────────────────────────────────
          NEW CHAT DIALOG
      ──────────────────────────────────────────────────────────── */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-portal-600" />
              New Chat with Parent
            </DialogTitle>
            <DialogDescription>
              Select a parent from your class to start a conversation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {parentOptions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-500">No parents found in your class</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {parentOptions.map((parent) => {
                  const isSelected = selectedParentId === parent.userId;
                  return (
                    <button
                      key={parent.userId}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? `border-portal-300 ${theme.selectedClass}`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedParentId(parent.userId)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`text-xs font-semibold ${
                            isSelected ? `${theme.avatarFallbackClass}` : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getInitials(parent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{parent.name}</div>
                          <div className="text-[10px] text-gray-500">
                            {parent.relation} of {parent.childName}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-portal-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setShowNewChatDialog(false);
                setSelectedParentId('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-portal-600 hover:bg-portal-700 rounded-xl"
              onClick={handleCreateThread}
              disabled={creatingThread || !selectedParentId}
            >
              {creatingThread ? 'Creating...' : 'Start Chat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page export with Suspense boundary ──
export default function CommunicationPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      }
    >
      <CommunicationContent />
    </Suspense>
  );
}
