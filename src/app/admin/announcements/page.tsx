'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  X,
  RefreshCw,
  FileBarChart,
  CheckCircle2,
  Clock,
  FileEdit,
  Eye,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAnnouncementStore } from '@/lib/stores/announcement-store';
import { AnnouncementCard } from '@/components/announcements/announcement-card';
import { CreateAnnouncementDialog } from '@/components/announcements/create-announcement-dialog';
import { AnnouncementReadReceipts } from '@/components/announcements/announcement-read-receipts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Stat Card ──
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
    <Card className={cn('rounded-2xl border-0 shadow-sm', gradient)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-[10px] text-gray-400">{subtitle}</p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──
export default function AdminAnnouncementsPage() {
  const {
    announcements,
    drafts,
    isLoading,
    fetchAnnouncements,
    fetchDrafts,
    deleteAnnouncement,
    publishAnnouncement,
    markAsRead,
  } = useAnnouncementStore();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);

  // Read receipts dialog
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const [receiptsAnnouncementId, setReceiptsAnnouncementId] = useState('');

  // ── Fetch data ──
  const loadData = useCallback(async () => {
    const filters: Record<string, string> = {};
    if (typeFilter) filters.type = typeFilter;
    if (priorityFilter) filters.priority = priorityFilter;

    if (activeTab === 'drafts') {
      await fetchDrafts();
    } else if (activeTab === 'scheduled') {
      filters.status = 'SCHEDULED';
      await fetchAnnouncements(filters);
    } else if (activeTab === 'published') {
      filters.status = 'PUBLISHED';
      await fetchAnnouncements(filters);
    } else {
      await fetchAnnouncements(filters);
    }
  }, [activeTab, typeFilter, priorityFilter, fetchAnnouncements, fetchDrafts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Computed ──
  const displayAnnouncements = useMemo(() => {
    let list = activeTab === 'drafts' ? drafts : announcements;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, drafts, announcements, searchQuery]);

  const publishedCount = announcements.filter(
    (a) => a.status === 'PUBLISHED'
  ).length;
  const draftCount = drafts.length;
  const scheduledCount = announcements.filter(
    (a) => a.status === 'SCHEDULED'
  ).length;
  const totalReadCount = announcements.reduce((sum, a) => sum + a.readCount, 0);
  const totalRecipients = announcements.reduce(
    (sum, a) => sum + a.totalRecipients,
    0
  );
  const readRate =
    totalRecipients > 0 ? Math.round((totalReadCount / totalRecipients) * 100) : 0;

  // ── Handlers ──
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      toast.success('Announcement deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishAnnouncement(id);
      toast.success('Announcement published');
      loadData();
    } catch {
      toast.error('Failed to publish');
    }
  };

  const handleCardClick = async (announcement: (typeof announcements)[0]) => {
    if (!announcement.isRead) {
      await markAsRead(announcement.id);
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
            Create and manage announcements across your school
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="gap-1 rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Create Announcement
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={announcements.length + drafts.length}
          icon={<Megaphone className="h-5 w-5 text-portal-600" />}
          gradient="stat-card-violet"
        />
        <StatCard
          title="Published"
          value={publishedCount}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          gradient="stat-card-emerald"
        />
        <StatCard
          title="Drafts"
          value={draftCount}
          icon={<FileEdit className="h-5 w-5 text-amber-600" />}
          gradient="stat-card-amber"
        />
        <StatCard
          title="Read Rate"
          value={`${readRate}%`}
          icon={<Eye className="h-5 w-5 text-rose-600" />}
          gradient="stat-card-rose"
          subtitle={`${totalReadCount} of ${totalRecipients} reads`}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg text-xs">
            All
          </TabsTrigger>
          <TabsTrigger value="published" className="rounded-lg text-xs">
            Published
          </TabsTrigger>
          <TabsTrigger value="drafts" className="rounded-lg text-xs">
            Drafts
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="rounded-lg text-xs">
            Scheduled
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full rounded-xl"
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

          {/* Expanded Filters */}
          {showFilters && (
            <div className="flex items-center gap-3 flex-wrap p-3 bg-white rounded-xl border">
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="HOLIDAY">Holiday</SelectItem>
                  <SelectItem value="FEE_REMINDER">Fee Reminder</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                  <SelectItem value="CONCERN">Concern</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(v) => setPriorityFilter(v === 'ALL' ? '' : v)}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CONCERN">Concern</SelectItem>
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
                <Megaphone className="h-12 w-12 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">
                  No announcements found
                </p>
                <p className="text-xs text-gray-400">
                  Click &quot;Create Announcement&quot; to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  showActions
                  onClick={() => handleCardClick(announcement)}
                  onEdit={() => {
                    // Could open edit dialog — for now, just toast
                    toast.info('Edit functionality coming soon');
                  }}
                  onDelete={() => handleDelete(announcement.id)}
                  onPublish={() => handlePublish(announcement.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateAnnouncementDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={loadData}
      />

      {/* Read Receipts Dialog */}
      <Dialog open={receiptsOpen} onOpenChange={setReceiptsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-portal-600" />
              Read Receipts
            </DialogTitle>
          </DialogHeader>
          {receiptsAnnouncementId && (
            <AnnouncementReadReceipts announcementId={receiptsAnnouncementId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
