'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  X,
  RefreshCw,
  Eye,
  AlertTriangle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useAnnouncementStore } from '@/lib/stores/announcement-store';
import { AnnouncementCard } from '@/components/announcements/announcement-card';
import { CreateAnnouncementDialog } from '@/components/announcements/create-announcement-dialog';
import { AnnouncementReadReceipts } from '@/components/announcements/announcement-read-receipts';
import { toast } from 'sonner';

// ── Helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Main Page ──
export default function TeacherAnnouncementsPage() {
  const {
    announcements,
    isLoading,
    fetchAnnouncements,
    markAsRead,
  } = useAnnouncementStore();

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
    await fetchAnnouncements(filters);
  }, [typeFilter, priorityFilter, fetchAnnouncements]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Computed ──
  const displayAnnouncements = useMemo(() => {
    if (!searchQuery) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    );
  }, [announcements, searchQuery]);

  // ── Handlers ──
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
            View announcements and create ones for your class
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
            className="gap-1 bg-portal-gradient text-white border-0 hover:opacity-90 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Create for Class
          </Button>
        </div>
      </div>

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
              <SelectItem value="EMERGENCY">Emergency</SelectItem>
              <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
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
              Announcements from your school will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              showActions={announcement.status !== 'PUBLISHED'}
              onClick={() => handleCardClick(announcement)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog — restricted targets for teacher */}
      <CreateAnnouncementDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultTarget="CLASS"
        restrictedTargets={['CLASS', 'PARENTS']}
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
