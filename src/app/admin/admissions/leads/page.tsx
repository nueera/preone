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
import {
  WarmPremium,
  WarmCard,
  WarmSectionHeading,
  WarmEmptyState,
  WarmButton,
  WarmPill,
  WarmStagePill,
  WarmPriorityPill,
  WarmSourcePill,
} from '@/components/warm-premium';

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
    cardBg: 'bg-[var(--warm-bg-soft)]',
    textColor: 'text-[var(--warm-ink-muted)]',
    softVar: 'var(--warm-bg-soft)',
    varColor: 'var(--warm-ink-muted)',
  },
  CONTACTED: {
    label: 'Contacted',
    color: CRM_COLORS.CONTACTED?.hex ?? '#3b82f6',
    cardBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    softVar: 'var(--admin-info-soft)',
    varColor: 'var(--warm-sky-ink)',
  },
  VISITED: {
    label: 'Visited',
    color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#8b5cf6',
    cardBg: 'bg-purple-50',
    textColor: 'text-purple-600',
    softVar: 'var(--warm-primary-soft)',
    varColor: 'var(--warm-primary)',
  },
  APPLIED: {
    label: 'Applied',
    color: CRM_COLORS.APPLICATION?.hex ?? '#f59e0b',
    cardBg: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    softVar: 'var(--admin-warning-soft)',
    varColor: 'var(--warm-honey-ink)',
  },
  ENROLLED: {
    label: 'Enrolled',
    color: CRM_COLORS.ENROLLED?.hex ?? '#10b981',
    cardBg: 'bg-green-50',
    textColor: 'text-green-600',
    softVar: 'var(--admin-success-soft)',
    varColor: 'var(--warm-sage)',
  },
  LOST: {
    label: 'Lost',
    color: CRM_COLORS.LOST?.hex ?? '#ef4444',
    cardBg: 'bg-red-50',
    textColor: 'text-red-600',
    softVar: 'rgba(239,68,68,0.1)',
    varColor: 'var(--warm-rose-ink)',
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
    color: 'var(--warm-rose-ink)',
    bg: 'rgba(239,68,68,0.1)',
  },
  NORMAL: {
    label: 'Medium',
    color: 'var(--warm-honey-ink)',
    bg: 'var(--admin-warning-soft)',
  },
  LOW: {
    label: 'Low',
    color: 'var(--warm-ink-muted)',
    bg: 'var(--warm-bg-soft)',
  },
};

// Stage filter pills config (matching /admin/students design)
const STAGE_PILLS = [
  { key: '', label: 'All', color: 'var(--warm-primary)', bg: 'var(--warm-primary-soft)' },
  { key: 'NEW', label: 'New', color: 'var(--warm-ink-muted)', bg: 'var(--warm-bg-soft)' },
  { key: 'CONTACTED', label: 'Contacted', color: 'var(--warm-sky-ink)', bg: 'var(--admin-info-soft)' },
  { key: 'VISITED', label: 'Visited', color: 'var(--warm-primary)', bg: 'var(--warm-primary-soft)' },
  { key: 'APPLIED', label: 'Applied', color: 'var(--warm-honey-ink)', bg: 'var(--admin-warning-soft)' },
  { key: 'ENROLLED', label: 'Enrolled', color: 'var(--warm-sage)', bg: 'var(--admin-success-soft)' },
  { key: 'LOST', label: 'Lost', color: 'var(--warm-rose-ink)', bg: 'rgba(239,68,68,0.1)' },
];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Sub-components ──
function StageBadge({ stage }: { stage: string }) {
  return <WarmStagePill stage={stage} />;
}

