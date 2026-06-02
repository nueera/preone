'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Megaphone,
  Send,
  MessageSquare,
  Bell,
  Plus,
  Search,
  Trash2,
  Loader2,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  Eye,
  X,
  RefreshCw,
  MessageCircle,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;

// ── Types ──
interface Announcement {
  id: string;
  title: string;
  type: string;
  target: string;
  priority: string;
  content: string;
  status: string;
  channels: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  announcements: {
    total: number;
    publishedThisMonth: number;
    scheduled: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  };
  chat: {
    activeThreads: number;
    messagesThisMonth: number;
    messagesToday: number;
  };
  notifications: {
    feeRemindersSent: number;
  };
}

interface ChatThread {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: number;
}

interface ChatMessage {
  id: string;
  threadId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}

// ── Constants ──
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  General: { label: 'General', color: 'text-portal-700', bg: 'bg-portal-50 border-portal-200' },
  Academic: { label: 'Academic', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  Event: { label: 'Event', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  Holiday: { label: 'Holiday', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  Urgent: { label: 'Urgent', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  NORMAL: { label: 'Normal', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  HIGH: { label: 'High', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  CONCERN: { label: 'Concern', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon?: React.ReactNode }> = {
  Published: { label: 'Published', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  Draft: { label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  Scheduled: { label: 'Scheduled', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Clock className="h-3 w-3" /> },
};

const TARGET_LABELS: Record<string, string> = {
  All: 'All',
  Parents: 'Parents',
  Teachers: 'Teachers',
  Staff: 'Staff',
};

// ── Mock Chat Data ──
const MOCK_THREADS: ChatThread[] = [
  {
    id: '1',
    name: 'Class Nursery-A Parents',
    lastMessage: 'Please send extra clothes tomorrow',
    lastMessageTime: '10:30 AM',
    unreadCount: 3,
    participants: 28,
  },
  {
    id: '2',
    name: 'Class LKG-B Parents',
    lastMessage: 'Annual day practice schedule attached',
    lastMessageTime: '9:15 AM',
    unreadCount: 0,
    participants: 32,
  },
  {
    id: '3',
    name: 'General Discussion',
    lastMessage: 'Welcome to the new academic year!',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
    participants: 45,
  },
  {
    id: '4',
    name: 'Class UKG-A Parents',
    lastMessage: 'Fee payment reminder for Q2',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    participants: 30,
  },
  {
    id: '5',
    name: 'Sports Day Volunteers',
    lastMessage: 'Thank you for signing up!',
    lastMessageTime: '2 days ago',
    unreadCount: 0,
    participants: 12,
  },
];

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  '1': [
    { id: '1', threadId: '1', senderName: 'Priya Sharma', senderRole: 'Teacher', content: 'Good morning parents! Today we had a wonderful art session. The kids made finger paintings.', timestamp: '9:00 AM', isMe: false },
    { id: '2', threadId: '1', senderName: 'Rahul Verma', senderRole: 'Parent', content: 'That sounds great! My daughter loved showing her painting at home.', timestamp: '9:15 AM', isMe: false },
    { id: '3', threadId: '1', senderName: 'You', senderRole: 'Admin', content: 'Wonderful to hear! We\'ll be having more creative sessions this week.', timestamp: '9:30 AM', isMe: true },
    { id: '4', threadId: '1', senderName: 'Priya Sharma', senderRole: 'Teacher', content: 'Please send extra clothes tomorrow, we have water play scheduled! 🎨', timestamp: '10:30 AM', isMe: false },
  ],
  '2': [
    { id: '5', threadId: '2', senderName: 'Anita Desai', senderRole: 'Teacher', content: 'Dear parents, the annual day practice schedule is attached. Please ensure your child attends regularly.', timestamp: '8:30 AM', isMe: false },
    { id: '6', threadId: '2', senderName: 'You', senderRole: 'Admin', content: 'Annual day is on March 15th. All parents are invited!', timestamp: '9:00 AM', isMe: true },
    { id: '7', threadId: '2', senderName: 'Sunita Patel', senderRole: 'Parent', content: 'Excited for the annual day! Can we volunteer for decorations?', timestamp: '9:15 AM', isMe: false },
  ],
  '3': [
    { id: '8', threadId: '3', senderName: 'You', senderRole: 'Admin', content: 'Welcome to the new academic year 2025-26! We are thrilled to have all of you with us.', timestamp: '8:00 AM', isMe: true },
    { id: '9', threadId: '3', senderName: 'Meera Joshi', senderRole: 'Parent', content: 'Thank you! Looking forward to a great year ahead.', timestamp: '8:30 AM', isMe: false },
    { id: '10', threadId: '3', senderName: 'Vikram Singh', senderRole: 'Parent', content: 'Same here! When does the new session start?', timestamp: '8:45 AM', isMe: false },
    { id: '11', threadId: '3', senderName: 'You', senderRole: 'Admin', content: 'The new session starts on April 1st. Orientation is on March 28th.', timestamp: 'Yesterday', isMe: true },
  ],
  '4': [
    { id: '12', threadId: '4', senderName: 'You', senderRole: 'Admin', content: 'This is a reminder that Q2 fee payments are due by March 31st. Please complete your payments on time.', timestamp: 'Yesterday', isMe: true },
  ],
  '5': [
    { id: '13', threadId: '5', senderName: 'You', senderRole: 'Admin', content: 'Thank you for signing up for Sports Day volunteering! We\'ll share the detailed schedule soon.', timestamp: '2 days ago', isMe: true },
  ],
};

// ── Helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Stat Card Component ──
function StatCard({
  title,
  value,
  icon,
  gradient,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
}) {
  return (
    <Card className={cn('rounded-3xl border-0 shadow-sm hover:shadow-md transition-shadow', gradient)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page Component ──
export default function CommunicationPage() {
  // ── State ──
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // New Announcement Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    type: '',
    target: 'All',
    priority: 'NORMAL',
    content: '',
    channels: ['Email'] as string[],
    scheduledAt: '',
  });

  // View Announcement Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);

  // Chat state
  const [selectedThread, setSelectedThread] = useState<string>('1');
  const [chatInput, setChatInput] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Fetch Stats ──
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const token = getToken();
      const res = await fetch('/api/communication/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch Announcements ──
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (typeFilter) params.set('type', typeFilter);
      if (priorityFilter) params.set('priority', priorityFilter);

      const res = await fetch(`/api/communication/announcements?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, priorityFilter]);

  // ── Create Announcement ──
  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.type || !newAnnouncement.content) return;

    try {
      setCreating(true);
      const token = getToken();
      const res = await fetch('/api/communication/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newAnnouncement.title,
          type: newAnnouncement.type,
          target: newAnnouncement.target,
          priority: newAnnouncement.priority,
          content: newAnnouncement.content,
          channels: newAnnouncement.channels.join(','),
          scheduledAt: newAnnouncement.scheduledAt || undefined,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        setNewAnnouncement({
          title: '',
          type: '',
          target: 'All',
          priority: 'NORMAL',
          content: '',
          channels: ['Email'],
          scheduledAt: '',
        });
        fetchAnnouncements();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to create announcement:', err);
    } finally {
      setCreating(false);
    }
  };

  // ── Handle View ──
  const handleView = (announcement: Announcement) => {
    setViewingAnnouncement(announcement);
    setViewDialogOpen(true);
  };

  // ── Effects ──
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    }
  }, [activeTab, fetchAnnouncements]);

  // ── Filtered announcements for search ──
  const filteredAnnouncements = announcements.filter((a) => {
    if (!searchQuery) return true;
    return (
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // ── Priority breakdown for stats ──
  const priorityBreakdown = stats?.announcements?.byPriority
    ? Object.entries(stats.announcements.byPriority).map(([key, count]) => ({
        key,
        ...(PRIORITY_CONFIG[key] || { label: key, color: 'text-gray-600', bg: 'bg-gray-50' }),
        count,
      }))
    : [];

  // ── Chat messages for selected thread ──
  const currentMessages = MOCK_MESSAGES[selectedThread] || [];
  const currentThread = MOCK_THREADS.find((t) => t.id === selectedThread);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-portal-600" />
            Communication
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage announcements, messages, and notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats();
              fetchAnnouncements();
            }}
            className="gap-1 rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          {activeTab === 'announcements' && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover rounded-xl">
                  <Plus className="h-4 w-4" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-portal-600" />
                    New Announcement
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter announcement title"
                      value={newAnnouncement.title}
                      onChange={(e) =>
                        setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                      }
                      className="rounded-xl"
                    />
                  </div>

                  {/* Type + Target row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Type <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={newAnnouncement.type}
                        onValueChange={(v) =>
                          setNewAnnouncement({ ...newAnnouncement, type: v })
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="Holiday">Holiday</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Target</Label>
                      <Select
                        value={newAnnouncement.target}
                        onValueChange={(v) =>
                          setNewAnnouncement({ ...newAnnouncement, target: v })
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All</SelectItem>
                          <SelectItem value="Parents">Parents</SelectItem>
                          <SelectItem value="Teachers">Teachers</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Priority</Label>
                    <Select
                      value={newAnnouncement.priority}
                      onValueChange={(v) =>
                        setNewAnnouncement({ ...newAnnouncement, priority: v })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CONCERN">Concern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-sm font-medium">
                      Content <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="content"
                      placeholder="Write your announcement content here..."
                      rows={4}
                      value={newAnnouncement.content}
                      onChange={(e) =>
                        setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                      }
                      className="rounded-xl resize-none"
                    />
                  </div>

                  {/* Channels */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Channels</Label>
                    <div className="flex flex-wrap gap-4">
                      {['SMS', 'WhatsApp', 'Email', 'Push'].map((channel) => (
                        <div key={channel} className="flex items-center gap-2">
                          <Checkbox
                            id={`channel-${channel}`}
                            checked={newAnnouncement.channels.includes(channel)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewAnnouncement({
                                  ...newAnnouncement,
                                  channels: [...newAnnouncement.channels, channel],
                                });
                              } else {
                                setNewAnnouncement({
                                  ...newAnnouncement,
                                  channels: newAnnouncement.channels.filter(
                                    (c) => c !== channel
                                  ),
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`channel-${channel}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {channel}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <Label htmlFor="scheduledAt" className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      Schedule (optional)
                    </Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={newAnnouncement.scheduledAt}
                      onChange={(e) =>
                        setNewAnnouncement({
                          ...newAnnouncement,
                          scheduledAt: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                    {newAnnouncement.scheduledAt && (
                      <p className="text-[11px] text-amber-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Status will be set to &quot;Scheduled&quot;
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateAnnouncement}
                    disabled={
                      creating ||
                      !newAnnouncement.title ||
                      !newAnnouncement.type ||
                      !newAnnouncement.content
                    }
                    className="gap-1.5 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover rounded-xl"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {newAnnouncement.scheduledAt ? 'Schedule' : 'Publish'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* ── Main Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 rounded-xl">
          <TabsTrigger value="announcements" className="gap-1.5 rounded-lg">
            <Megaphone className="h-3.5 w-3.5" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1.5 rounded-lg">
            <MessageSquare className="h-3.5 w-3.5" />
            Messages
          </TabsTrigger>
        </TabsList>

        {/* ─────────────────────────────────────────────
            Tab 1: Announcements
        ───────────────────────────────────────────── */}
        <TabsContent value="announcements" className="mt-6 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="rounded-3xl border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <StatCard
                  title="Total Announcements"
                  value={stats?.announcements?.total ?? 0}
                  icon={<Megaphone className="h-5 w-5 text-portal-600" />}
                  gradient="stat-card-violet"
                />
                <StatCard
                  title="Published This Month"
                  value={stats?.announcements?.publishedThisMonth ?? 0}
                  icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  gradient="stat-card-emerald"
                />
                <StatCard
                  title="Scheduled"
                  value={stats?.announcements?.scheduled ?? 0}
                  icon={<Clock className="h-5 w-5 text-amber-600" />}
                  gradient="stat-card-amber"
                />
                <StatCard
                  title="By Priority"
                  value={priorityBreakdown.map((p) => `${p.label}: ${p.count}`).join(' · ') || '0'}
                  icon={<Filter className="h-5 w-5 text-rose-600" />}
                  gradient="stat-card-rose"
                  subtitle={priorityBreakdown.length > 0 ? `${priorityBreakdown.length} priority levels` : undefined}
                />
              </>
            )}
          </div>

          {/* Filters + Search Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64 rounded-xl"
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1 rounded-xl"
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="flex items-center gap-3 flex-wrap p-3 bg-white rounded-2xl border shadow-sm">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('');
                  setPriorityFilter('');
                  setSearchQuery('');
                }}
                className="text-xs rounded-xl"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}

          {/* Announcements Table */}
          <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-gray-500">Title</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">Type</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">Target</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">Priority</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">Published</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnouncements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Megaphone className="h-10 w-10 text-gray-200" />
                          <p className="text-sm font-medium">No announcements found</p>
                          <p className="text-xs">Click &quot;New Announcement&quot; to create one</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAnnouncements.map((announcement) => {
                      const typeCfg = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.General;
                      const priorityCfg = PRIORITY_CONFIG[announcement.priority] || PRIORITY_CONFIG.NORMAL;
                      const statusCfg = STATUS_CONFIG[announcement.status] || STATUS_CONFIG.Draft;

                      return (
                        <TableRow
                          key={announcement.id}
                          className="table-row-preone cursor-pointer"
                          onClick={() => handleView(announcement)}
                        >
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">
                            {announcement.title}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[11px] rounded-lg font-medium border',
                                typeCfg.bg,
                                typeCfg.color
                              )}
                            >
                              {typeCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {TARGET_LABELS[announcement.target] || announcement.target}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[11px] rounded-lg font-medium border',
                                priorityCfg.bg,
                                priorityCfg.color
                              )}
                            >
                              {priorityCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[11px] rounded-lg font-medium border gap-1',
                                statusCfg.bg,
                                statusCfg.color
                              )}
                            >
                              {statusCfg.icon}
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {announcement.publishedAt
                              ? format(new Date(announcement.publishedAt), 'dd MMM yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-portal-600 hover:text-portal-700 hover:bg-portal-50 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(announcement);
                                }}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // DELETE not implemented yet
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t">
                <p className="text-xs text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ─────────────────────────────────────────────
            Tab 2: Messages (Chat)
        ───────────────────────────────────────────── */}
        <TabsContent value="messages" className="mt-6">
          <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
            {/* Left Panel: Thread List */}
            <Card className="w-80 shrink-0 rounded-3xl border-0 shadow-sm flex flex-col overflow-hidden hidden sm:flex">
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-900">Chat Threads</h3>
                  <Badge variant="secondary" className="text-[10px] rounded-lg">
                    {MOCK_THREADS.length}
                  </Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search threads..."
                    className="pl-9 h-8 text-xs rounded-xl"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {MOCK_THREADS.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-2xl transition-all duration-200',
                        selectedThread === thread.id
                          ? 'bg-portal-50 border border-portal-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback
                            className={cn(
                              'text-xs font-semibold rounded-xl',
                              selectedThread === thread.id
                                ? 'bg-portal-200 text-portal-700'
                                : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {thread.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {thread.name}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                              {thread.lastMessageTime}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-gray-500 truncate">
                              {thread.lastMessage}
                            </span>
                            {thread.unreadCount > 0 && (
                              <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-portal-600 text-[9px] font-bold text-white">
                                {thread.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3 text-gray-300" />
                            <span className="text-[10px] text-gray-400">{thread.participants}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Mobile thread selector */}
            <div className="sm:hidden w-full">
              <Card className="rounded-3xl border-0 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b bg-white">
                  <Select value={selectedThread} onValueChange={setSelectedThread}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_THREADS.map((thread) => (
                        <SelectItem key={thread.id} value={thread.id}>
                          {thread.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mobile Chat Area */}
                <div className="flex-1 flex flex-col">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {currentMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex',
                            msg.isMe ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[80%] rounded-2xl px-4 py-2.5',
                              msg.isMe
                                ? 'bg-brand-gradient text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            )}
                          >
                            {!msg.isMe && (
                              <p className={cn(
                                'text-[11px] font-semibold mb-0.5',
                                msg.senderRole === 'Teacher' ? 'text-portal-600' : 'text-sky-600'
                              )}>
                                {msg.senderName}
                              </p>
                            )}
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={cn(
                              'text-[10px] mt-1',
                              msg.isMe ? 'text-white/70' : 'text-gray-400'
                            )}>
                              {msg.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-3 border-t bg-white">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && chatInput.trim()) {
                            setChatInput('');
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        disabled={!chatInput.trim()}
                        className="shrink-0 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover rounded-xl h-10 w-10"
                        onClick={() => setChatInput('')}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Panel: Chat Area (desktop) */}
            <Card className="flex-1 rounded-3xl border-0 shadow-sm flex flex-col overflow-hidden hidden sm:flex">
              {/* Chat Header */}
              <div className="p-4 border-b bg-white flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-portal-100 text-portal-700 text-sm font-semibold rounded-xl">
                    {currentThread?.name.split(' ').map((w) => w[0]).join('').slice(0, 2) || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900">
                    {currentThread?.name || 'Select a thread'}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {currentThread?.participants || 0} participants
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] rounded-lg">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Group Chat
                </Badge>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2',
                        msg.isMe ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!msg.isMe && (
                        <Avatar className="h-7 w-7 shrink-0 mt-1">
                          <AvatarFallback className="text-[9px] font-semibold rounded-lg bg-gray-100 text-gray-600">
                            {msg.senderName.split(' ').map((w) => w[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2.5',
                          msg.isMe
                            ? 'bg-brand-gradient text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        )}
                      >
                        {!msg.isMe && (
                          <p className={cn(
                            'text-[11px] font-semibold mb-0.5',
                            msg.senderRole === 'Teacher' ? 'text-portal-600' : 'text-sky-600'
                          )}>
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={cn(
                          'text-[10px] mt-1',
                          msg.isMe ? 'text-white/70' : 'text-gray-400'
                        )}>
                          {msg.timestamp}
                        </p>
                      </div>
                      {msg.isMe && (
                        <Avatar className="h-7 w-7 shrink-0 mt-1">
                          <AvatarFallback className="text-[9px] font-semibold rounded-lg bg-portal-100 text-portal-700">
                            You
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {currentMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                      <MessageSquare className="h-10 w-10 text-gray-200 mb-2" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">Start a conversation!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t bg-white">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        setChatInput('');
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    disabled={!chatInput.trim()}
                    className="shrink-0 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover rounded-xl h-10 w-10"
                    onClick={() => setChatInput('')}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── View Announcement Dialog ── */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-3xl">
          {viewingAnnouncement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Megaphone className="h-5 w-5 text-portal-600" />
                  Announcement Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Title */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {viewingAnnouncement.title}
                  </h3>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[11px] rounded-lg font-medium border',
                      (TYPE_CONFIG[viewingAnnouncement.type] || TYPE_CONFIG.General).bg,
                      (TYPE_CONFIG[viewingAnnouncement.type] || TYPE_CONFIG.General).color
                    )}
                  >
                    {(TYPE_CONFIG[viewingAnnouncement.type] || TYPE_CONFIG.General).label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[11px] rounded-lg font-medium border',
                      (PRIORITY_CONFIG[viewingAnnouncement.priority] || PRIORITY_CONFIG.NORMAL).bg,
                      (PRIORITY_CONFIG[viewingAnnouncement.priority] || PRIORITY_CONFIG.NORMAL).color
                    )}
                  >
                    {(PRIORITY_CONFIG[viewingAnnouncement.priority] || PRIORITY_CONFIG.NORMAL).label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[11px] rounded-lg font-medium border gap-1',
                      (STATUS_CONFIG[viewingAnnouncement.status] || STATUS_CONFIG.Draft).bg,
                      (STATUS_CONFIG[viewingAnnouncement.status] || STATUS_CONFIG.Draft).color
                    )}
                  >
                    {(STATUS_CONFIG[viewingAnnouncement.status] || STATUS_CONFIG.Draft).icon}
                    {(STATUS_CONFIG[viewingAnnouncement.status] || STATUS_CONFIG.Draft).label}
                  </Badge>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-gray-500 text-xs font-medium">Target Audience</span>
                    <p className="font-medium text-gray-900">
                      {TARGET_LABELS[viewingAnnouncement.target] || viewingAnnouncement.target}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-500 text-xs font-medium">Published</span>
                    <p className="font-medium text-gray-900">
                      {viewingAnnouncement.publishedAt
                        ? format(new Date(viewingAnnouncement.publishedAt), 'dd MMM yyyy, hh:mm a')
                        : '—'}
                    </p>
                  </div>
                  {viewingAnnouncement.scheduledAt && (
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Scheduled For
                      </span>
                      <p className="font-medium text-amber-600">
                        {format(new Date(viewingAnnouncement.scheduledAt), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  )}
                  {viewingAnnouncement.channels && (
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium">Channels</span>
                      <p className="font-medium text-gray-900">
                        {viewingAnnouncement.channels}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Content */}
                <div className="space-y-1.5">
                  <span className="text-gray-500 text-xs font-medium">Content</span>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {viewingAnnouncement.content}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                  className="rounded-xl"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
