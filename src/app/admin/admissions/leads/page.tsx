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
  X,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Columns3,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CRM_COLORS, PORTAL_THEMES } from '@/lib/theme-tokens';
import { PreOneCard } from '@/components/ui/preone-card';
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
const STAGE_CONFIG: Record<
  string,
  { label: string; color: string; cardBg: string; textColor: string; softVar: string; varColor: string }
> = {
  NEW: {
    label: 'New',
    color: CRM_COLORS.NEW?.hex ?? '#9ca3af',
    cardBg: 'bg-[var(--admin-surface-2)]',
    textColor: 'text-[var(--admin-text-muted)]',
    softVar: 'var(--admin-surface-2)',
    varColor: 'var(--admin-text-muted)',
  },
  CONTACTED: {
    label: 'Contacted',
    color: CRM_COLORS.CONTACTED?.hex ?? '#3b82f6',
    cardBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    softVar: 'var(--admin-info-soft)',
    varColor: 'var(--admin-info)',
  },
  VISITED: {
    label: 'Visited',
    color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#8b5cf6',
    cardBg: 'bg-purple-50',
    textColor: 'text-purple-600',
    softVar: 'var(--admin-primary-soft)',
    varColor: 'var(--admin-primary)',
  },
  APPLIED: {
    label: 'Applied',
    color: CRM_COLORS.APPLICATION?.hex ?? '#f59e0b',
    cardBg: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    softVar: 'var(--admin-warning-soft)',
    varColor: 'var(--admin-warning)',
  },
  ENROLLED: {
    label: 'Enrolled',
    color: CRM_COLORS.ENROLLED?.hex ?? '#10b981',
    cardBg: 'bg-green-50',
    textColor: 'text-green-600',
    softVar: 'var(--admin-success-soft)',
    varColor: 'var(--admin-success)',
  },
  LOST: {
    label: 'Lost',
    color: CRM_COLORS.LOST?.hex ?? '#ef4444',
    cardBg: 'bg-red-50',
    textColor: 'text-red-600',
    softVar: 'rgba(239,68,68,0.1)',
    varColor: 'var(--admin-error)',
  },
};

const SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  GOOGLE: 'Google',
  WALK_IN: 'Walk-in',
  REFERRAL: 'Referral',
  WEBSITE: 'Website',
  JUSTDIAL: 'JustDial',
  SULEKHA: 'Sulekha',
  NEWSPAPER: 'Newspaper',
  HOARDING: 'Hoarding',
  EVENT: 'Event',
  OTHER: 'Other',
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  HIGH: {
    label: 'High',
    color: 'var(--admin-error)',
    bg: 'rgba(239,68,68,0.1)',
  },
  NORMAL: {
    label: 'Medium',
    color: 'var(--admin-warning)',
    bg: 'var(--admin-warning-soft)',
  },
  LOW: {
    label: 'Low',
    color: 'var(--admin-text-muted)',
    bg: 'var(--admin-surface-2)',
  },
};