function PriorityBadge({ priority }: { priority: string }) {
  return <WarmPriorityPill priority={priority} />;
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
              background: 'var(--warm-bg-soft)',
              color: 'var(--warm-ink-muted)',
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
              : { background: 'var(--warm-surface)', color: 'var(--warm-ink-muted)' }
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
    <WarmPremium className="min-h-screen">
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ── SECTION 1: HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between warm-fade-in">
        <div className="flex items-center gap-4">
          <Link href="/admin/admissions">
            <WarmButton variant="ghost" size="sm" leftIcon={ArrowLeft}>
              Back
            </WarmButton>
          </Link>
          <WarmSectionHeading
            kicker="Leads"
            title="Every family, one place"
            description="Manage all admission leads and enquiries — from first hello to enrolled."
            accent="primary"
            scribble
          />
        </div>
        <div className="flex items-center gap-2">
          <WarmButton
            variant="outline"
            size="md"
            leftIcon={RefreshCw}
            onClick={handleRefresh}
          >
            <span className="hidden sm:inline">Refresh</span>
          </WarmButton>
          <WarmButton
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={() => setAddLeadOpen(true)}
          >
            <span className="hidden sm:inline">Add Lead</span>
          </WarmButton>
        </div>
      </div>

      {/* ── SECTION 2: FILTER BAR ── */}
      <WarmCard fade>
        <div className="p-5 space-y-4">
          {/* Row 1: Search + Filters toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--warm-ink-muted)]"
              />
              <input
                type="text"
                placeholder="Search by parent, child or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-[var(--warm-radius-sm)] border px-3 pl-9 text-sm outline-none transition-all bg-[var(--warm-surface-tint)] border-[var(--warm-border)] text-[var(--warm-ink)] placeholder:text-[var(--warm-ink-faint)] focus:border-[var(--warm-primary)] focus:bg-[var(--warm-surface)]"
              />
            </div>

            <WarmButton
              variant={showFilters ? 'primary' : 'outline'}
              size="md"
              leftIcon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
              {(sourceFilter || priorityFilter) && (
                <span className="ml-1 h-5 min-w-[20px] rounded-full px-1.5 text-[10px] flex items-center justify-center bg-[var(--warm-primary)] text-white">
                  {[sourceFilter, priorityFilter].filter(Boolean).length}
                </span>
              )}
            </WarmButton>

            {hasActiveFilters && (
              <WarmButton
                variant="ghost"
                size="md"
                leftIcon={X}
                className="text-[var(--warm-rose-ink)]"
                onClick={clearFilters}
              >
                Clear Filters
              </WarmButton>
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
            <div className="flex flex-wrap items-center gap-3 rounded-[var(--warm-radius-md)] p-4 bg-[var(--warm-bg-soft)]">
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
      </WarmCard>

      {/* ── SECTION 3: STATS BAR + DATA TABLE ── */}
      <WarmCard className="overflow-hidden" fade>
        {/* Stats Bar */}
        <div className="flex items-center justify-between border-b border-[var(--warm-divider)] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--warm-ink-muted)]">
              Total Leads
            </span>
            <WarmPill variant="primary" size="md">{total}</WarmPill>
          </div>
          <WarmButton variant="ghost" size="sm" leftIcon={Columns3}>
            Columns
          </WarmButton>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-sm text-[var(--warm-ink-muted)]">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading leads...
            </div>
          ) : leads.length === 0 ? (
            <WarmEmptyState
              illustration="search"
              title="No leads found"
              description="Try adjusting your search or filters, or add a new lead and watch your pipeline grow."
              action={
                <WarmButton variant="primary" size="md" leftIcon={Plus} onClick={() => setAddLeadOpen(true)}>
                  Add Lead
                </WarmButton>
              }
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: 'var(--warm-border)' }}
                >
                  <th
                    className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--warm-ink-muted)' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Parent / Child <ArrowUpDown className="h-3 w-3 opacity-40" />
                    </span>
                  </th>
                  <th
                    className="min-w-[160px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--warm-ink-muted)' }}
                  >
                    Contact
                  </th>
                  <th
                    className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--warm-ink-muted)' }}
                  >
                    Source
                  </th>
                  <th
                    className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--warm-ink-muted)' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Stage <ArrowUpDown className="h-3 w-3 opacity-40" />
                    </span>
                  </th>
                  <th
                    className="w-[100px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--warm-ink-muted)' }}
                  >
                    Priority
                  </th>
                  <th
                    className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--warm-ink-muted)' }}
                  >
                    Est. Fee
                  </th>
                  <th
                    className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--warm-ink-muted)' }}
                  >
                    Next Follow-up
                  </th>
                  <th
                    className="w-[80px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--warm-ink-muted)' }}
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
                      className="cursor-pointer table-row-preone border-b border-[var(--warm-divider)] hover:bg-[var(--warm-bg-soft)] transition-colors"
                      onClick={() => handleLeadClick(lead)}
                    >
                      {/* Parent / Child: Avatar + Names */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0 bg-[var(--warm-bg-soft)] text-[var(--warm-ink-soft)] border border-[var(--warm-border)]"
                          >
                            {getInitials(lead.parentName)}
                          </div>
                          <div className="min-w-0">
                            <div
                              className="truncate font-medium text-[var(--warm-ink)]"
                            >
                              {lead.parentName}
                            </div>
                            <div
                              className="text-xs text-[var(--warm-ink-muted)]"
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
                          className="flex items-center gap-1 whitespace-nowrap tabular-nums text-[var(--warm-ink-muted)]"
                        >
                          <Phone
                            className="h-3 w-3 text-[var(--warm-ink-faint)]"
                          />
                          {lead.parentPhone}
                        </div>
                        {lead.parentEmail && (
                          <div
                            className="flex items-center gap-1 whitespace-nowrap mt-0.5 text-[var(--warm-ink-muted)]"
                          >
                            <Mail className="h-3 w-3 text-[var(--warm-ink-faint)]" />
                            <span className="truncate max-w-[140px]">
                              {lead.parentEmail}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3">
                        <WarmSourcePill source={lead.source} />
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
                        style={{ color: 'var(--warm-ink)' }}
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
                                ? 'var(--warm-rose-ink)'
                                : isToday(followUpDate)
                                  ? 'var(--warm-honey-ink)'
                                  : isTomorrow(followUpDate)
                                    ? 'var(--warm-sky-ink)'
                                    : 'var(--warm-ink-muted)',
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
                          <span style={{ color: 'var(--warm-ink-faint)' }}>
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
                              color: 'var(--warm-ink-muted)',
                              background: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                'var(--warm-bg-soft)';
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
                              color: 'var(--warm-ink-muted)',
                              background: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                'var(--warm-bg-soft)';
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
            style={{ borderColor: 'var(--warm-border)' }}
          >
            <div className="flex items-center gap-4">
              <span
                className="text-xs"
                style={{ color: 'var(--warm-ink-muted)' }}
              >
                Showing {startRow} to {endRow} of {total} leads
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs"
                  style={{ color: 'var(--warm-ink-faint)' }}
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
                    background: 'var(--warm-surface)',
                    borderColor: 'var(--warm-border)',
                    color: 'var(--warm-ink)',
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
                  color: 'var(--warm-ink-muted)',
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
                    style={{ color: 'var(--warm-ink-muted)' }}
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
                            background: 'var(--warm-primary-soft)',
                            color: 'var(--warm-primary)',
                          }
                        : { color: 'var(--warm-ink-muted)' }
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
                  color: 'var(--warm-ink-muted)',
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
      </WarmCard>

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
    </WarmPremium>
  );
}
