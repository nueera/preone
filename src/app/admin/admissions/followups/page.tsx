'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  UserCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Eye,
  FileText,
  ChevronRight,
  PhoneCall,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PreOneCard } from '@/components/ui/preone-card';
import { CRM_COLORS } from '@/lib/theme-tokens';
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

// ── Types ──
interface LeadInfo {
  id: string;
  parentName: string;
  childName: string;
  stage: string;
  nextFollowUp: string | null;
}

interface FollowUpItem {
  id: string;
  type: string;
  dateTime: string;
  outcome: string;
  notes: string;
  createdBy: string | null;
  completedAt: string | null;
  lead: LeadInfo;
}

// ── Constants ──
const STAGE_CONFIG: Record<string, { label: string; color: string; softVar: string; varColor: string }> = {
  NEW: {
    label: 'New',
    color: CRM_COLORS.NEW?.hex ?? '#3b82f6',
    softVar: 'var(--warm-bg-soft)',
    varColor: 'var(--warm-ink-muted)',
  },
  CONTACTED: {
    label: 'Contacted',
    color: CRM_COLORS.CONTACTED?.hex ?? '#8b5cf6',
    softVar: 'var(--warm-sky-soft)',
    varColor: 'var(--warm-sky-ink)',
  },
  VISITED: {
    label: 'Visited',
    color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#f59e0b',
    softVar: 'var(--warm-primary-soft)',
    varColor: 'var(--warm-primary)',
  },
  APPLIED: {
    label: 'Applied',
    color: CRM_COLORS.APPLICATION?.hex ?? '#f97316',
    softVar: 'var(--warm-honey-soft)',
    varColor: 'var(--warm-honey-ink)',
  },
  ENROLLED: {
    label: 'Enrolled',
    color: CRM_COLORS.ENROLLED?.hex ?? '#10b981',
    softVar: 'var(--warm-sage-soft)',
    varColor: 'var(--warm-sage)',
  },
  LOST: {
    label: 'Lost',
    color: CRM_COLORS.LOST?.hex ?? '#9ca3af',
    softVar: 'rgba(239,68,68,0.1)',
    varColor: 'var(--warm-rose-ink)',
  },
};

const FILTER_PILLS = [
  { key: 'all', label: 'All', color: 'var(--warm-primary)', bg: 'var(--warm-primary-soft)' },
  { key: 'pending', label: 'Pending', color: 'var(--warm-sky-ink)', bg: 'var(--warm-sky-soft)' },
  { key: 'overdue', label: 'Overdue', color: 'var(--warm-rose-ink)', bg: 'rgba(239,68,68,0.1)' },
  { key: 'completed', label: 'Completed', color: 'var(--warm-sage)', bg: 'var(--warm-sage-soft)' },
];

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Types' },
  { value: 'Call', label: 'Call' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Email', label: 'Email' },
  { value: 'Visit', label: 'Visit' },
  { value: 'Note', label: 'Note' },
];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Follow-up Type Icon ──
function FollowUpTypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'Call':
      return <Phone className={className ?? 'h-4 w-4'} style={{ color: 'var(--warm-sky-ink)' }} />;
    case 'WhatsApp':
      return <MessageSquare className={className ?? 'h-4 w-4'} style={{ color: 'var(--warm-sage)' }} />;
    case 'Email':
      return <Mail className={className ?? 'h-4 w-4'} style={{ color: 'var(--warm-honey-ink)' }} />;
    case 'Visit':
      return <Eye className={className ?? 'h-4 w-4'} style={{ color: 'var(--warm-primary)' }} />;
    default:
      return <FileText className={className ?? 'h-4 w-4'} style={{ color: 'var(--warm-ink-muted)' }} />;
  }
}

// ── Filter Pill ──
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
    <WarmPremium className="min-h-screen">
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
    </WarmPremium>
  );
}