// Stage filter pills config (matching /admin/students design)
const STAGE_PILLS = [
  { key: '', label: 'All', color: 'var(--admin-primary)', bg: 'var(--admin-primary-soft)' },
  { key: 'NEW', label: 'New', color: 'var(--admin-text-muted)', bg: 'var(--admin-surface-2)' },
  { key: 'CONTACTED', label: 'Contacted', color: 'var(--admin-info)', bg: 'var(--admin-info-soft)' },
  { key: 'VISITED', label: 'Visited', color: 'var(--admin-primary)', bg: 'var(--admin-primary-soft)' },
  { key: 'APPLIED', label: 'Applied', color: 'var(--admin-warning)', bg: 'var(--admin-warning-soft)' },
  { key: 'ENROLLED', label: 'Enrolled', color: 'var(--admin-success)', bg: 'var(--admin-success-soft)' },
  { key: 'LOST', label: 'Lost', color: 'var(--admin-error)', bg: 'rgba(239,68,68,0.1)' },
];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Sub-components ──
function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.NEW;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: cfg.softVar, color: cfg.varColor }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: cfg.varColor }}
      />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.NORMAL;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function FilterPill({
  label,
  count,
  active,
  activeColor,
  activeBg,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  activeColor: string;
  activeBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
      style={
        active
          ? { background: activeBg, color: activeColor }
          : {
              background: 'var(--admin-surface-2)',
              color: 'var(--admin-text-muted)',
            }
      }
    >
      {label}
      {count != null && (
        <span
          className="rounded-full px-1.5 text-[10px] font-semibold"
          style={
            active
              ? { background: activeColor, color: activeBg }
              : { background: 'var(--admin-surface)', color: 'var(--admin-text-muted)' }
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
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
  const [limit, setLimit] = useState(20);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
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
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, stageFilter, sourceFilter, priorityFilter, limit]);

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

  const hasActiveFilters =
    searchQuery !== '' ||
    stageFilter !== '' ||
    sourceFilter !== '' ||
    priorityFilter !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setStageFilter('');
    setSourceFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  // Stage counts from current page leads (quick visual reference)
  const stageCounts = leads.reduce(
    (acc, lead) => {
      acc[lead.stage] = (acc[lead.stage] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Page numbers (matching /admin/students design)
  const pageNumbers = React.useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, page]);

  const startRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
      {/* ── SECTION 1: HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/admissions">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--admin-primary-soft)' }}
            >
              <Users
                className="h-5 w-5"
                style={{ color: 'var(--admin-primary)' }}
              />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--admin-text)' }}
              >
                Leads Management
              </h1>
              <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                Manage all admission leads and enquiries
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            onClick={() => setAddLeadOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Lead</span>
          </Button>
        </div>
      </div>

      {/* ── SECTION 2: FILTER BAR ── */}
      <PreOneCard className="!rounded-xl">
        <div className="p-4 space-y-3">
          {/* Row 1: Search + Filters toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--admin-text-subtle)' }}
              />
              <input
                type="text"
                placeholder="Search by parent, child or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-lg border px-3 pl-9 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--admin-surface-2)',
                  borderColor: 'var(--admin-border)',
                  color: 'var(--admin-text)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--admin-primary)';
                  e.currentTarget.style.boxShadow =
                    '0 0 0 2px var(--admin-primary-soft)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--admin-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {(sourceFilter || priorityFilter) && (
                <span
                  className="ml-1 h-4 min-w-[16px] rounded-full px-1 text-[10px] flex items-center justify-center"
                  style={{
                    background: 'var(--admin-primary)',
                    color: 'white',
                  }}
                >
                  {[sourceFilter, priorityFilter].filter(Boolean).length}
                </span>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                style={{ color: 'var(--admin-error)' }}
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Row 2: Stage Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {STAGE_PILLS.map((pill) => (
              <FilterPill
                key={pill.key || 'all'}
                label={pill.label}
                count={pill.key ? stageCounts[pill.key] : total}
                active={stageFilter === pill.key}
                activeColor={pill.color}
                activeBg={pill.bg}
                onClick={() => {
                  setStageFilter(pill.key);
                  setPage(1);
                }}
              />
            ))}
          </div>

          {/* Row 3: Extended Filters (collapsible) */}
          {showFilters && (
            <div
              className="flex flex-wrap items-center gap-3 rounded-lg p-3"
              style={{ background: 'var(--admin-surface-2)' }}
            >
              <Select
                value={sourceFilter || 'ALL'}
                onValueChange={(v) => {
                  setSourceFilter(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sources</SelectItem>
                  {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter || 'ALL'}
                onValueChange={(v) => {
                  setPriorityFilter(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="NORMAL">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </PreOneCard>

      {/* ── SECTION 3: STATS BAR + DATA TABLE ── */}
      <PreOneCard className="!rounded-xl overflow-hidden">
        {/* Stats Bar */}
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-sm"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              Total Leads
            </span>
            <span
              className="rounded-md px-2 py-0.5 text-sm font-bold tabular-nums"
              style={{
                background: 'var(--admin-primary-soft)',
                color: 'var(--admin-primary)',
              }}
            >
              {total}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Columns3 className="h-3.5 w-3.5" />
            Columns
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div
              className="flex items-center justify-center h-48 text-sm"
              style={{ color: 'var(--admin-text-subtle)' }}
            >
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading leads...
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search
                className="h-10 w-10 mb-3 opacity-40"
                style={{ color: 'var(--admin-text-muted)' }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                No leads found
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--admin-text-subtle)' }}
              >
                Try adjusting your search or filters, or add a new lead.
              </p>
              <Button
                size="sm"
                className="mt-4 gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                onClick={() => setAddLeadOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Lead
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: 'var(--admin-border)' }}
                >
                  <th
                    className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Parent / Child <ArrowUpDown className="h-3 w-3 opacity-40" />
                    </span>
                  </th>
                  <th
                    className="min-w-[160px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Contact
                  </th>
                  <th
                    className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Source
                  </th>
                  <th
                    className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Stage <ArrowUpDown className="h-3 w-3 opacity-40" />
                    </span>
                  </th>
                  <th
                    className="w-[100px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Priority
                  </th>
                  <th
                    className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Est. Fee
                  </th>
                  <th
                    className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Next Follow-up
                  </th>
                  <th
                    className="w-[80px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {leads.map((lead) => {
                  const stageCfg = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.NEW;
                  const followUpDate = lead.nextFollowUp
                    ? new Date(lead.nextFollowUp)
                    : null;
                  const isOverdue =
                    followUpDate &&
                    followUpDate < new Date() &&
                    !isToday(followUpDate);

                  return (
                    <tr
                      key={lead.id}
                      className="cursor-pointer table-row-preone border-b"
                      style={{ borderColor: 'var(--admin-border)' }}
                      onClick={() => handleLeadClick(lead)}
                    >
                      {/* Parent / Child: Avatar + Names */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
                            style={{
                              background: stageCfg.softVar,
                              color: stageCfg.varColor,
                            }}
                          >
                            {getInitials(lead.parentName)}
                          </div>
                          <div className="min-w-0">
                            <div
                              className="truncate font-medium"
                              style={{ color: 'var(--admin-text)' }}
                            >
                              {lead.parentName}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: 'var(--admin-text-subtle)' }}
                            >
                              {lead.childName}
                              {lead.childAge ? ` (${lead.childAge})` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3 text-xs">
                        <div
                          className="flex items-center gap-1 whitespace-nowrap tabular-nums"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          <Phone
                            className="h-3 w-3"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          />
                          {lead.parentPhone}
                        </div>
                        {lead.parentEmail && (
                          <div
                            className="flex items-center gap-1 whitespace-nowrap mt-0.5"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          >
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[140px]">
                              {lead.parentEmail}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                          style={{
                            background: 'var(--admin-surface-2)',
                            color: 'var(--admin-text-muted)',
                          }}
                        >
                          <Tag className="h-3 w-3" />
                          {SOURCE_LABELS[lead.source] || lead.source}
                        </span>
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-3">
                        <StageBadge stage={lead.stage} />
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <PriorityBadge priority={lead.priority} />
                      </td>

                      {/* Estimated Fee */}
                      <td
                        className="px-4 py-3 text-sm font-medium tabular-nums"
                        style={{ color: 'var(--admin-text)' }}
                      >
                        {lead.estimatedValue
                          ? `₹${lead.estimatedValue.toLocaleString('en-IN')}`
                          : '—'}
                      </td>

                      {/* Next Follow-up */}
                      <td className="px-4 py-3 text-xs">
                        {followUpDate ? (
                          <span
                            className="flex items-center gap-1 whitespace-nowrap"
                            style={{
                              color: isOverdue
                                ? 'var(--admin-error)'
                                : isToday(followUpDate)
                                  ? 'var(--admin-warning)'
                                  : isTomorrow(followUpDate)
                                    ? 'var(--admin-info)'
                                    : 'var(--admin-text-muted)',
                              fontWeight:
                                isOverdue || isToday(followUpDate)
                                  ? 600
                                  : 400,
                            }}
                          >
                            <Calendar className="h-3 w-3" />
                            {isToday(followUpDate)
                              ? 'Today'
                              : isTomorrow(followUpDate)
                                ? 'Tomorrow'
                                : format(followUpDate, 'dd MMM')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-subtle)' }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
                            style={{
                              color: 'var(--admin-text-muted)',
                              background: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                'var(--admin-surface-2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            onClick={() => handleLeadClick(lead)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
                            style={{
                              color: 'var(--admin-text-muted)',
                              background: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                'var(--admin-surface-2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            onClick={() => handleDelete(lead.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── SECTION 4: PAGINATION ── */}
        {!loading && leads.length > 0 && (
          <div
            className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: 'var(--admin-border)' }}
          >
            <div className="flex items-center gap-4">
              <span
                className="text-xs"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Showing {startRow} to {endRow} of {total} leads
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs"
                  style={{ color: 'var(--admin-text-subtle)' }}
                >
                  Rows per page:
                </span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 rounded border px-1.5 text-xs outline-none"
                  style={{
                    background: 'var(--admin-surface)',
                    borderColor: 'var(--admin-border)',
                    color: 'var(--admin-text)',
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                style={{
                  color: 'var(--admin-text-muted)',
                  opacity: page <= 1 ? 0.4 : 1,
                }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageNumbers.map((p, idx) =>
                p === '...' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-8 w-8 items-center justify-center text-xs"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors"
                    style={
                      page === p
                        ? {
                            background: 'var(--admin-primary-soft)',
                            color: 'var(--admin-primary)',
                          }
                        : { color: 'var(--admin-text-muted)' }
                    }
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                style={{
                  color: 'var(--admin-text-muted)',
                  opacity: page >= totalPages ? 0.4 : 1,
                }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </PreOneCard>

      {/* ── Dialogs ── */}
      <AddLeadDialog
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        onLeadCreated={handleLeadCreated}
      />

      <LeadDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        lead={selectedLead}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
}
