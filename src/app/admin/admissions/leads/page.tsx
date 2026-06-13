'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Tag,
  UserCircle,
  X,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { CRM_COLORS, PORTAL_THEMES } from '@/lib/theme-tokens';
import { AddLeadDialog } from '@/components/add-lead-dialog';
import { LeadDetailDrawer } from '@/components/lead-detail-drawer';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface FollowUp {
  id: string;
  type: string;
  dateTime: string;
  outcome: string;
  nextFollowUp: string | null;
  notes: string;
  createdBy: string | null;
  createdAt: string;
}

interface Lead {
  id: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  childName: string;
  childAge: string | null;
  source: string;
  stage: string;
  priority: string;
  programInterest: string | null;
  estimatedValue: number | null;
  assignedTo: string | null;
  notes: string | null;
  nextFollowUp: string | null;
  convertedStudentId: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
  followUps: FollowUp[];
}

// ── Constants ──
const STAGE_CONFIG: Record<string, { label: string; color: string; cardBg: string; textColor: string }> = {
  NEW: { label: 'New', color: CRM_COLORS.NEW?.hex ?? '#9ca3af', cardBg: 'bg-gray-50', textColor: 'text-gray-600' },
  CONTACTED: { label: 'Contacted', color: CRM_COLORS.CONTACTED?.hex ?? '#3b82f6', cardBg: 'bg-blue-50', textColor: 'text-blue-600' },
  VISITED: { label: 'Visited', color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#8b5cf6', cardBg: 'bg-purple-50', textColor: 'text-purple-600' },
  APPLIED: { label: 'Applied', color: CRM_COLORS.APPLICATION?.hex ?? '#f59e0b', cardBg: 'bg-yellow-50', textColor: 'text-yellow-600' },
  ENROLLED: { label: 'Enrolled', color: CRM_COLORS.ENROLLED?.hex ?? '#10b981', cardBg: 'bg-green-50', textColor: 'text-green-600' },
  LOST: { label: 'Lost', color: CRM_COLORS.LOST?.hex ?? '#ef4444', cardBg: 'bg-red-50', textColor: 'text-red-600' },
};

const SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram', FACEBOOK: 'Facebook', GOOGLE: 'Google', WALK_IN: 'Walk-in',
  REFERRAL: 'Referral', WEBSITE: 'Website', JUSTDIAL: 'JustDial', SULEKHA: 'Sulekha',
  NEWSPAPER: 'Newspaper', HOARDING: 'Hoarding', EVENT: 'Event', OTHER: 'Other',
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HIGH: { label: 'High', color: 'text-red-600', bg: 'bg-red-50' },
  NORMAL: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  LOW: { label: 'Low', color: 'text-gray-500', bg: 'bg-gray-50' },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

/**
 * CRM Leads page — Full standalone leads management with list view, filters, pagination.
 */
export default function CrmLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLeads = useCallback(async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (searchQuery) params.set('search', searchQuery);
      if (stageFilter) params.set('stage', stageFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      if (priorityFilter) params.set('priority', priorityFilter);

      const res = await fetch(`/api/crm/leads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, stageFilter, sourceFilter, priorityFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchLeads();
  };

  const handleLeadCreated = () => {
    setAddLeadOpen(false);
    toast.success('Lead created successfully');
    handleRefresh();
  };

  const handleLeadUpdated = () => {
    handleRefresh();
    setDrawerOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Lead deleted');
        handleRefresh();
      } else {
        toast.error('Failed to delete lead');
      }
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  // Summary counts
  const stageCounts = leads.reduce((acc, lead) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/admissions">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to CRM
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-portal-600" />
              Leads Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {total} lead{total !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            onClick={() => setAddLeadOpen(true)}
            className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stage Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          variant={!stageFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setStageFilter(''); setPage(1); }}
          className={cn(!stageFilter && 'bg-brand-gradient text-white border-0')}
        >
          All ({total})
        </Button>
        {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
          <Button
            key={key}
            variant={stageFilter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStageFilter(key); setPage(1); }}
            className={cn(
              stageFilter === key && 'bg-brand-gradient text-white border-0',
            )}
          >
            <span className="h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </Button>
        ))}
      </div>

      {/* Search + Filters Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by parent, child, phone..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {(sourceFilter || priorityFilter) && (
            <span className="ml-1 h-4 w-4 rounded-full bg-portal-600 text-white text-[10px] flex items-center justify-center">
              {[sourceFilter, priorityFilter].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Extended Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap p-3 bg-white rounded-xl border">
          <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v === 'ALL' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sources</SelectItem>
              {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v === 'ALL' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="NORMAL">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStageFilter('');
              setSourceFilter('');
              setPriorityFilter('');
              setSearchQuery('');
              setPage(1);
            }}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
      )}

      {/* Leads Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No leads found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add a new lead</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent / Child</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Est. Fee</TableHead>
                <TableHead>Next Follow-up</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => {
                const stageCfg = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.NEW;
                const priorityCfg = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.NORMAL;
                const followUpDate = lead.nextFollowUp ? new Date(lead.nextFollowUp) : null;

                return (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-gray-50/80"
                    onClick={() => handleLeadClick(lead)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{lead.parentName}</p>
                        <p className="text-xs text-gray-500">{lead.childName}{lead.childAge ? ` (${lead.childAge})` : ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {lead.parentPhone}
                      </div>
                      {lead.parentEmail && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {lead.parentEmail}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        <Tag className="h-3 w-3 mr-1" />
                        {SOURCE_LABELS[lead.source] || lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: stageCfg.color + '15', color: stageCfg.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stageCfg.color }} />
                        {stageCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', priorityCfg.bg, priorityCfg.color)}>
                        {priorityCfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString('en-IN')}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {followUpDate ? (
                        <span className={cn(
                          'flex items-center gap-1',
                          isToday(followUpDate) && 'text-amber-600 font-medium',
                          isTomorrow(followUpDate) && 'text-blue-600',
                          followUpDate < new Date() && !isToday(followUpDate) && 'text-red-600 font-medium',
                        )}>
                          <Calendar className="h-3 w-3" />
                          {isToday(followUpDate) ? 'Today' : isTomorrow(followUpDate) ? 'Tomorrow' : format(followUpDate, 'dd MMM')}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-portal-600 hover:text-portal-700"
                          onClick={(e) => { e.stopPropagation(); handleLeadClick(lead); }}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} leads)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Lead Dialog */}
      <AddLeadDialog
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        onLeadCreated={handleLeadCreated}
      />

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        lead={selectedLead}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
}