// ── Stat Card ──
function StatCard({
  label,
  value,
  icon: Icon,
  accentVar,
  accentSoftVar,
  sublabel,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accentVar: string;
  accentSoftVar: string;
  sublabel?: string;
}) {
  return (
    <WarmCard fade>
      <div className="p-4 flex items-center gap-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: `var(${accentSoftVar})` }}
        >
          <Icon className="h-5 w-5" style={{ color: `var(${accentVar})` }} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-xs font-medium"
            style={{ color: 'var(--warm-ink-muted)' }}
          >
            {label}
          </div>
          <div
            className="text-xl font-bold tabular-nums"
            style={{ color: 'var(--warm-ink)' }}
          >
            {value}
          </div>
          {sublabel && (
            <div
              className="text-[11px] mt-0.5"
              style={{ color: 'var(--warm-ink-faint)' }}
            >
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </WarmCard>
  );
}

/**
 * CRM Follow-ups page — Queue of scheduled follow-ups with quick complete action.
 */
export default function CrmFollowupsPage() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [completing, setCompleting] = useState<string | null>(null);
  const [upcomingLeads, setUpcomingLeads] = useState<LeadInfo[]>([]);

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/crm/followups?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps || []);
      }
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err);
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter]);

  const fetchUpcomingLeads = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/crm/leads?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.leads || [])
          .filter(
            (l: LeadInfo) =>
              l.nextFollowUp && l.stage !== 'ENROLLED' && l.stage !== 'LOST',
          )
          .sort(
            (a: LeadInfo, b: LeadInfo) =>
              new Date(a.nextFollowUp!).getTime() -
              new Date(b.nextFollowUp!).getTime(),
          )
          .slice(0, 15);
        setUpcomingLeads(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch upcoming leads:', err);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  useEffect(() => {
    fetchUpcomingLeads();
  }, [fetchUpcomingLeads]);

  const handleComplete = async (followUpId: string, outcome?: string) => {
    setCompleting(followUpId);
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/followups/${followUpId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ outcome: outcome || 'Completed' }),
      });
      if (res.ok) {
        toast.success('Follow-up marked complete');
        fetchFollowUps();
        fetchUpcomingLeads();
      } else {
        toast.error('Failed to complete follow-up');
      }
    } catch (err) {
      console.error('Failed to complete follow-up:', err);
      toast.error('Failed to complete follow-up');
    } finally {
      setCompleting(null);
    }
  };

  // Stats
  const now = new Date();
  const pendingCount = followUps.filter(
    (fu) => !fu.completedAt && new Date(fu.dateTime) >= now,
  ).length;
  const overdueCount = followUps.filter(
    (fu) =>
      !fu.completedAt &&
      isPast(new Date(fu.dateTime)) &&
      !isToday(new Date(fu.dateTime)),
  ).length;
  const completedCount = followUps.filter((fu) => fu.completedAt).length;
  const todayCount = upcomingLeads.filter(
    (l) => l.nextFollowUp && isToday(new Date(l.nextFollowUp)),
  ).length;

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
              style={{ background: 'var(--warm-sage-soft)' }}
            >
              <PhoneCall
                className="h-5 w-5"
                style={{ color: 'var(--warm-sage)' }}
              />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--warm-ink)' }}
              >
                Follow-up Queue
              </h1>
              <p className="text-sm" style={{ color: 'var(--warm-ink-muted)' }}>
                Track scheduled calls, messages, and visits
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            fetchFollowUps();
            fetchUpcomingLeads();
            toast.success('Refreshed');
          }}
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* ── SECTION 2: STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Due Today"
          value={todayCount}
          icon={Clock}
          accentVar="--admin-warning"
          accentSoftVar="--admin-warning-soft"
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          icon={PhoneCall}
          accentVar="--admin-info"
          accentSoftVar="--admin-info-soft"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          accentVar="--admin-error"
          accentSoftVar="rgba(239,68,68,0.1)"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={CheckCircle2}
          accentVar="--admin-success"
          accentSoftVar="--admin-success-soft"
        />
      </div>

      {/* ── SECTION 3: FILTER BAR ── */}
      <WarmCard fade>
        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_PILLS.map((pill) => {
              const count =
                pill.key === 'all'
                  ? followUps.length
                  : pill.key === 'pending'
                    ? pendingCount
                    : pill.key === 'overdue'
                      ? overdueCount
                      : completedCount;
              return (
                <FilterPill
                  key={pill.key}
                  label={pill.label}
                  count={count}
                  active={filter === pill.key}
                  activeColor={pill.color}
                  activeBg={pill.bg}
                  onClick={() => setFilter(pill.key as typeof filter)}
                />
              );
            })}
          </div>
          <Select
            value={typeFilter || 'ALL'}
            onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </WarmCard>

      {/* ── SECTION 4: TWO-COLUMN LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main: Follow-up list */}
        <WarmCard className="lg:col-span-2 overflow-hidden" fade>
          <div
            className="border-b px-5 py-3 flex items-center justify-between"
            style={{ borderColor: 'var(--warm-border)' }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--warm-ink)' }}
            >
              Follow-ups ({followUps.length})
            </h3>
          </div>

          {loading ? (
            <div
              className="flex items-center justify-center h-48 text-sm"
              style={{ color: 'var(--warm-ink-faint)' }}
            >
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading follow-ups...
            </div>
          ) : followUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PhoneCall
                className="h-10 w-10 mb-3 opacity-40"
                style={{ color: 'var(--warm-ink-muted)' }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--warm-ink-muted)' }}
              >
                No follow-ups in this view
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--warm-ink-faint)' }}
              >
                Try a different filter or schedule a new follow-up from a lead.
              </p>
            </div>
          ) : (
            <div
              className="divide-y"
              style={{ borderColor: 'var(--warm-border)' }}
            >
              {followUps.map((fu) => {
                const fuDate = new Date(fu.dateTime);
                const isCompleted = !!fu.completedAt;
                const isOverdue =
                  !isCompleted &&
                  isPast(fuDate) &&
                  !isToday(fuDate);
                const isTodayFU = isToday(fuDate);
                const isTomorrowFU = isTomorrow(fuDate);

                const borderColor = isCompleted
                  ? 'var(--warm-sage)'
                  : isOverdue
                    ? 'var(--warm-rose-ink)'
                    : isTodayFU
                      ? 'var(--warm-honey-ink)'
                      : 'var(--warm-sky-ink)';

                const stageCfg = STAGE_CONFIG[fu.lead.stage] || STAGE_CONFIG.NEW;

                return (
                  <div
                    key={fu.id}
                    className="flex items-start gap-3 px-5 py-3.5 border-l-4 transition-colors hover:bg-[var(--warm-bg-soft)]"
                    style={{ borderColor }}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{
                            background: 'var(--warm-sage-soft)',
                          }}
                        >
                          <CheckCircle2
                            className="h-4 w-4"
                            style={{ color: 'var(--warm-sage)' }}
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ background: 'var(--warm-bg-soft)' }}
                        >
                          <FollowUpTypeIcon type={fu.type} />
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/admissions/leads/${fu.lead.id}`}
                          className="text-sm font-medium hover:underline"
                          style={{ color: 'var(--warm-ink)' }}
                        >
                          {fu.lead.parentName}
                        </Link>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--warm-ink-faint)' }}
                        >
                          · {fu.lead.childName}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            background: stageCfg.softVar,
                            color: stageCfg.varColor,
                          }}
                        >
                          {stageCfg.label}
                        </span>
                        <Badge
                          className="text-[10px] h-5 font-medium"
                          style={{
                            background: 'var(--warm-bg-soft)',
                            color: 'var(--warm-ink-muted)',
                            border: 'none',
                          }}
                        >
                          {fu.type}
                        </Badge>
                      </div>

                      {fu.notes && (
                        <p
                          className="text-xs mt-1 line-clamp-2"
                          style={{ color: 'var(--warm-ink-muted)' }}
                        >
                          {fu.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span
                          className="text-[11px] flex items-center gap-1 tabular-nums"
                          style={{
                            color: isOverdue
                              ? 'var(--warm-rose-ink)'
                              : isTodayFU
                                ? 'var(--warm-honey-ink)'
                                : isTomorrowFU
                                  ? 'var(--warm-sky-ink)'
                                  : 'var(--warm-ink-faint)',
                            fontWeight: isOverdue || isTodayFU ? 600 : 400,
                          }}
                        >
                          <Calendar className="h-3 w-3" />
                          {isTodayFU
                            ? 'Today'
                            : isTomorrowFU
                              ? 'Tomorrow'
                              : format(fuDate, 'dd MMM yyyy, hh:mm a')}
                        </span>

                        {isOverdue && !isCompleted && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              color: 'var(--warm-rose-ink)',
                            }}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Overdue
                          </span>
                        )}

                        {isCompleted && fu.outcome && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              background: 'var(--warm-sage-soft)',
                              color: 'var(--warm-sage)',
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {fu.outcome}
                          </span>
                        )}

                        {fu.createdBy && (
                          <span
                            className="text-[11px]"
                            style={{ color: 'var(--warm-ink-faint)' }}
                          >
                            by {fu.createdBy}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 flex-shrink-0"
                        onClick={() => handleComplete(fu.id)}
                        disabled={completing === fu.id}
                      >
                        {completing === fu.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Complete
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </WarmCard>

        {/* Sidebar: Upcoming Follow-ups */}
        <WarmCard className="overflow-hidden" fade>
          <div
            className="border-b px-5 py-3 flex items-center gap-2"
            style={{ borderColor: 'var(--warm-border)' }}
          >
            <CalendarClock
              className="h-4 w-4"
              style={{ color: 'var(--warm-ink-muted)' }}
            />
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--warm-ink)' }}
            >
              Upcoming Follow-ups
            </h3>
          </div>

          {upcomingLeads.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <CalendarClock
                className="h-8 w-8 mb-2 opacity-40"
                style={{ color: 'var(--warm-ink-muted)' }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--warm-ink-muted)' }}
              >
                Nothing scheduled
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--warm-ink-faint)' }}
              >
                Schedule follow-ups from lead detail pages.
              </p>
            </div>
          ) : (
            <div
              className="divide-y"
              style={{ borderColor: 'var(--warm-border)' }}
            >
              {upcomingLeads.map((lead) => {
                const fuDate = new Date(lead.nextFollowUp!);
                const isTodayFU = isToday(fuDate);
                const isOverdue =
                  isPast(fuDate) && !isTodayFU;
                const stageCfg = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.NEW;

                return (
                  <Link
                    key={lead.id}
                    href={`/admin/admissions/leads/${lead.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--warm-bg-soft)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="truncate text-sm font-medium"
                        style={{ color: 'var(--warm-ink)' }}
                      >
                        {lead.parentName}
                      </div>
                      <div
                        className="truncate text-xs flex items-center gap-1.5"
                        style={{ color: 'var(--warm-ink-faint)' }}
                      >
                        <Calendar
                          className="h-3 w-3"
                          style={{
                            color: isOverdue
                              ? 'var(--warm-rose-ink)'
                              : isTodayFU
                                ? 'var(--warm-honey-ink)'
                                : 'var(--warm-ink-faint)',
                          }}
                        />
                        <span
                          className="tabular-nums"
                          style={{
                            color: isOverdue
                              ? 'var(--warm-rose-ink)'
                              : isTodayFU
                                ? 'var(--warm-honey-ink)'
                                : 'var(--warm-ink-faint)',
                            fontWeight: isOverdue || isTodayFU ? 600 : 400,
                          }}
                        >
                          {isTodayFU
                            ? 'Today'
                            : isTomorrow(fuDate)
                              ? 'Tomorrow'
                              : format(fuDate, 'dd MMM')}
                        </span>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0"
                      style={{ background: stageCfg.softVar, color: stageCfg.varColor }}
                    >
                      {stageCfg.label}
                    </span>
                    <ChevronRight
                      className="h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: 'var(--warm-ink-faint)' }}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  );
}
