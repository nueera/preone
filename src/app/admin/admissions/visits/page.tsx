'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  MapPin,
  UserCircle,
  Baby,
  Calendar,
  Search,
  X,
  Eye,
  Phone,
  Users,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types ──
interface Visit {
  id: string;
  leadId: string | null;
  parentName: string;
  childName: string;
  parentPhone: string | null;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes: string | null;
  assignedTo: string | null;
  assignee: { id: string; name: string } | null;
  createdAt: string;
}

// ── Constants ──
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  SCHEDULED: {
    label: 'Scheduled',
    color: 'var(--admin-primary)',
    bg: 'var(--admin-primary-soft)',
    icon: <Calendar className="h-3.5 w-3.5" />,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'var(--admin-success)',
    bg: 'var(--admin-success-soft)',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'var(--admin-error)',
    bg: 'rgba(239,68,68,0.1)',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  NO_SHOW: {
    label: 'No Show',
    color: 'var(--admin-warning)',
    bg: 'var(--admin-warning-soft)',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Schedule Visit Dialog ──
function ScheduleVisitDialog({
  open,
  onOpenChange,
  onVisitCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVisitCreated: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<
    Array<{ id: string; parentName: string; childName: string; phone: string }>
  >([]);
  const [staff, setStaff] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    leadId: '',
    parentName: '',
    childName: '',
    parentPhone: '',
    date: null as Date | null,
    time: '10:00',
    assignedTo: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        leadId: '',
        parentName: '',
        childName: '',
        parentPhone: '',
        date: null,
        time: '10:00',
        assignedTo: '',
        notes: '',
      });
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    async function fetchLeads() {
      try {
        const token = getToken();
        const res = await fetch('/api/crm/leads?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLeads(
            (data.leads || []).map(
              (l: {
                id: string;
                parentName: string;
                childName: string;
                parentPhone: string;
              }) => ({
                id: l.id,
                parentName: l.parentName,
                childName: l.childName,
                phone: l.parentPhone,
              }),
            ),
          );
        }
      } catch (err) {
        console.error('Failed to fetch leads:', err);
      }
    }
    fetchLeads();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    async function fetchStaff() {
      try {
        const token = getToken();
        const res = await fetch('/api/teachers?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStaff(
            (data.teachers || []).map(
              (t: { id: string; firstName: string; lastName: string }) => ({
                id: t.id,
                name: `${t.firstName} ${t.lastName}`,
              }),
            ),
          );
        }
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      }
    }
    fetchStaff();
  }, [open]);

  const handleLeadSelect = (leadId: string) => {
    if (leadId === 'NONE') {
      setForm((p) => ({
        ...p,
        leadId: '',
        parentName: '',
        childName: '',
        parentPhone: '',
      }));
    } else {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        setForm((p) => ({
          ...p,
          leadId: lead.id,
          parentName: lead.parentName,
          childName: lead.childName,
          parentPhone: lead.phone,
        }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.parentName.trim()) {
      setError('Parent name is required');
      return;
    }
    if (!form.date) {
      setError('Visit date is required');
      return;
    }
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch('/api/crm/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadId: form.leadId || undefined,
          parentName: form.parentName.trim(),
          childName: form.childName.trim(),
          parentPhone: form.parentPhone.trim() || undefined,
          date: form.date.toISOString(),
          time: form.time,
          assignedTo: form.assignedTo || undefined,
          notes: form.notes.trim() || undefined,
          status: 'SCHEDULED',
        }),
      });
      if (res.ok) {
        toast.success('Visit scheduled successfully');
        onOpenChange(false);
        onVisitCreated();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to schedule visit');
      }
    } catch (err) {
      console.error('Failed to schedule visit:', err);
      setError('Failed to schedule visit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: 'var(--admin-text)' }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'var(--admin-warning-soft)' }}
            >
              <CalendarCheck
                className="h-4 w-4"
                style={{ color: 'var(--admin-warning)' }}
              />
            </div>
            Schedule Campus Visit
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div
            className="rounded-lg p-3 text-sm flex items-center gap-2"
            style={{
              background: 'rgba(239,68,68,0.08)',
              color: 'var(--admin-error)',
            }}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Select Lead (optional)</Label>
            <Select value={form.leadId || 'NONE'} onValueChange={handleLeadSelect}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Walk-in (no linked lead)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Walk-in (no linked lead)</SelectItem>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.parentName} — {l.childName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px]" style={{ color: 'var(--admin-text-subtle)' }}>
              Selecting a lead auto-fills parent &amp; child details.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Parent Name <span style={{ color: 'var(--admin-error)' }}>*</span>
              </Label>
              <Input
                value={form.parentName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, parentName: e.target.value }))
                }
                placeholder="Parent name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Child Name</Label>
              <Input
                value={form.childName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, childName: e.target.value }))
                }
                placeholder="Child name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Parent Phone</Label>
            <Input
              value={form.parentPhone}
              onChange={(e) =>
                setForm((p) => ({ ...p, parentPhone: e.target.value }))
              }
              placeholder="10-digit phone"
              maxLength={10}
              className="tabular-nums"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Date <span style={{ color: 'var(--admin-error)' }}>*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full h-9 text-sm justify-start text-left font-normal',
                      !form.date && 'text-muted-foreground',
                    )}
                  >
                    <Calendar className="mr-2 h-3.5 w-3.5" />
                    {form.date ? format(form.date, 'dd MMM yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={form.date || undefined}
                    onSelect={(d) => setForm((p) => ({ ...p, date: d ?? null }))}
                    disabled={(d) => d < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                className="h-9 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Assigned Staff</Label>
            <Select
              value={form.assignedTo || 'NONE'}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, assignedTo: v === 'NONE' ? '' : v }))
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Unassigned</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any special requests or context for this visit..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Schedule Visit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Stat Card ──
function StatCard({
  label,
  value,
  icon: Icon,
  accentVar,
  accentSoftVar,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accentVar: string;
  accentSoftVar: string;
}) {
  return (
    <PreOneCard className="!rounded-xl">
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
            style={{ color: 'var(--admin-text-muted)' }}
          >
            {label}
          </div>
          <div
            className="text-xl font-bold tabular-nums"
            style={{ color: 'var(--admin-text)' }}
          >
            {value}
          </div>
        </div>
      </div>
    </PreOneCard>
  );
}

/**
 * Campus Visits page — Schedule and manage campus visits for prospective families.
 */
export default function CampusVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchVisits = useCallback(async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (dateFilter) params.set('date', dateFilter);
      const res = await fetch(`/api/crm/visits?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVisits(data.visits || []);
      }
    } catch (err) {
      console.error('Failed to fetch visits:', err);
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleMarkCompleted = async (visitId: string) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/visits/${visitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (res.ok) {
        toast.success('Visit marked as completed');
        fetchVisits();
      } else {
        toast.error('Failed to update visit');
      }
    } catch (err) {
      console.error('Failed to mark visit complete:', err);
      toast.error('Failed to update visit');
    }
  };

  const handleCancel = async (visitId: string) => {
    if (!confirm('Cancel this campus visit?')) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/visits/${visitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        toast.success('Visit cancelled');
        fetchVisits();
      } else {
        toast.error('Failed to cancel visit');
      }
    } catch (err) {
      console.error('Failed to cancel visit:', err);
      toast.error('Failed to cancel visit');
    }
  };

  const hasActiveFilters = searchQuery || statusFilter || dateFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter('');
  };

  // Filter by search query (client-side)
  const filteredVisits = visits.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.parentName.toLowerCase().includes(q) ||
      v.childName.toLowerCase().includes(q) ||
      (v.parentPhone && v.parentPhone.includes(q))
    );
  });

  // Stats
  const totalVisits = visits.length;
  const scheduledToday = visits.filter(
    (v) => v.status === 'SCHEDULED' && isToday(new Date(v.date)),
  ).length;
  const completedVisits = visits.filter((v) => v.status === 'COMPLETED').length;
  const cancelledVisits = visits.filter((v) => v.status === 'CANCELLED').length;

  return (
    <PageTransition>
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
                style={{ background: 'var(--admin-warning-soft)' }}
              >
                <CalendarCheck
                  className="h-5 w-5"
                  style={{ color: 'var(--admin-warning)' }}
                />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: 'var(--admin-text)' }}
                >
                  Campus Visits
                </h1>
                <p
                  className="text-sm"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Schedule and manage campus visits for prospective families
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                setLoading(true);
                fetchVisits();
                toast.success('Refreshed');
              }}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
              onClick={() => setScheduleOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule Visit</span>
            </Button>
          </div>
        </div>

        {/* ── SECTION 2: STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Visits"
            value={totalVisits}
            icon={CalendarCheck}
            accentVar="--admin-primary"
            accentSoftVar="--admin-primary-soft"
          />
          <StatCard
            label="Scheduled Today"
            value={scheduledToday}
            icon={Clock}
            accentVar="--admin-warning"
            accentSoftVar="--admin-warning-soft"
          />
          <StatCard
            label="Completed"
            value={completedVisits}
            icon={CheckCircle2}
            accentVar="--admin-success"
            accentSoftVar="--admin-success-soft"
          />
          <StatCard
            label="Cancelled"
            value={cancelledVisits}
            icon={XCircle}
            accentVar="--admin-error"
            accentSoftVar="rgba(239,68,68,0.1)"
          />
        </div>

        {/* ── SECTION 3: FILTER BAR ── */}
        <PreOneCard className="!rounded-xl">
          <div className="p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--admin-text-subtle)' }}
              />
              <input
                type="text"
                placeholder="Search by parent, child or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--admin-text-subtle)' }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select
              value={statusFilter || 'ALL'}
              onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
        </PreOneCard>

        {/* ── SECTION 4: VISITS TABLE ── */}
        <PreOneCard className="!rounded-xl overflow-hidden">
          {/* Stats bar */}
          <div
            className="flex items-center justify-between border-b px-5 py-3"
            style={{ borderColor: 'var(--admin-border)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-sm"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Total Visits
              </span>
              <span
                className="rounded-md px-2 py-0.5 text-sm font-bold tabular-nums"
                style={{
                  background: 'var(--admin-primary-soft)',
                  color: 'var(--admin-primary)',
                }}
              >
                {filteredVisits.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div
              className="flex items-center justify-center h-48 text-sm"
              style={{ color: 'var(--admin-text-subtle)' }}
            >
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading visits...
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarCheck
                className="h-10 w-10 mb-3 opacity-40"
                style={{ color: 'var(--admin-text-muted)' }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {hasActiveFilters
                  ? 'No visits match your filters'
                  : 'No visits scheduled yet'}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--admin-text-subtle)' }}
              >
                {hasActiveFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Schedule a campus visit for a prospective family.'}
              </p>
              {!hasActiveFilters && (
                <Button
                  size="sm"
                  className="mt-4 gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                  onClick={() => setScheduleOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Schedule Visit
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className="border-b"
                    style={{ borderColor: 'var(--admin-border)' }}
                  >
                    <th
                      className="min-w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Parent / Child
                    </th>
                    <th
                      className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Date
                    </th>
                    <th
                      className="w-[80px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Time
                    </th>
                    <th
                      className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Status
                    </th>
                    <th
                      className="w-[150px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Assigned Staff
                    </th>
                    <th
                      className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit) => {
                    const statusCfg = STATUS_CONFIG[visit.status];
                    const visitDate = new Date(visit.date);
                    const isTodayVisit = isToday(visitDate);
                    const isTomorrowVisit = isTomorrow(visitDate);
                    const isPastVisit = isPast(visitDate) && !isTodayVisit;
                    const isScheduled = visit.status === 'SCHEDULED';

                    const dateColor = !isScheduled
                      ? 'var(--admin-text-subtle)'
                      : isPastVisit
                        ? 'var(--admin-error)'
                        : isTodayVisit
                          ? 'var(--admin-warning)'
                          : isTomorrowVisit
                            ? 'var(--admin-info)'
                            : 'var(--admin-text)';

                    const rowOpacity =
                      visit.status === 'CANCELLED'
                        ? 0.6
                        : visit.status === 'COMPLETED'
                          ? 0.7
                          : 1;

                    const parentInitial = visit.parentName[0]?.toUpperCase() || '?';

                    return (
                      <tr
                        key={visit.id}
                        className="border-b transition-colors hover:bg-[var(--admin-surface-2)]"
                        style={{
                          borderColor: 'var(--admin-border)',
                          opacity: rowOpacity,
                        }}
                      >
                        {/* Parent / Child */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
                              style={{
                                background: statusCfg.bg,
                                color: statusCfg.color,
                              }}
                            >
                              {parentInitial}
                            </div>
                            <div className="min-w-0">
                              <div
                                className="truncate font-medium"
                                style={{ color: 'var(--admin-text)' }}
                              >
                                {visit.parentName}
                              </div>
                              <div
                                className="text-xs flex items-center gap-1"
                                style={{ color: 'var(--admin-text-subtle)' }}
                              >
                                <Baby className="h-3 w-3" />
                                {visit.childName || '—'}
                                {visit.parentPhone && (
                                  <>
                                    <span className="mx-1">·</span>
                                    <Phone className="h-3 w-3" />
                                    <span className="tabular-nums">
                                      {visit.parentPhone}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-xs">
                          <span
                            className="flex items-center gap-1 whitespace-nowrap font-medium tabular-nums"
                            style={{ color: dateColor }}
                          >
                            <Calendar className="h-3 w-3" />
                            {isTodayVisit
                              ? 'Today'
                              : isTomorrowVisit
                                ? 'Tomorrow'
                                : format(visitDate, 'dd MMM yyyy')}
                          </span>
                          {isPastVisit && isScheduled && (
                            <span
                              className="block text-[10px] mt-0.5"
                              style={{ color: 'var(--admin-error)' }}
                            >
                              Past due
                            </span>
                          )}
                        </td>

                        {/* Time */}
                        <td
                          className="px-4 py-3 text-xs tabular-nums"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          {visit.time}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              background: statusCfg.bg,
                              color: statusCfg.color,
                            }}
                          >
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Assigned Staff */}
                        <td className="px-4 py-3 text-xs">
                          {visit.assignee ? (
                            <span
                              className="flex items-center gap-1.5"
                              style={{ color: 'var(--admin-text)' }}
                            >
                              <UserCircle
                                className="h-3.5 w-3.5"
                                style={{ color: 'var(--admin-text-subtle)' }}
                              />
                              {visit.assignee.name}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--admin-text-subtle)' }}>
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {isScheduled && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  style={{
                                    color: 'var(--admin-success)',
                                    borderColor: 'var(--admin-success)',
                                  }}
                                  onClick={() => handleMarkCompleted(visit.id)}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Complete
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  style={{ color: 'var(--admin-error)' }}
                                  onClick={() => handleCancel(visit.id)}
                                >
                                  <XCircle className="h-3 w-3" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {visit.leadId && (
                              <Link
                                href={`/admin/admissions/leads/${visit.leadId}`}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  style={{ color: 'var(--admin-primary)' }}
                                >
                                  <Eye className="h-3 w-3" />
                                  View Lead
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PreOneCard>

        {/* ── Schedule Visit Dialog ── */}
        <ScheduleVisitDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          onVisitCreated={() => {
            setLoading(true);
            fetchVisits();
          }}
        />
      </div>
    </PageTransition>
  );
}
