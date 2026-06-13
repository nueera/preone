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
  Filter,
  Search,
  X,
  Eye,
  Phone,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { PageTransition } from '@/components/ui/page-transition';
import { AnimatedCard } from '@/components/ui/animated-card';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

// ── Cosmic Purple Theme Colors ──
const COSMIC_PURPLE = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',
  600: '#9333ea',
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87',
};

// ── Types ──
interface Visit {
  id: string;
  parentName: string;
  childName: string;
  childAge: string | null;
  parentPhone: string;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  assignedStaff: string | null;
  notes: string | null;
  leadId: string | null;
  createdAt: string;
}

// ── Status Config ──
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SCHEDULED: {
    label: 'Scheduled',
    color: COSMIC_PURPLE[600],
    bg: COSMIC_PURPLE[50],
    icon: <Clock className="h-4 w-4" style={{ color: COSMIC_PURPLE[600] }} />,
  },
  COMPLETED: {
    label: 'Completed',
    color: '#10b981',
    bg: '#ecfdf5',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#ef4444',
    bg: '#fef2f2',
    icon: <XCircle className="h-4 w-4 text-red-500" />,
  },
  NO_SHOW: {
    label: 'No Show',
    color: '#f59e0b',
    bg: '#fffbeb',
    icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
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
  const [leads, setLeads] = useState<Array<{ id: string; parentName: string; childName: string; phone: string }>>([]);
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

  // Reset on open
  useEffect(() => {
    if (open) {
      setError('');
      setForm({ leadId: '', parentName: '', childName: '', parentPhone: '', date: null, time: '10:00', assignedTo: '', notes: '' });
    }
  }, [open]);

  // Fetch leads for linking
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
            (data.leads || []).map((l: { id: string; parentName: string; childName: string; parentPhone: string }) => ({
              id: l.id,
              parentName: l.parentName,
              childName: l.childName,
              phone: l.parentPhone,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch leads:', err);
      }
    }
    fetchLeads();
  }, [open]);

  // Fetch staff
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
            (data.teachers || []).map((t: { id: string; firstName: string; lastName: string }) => ({
              id: t.id,
              name: `${t.firstName} ${t.lastName}`,
            }))
          );
        }
      } catch {}
    }
    fetchStaff();
  }, [open]);

  // Auto-fill from lead selection
  const handleLeadSelect = (leadId: string) => {
    if (leadId === 'NONE') {
      setForm((p) => ({ ...p, leadId: '', parentName: '', childName: '', parentPhone: '' }));
      return;
    }
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setForm((p) => ({
        ...p,
        leadId,
        parentName: lead.parentName,
        childName: lead.childName,
        parentPhone: lead.phone,
      }));
    }
  };

  const handleSubmit = async () => {
    setError('');
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
          parentPhone: form.parentPhone.trim(),
          date: form.date.toISOString(),
          time: form.time,
          assignedTo: form.assignedTo || undefined,
          notes: form.notes.trim() || undefined,
          status: 'SCHEDULED',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to schedule visit');
      }

      toast.success('Visit scheduled successfully');
      onOpenChange(false);
      onVisitCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule visit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" style={{ color: COSMIC_PURPLE[600] }} />
            Schedule Campus Visit
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Link to Lead (optional)</Label>
            <Select value={form.leadId || 'NONE'} onValueChange={handleLeadSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">No linked lead</SelectItem>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.parentName} — {l.childName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Parent Name *</Label>
              <Input
                value={form.parentName}
                onChange={(e) => setForm((p) => ({ ...p, parentName: e.target.value }))}
                placeholder="Parent name"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.parentPhone}
                onChange={(e) => setForm((p) => ({ ...p, parentPhone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div>
            <Label>Child Name</Label>
            <Input
              value={form.childName}
              onChange={(e) => setForm((p) => ({ ...p, childName: e.target.value }))}
              placeholder="Child name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Visit Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !form.date && 'text-muted-foreground')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {form.date ? format(form.date, 'dd MMM yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={form.date || undefined}
                    onSelect={(d) => setForm((p) => ({ ...p, date: d }))}
                    disabled={(d) => d < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Assign Staff</Label>
            <Select value={form.assignedTo || 'NONE'} onValueChange={(v) => setForm((p) => ({ ...p, assignedTo: v === 'NONE' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Unassigned</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any special instructions or notes..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex items-center justify-end mt-4 pt-4 border-t gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1 text-white border-0"
            style={{ background: `linear-gradient(135deg, ${COSMIC_PURPLE[600]}, ${COSMIC_PURPLE[400]})` }}
          >
            {submitting ? 'Scheduling...' : 'Schedule Visit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Campus Visits Scheduling Page — Manage campus visit appointments for prospective families.
 * Route: /admin/admissions/visits
 */
export default function CampusVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

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
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Mark visit as completed
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
    } catch {
      toast.error('Failed to update visit');
    }
  };

  // Cancel a visit
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
    } catch {
      toast.error('Failed to cancel visit');
    }
  };

  // Stats
  const totalVisits = visits.length;
  const scheduledToday = visits.filter((v) => v.status === 'SCHEDULED' && isToday(new Date(v.date))).length;
  const completedCount = visits.filter((v) => v.status === 'COMPLETED').length;
  const cancelledCount = visits.filter((v) => v.status === 'CANCELLED').length;

  // Filtered visits
  const filteredVisits = visits.filter((v) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        v.parentName.toLowerCase().includes(q) ||
        v.childName.toLowerCase().includes(q) ||
        v.parentPhone.includes(q);
      if (!matchesSearch) return false;
    }
    if (statusFilter && v.status !== statusFilter) return false;
    return true;
  });

  const hasActiveFilters = searchQuery || statusFilter || dateFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter('');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/admissions">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Admissions
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-6 w-6" style={{ color: COSMIC_PURPLE[600] }} />
                Campus Visits
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Schedule and manage campus visits for prospective families
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setLoading(true); fetchVisits(); }}
              className="gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              onClick={() => setScheduleOpen(true)}
              className="gap-1 text-white border-0"
              style={{ background: `linear-gradient(135deg, ${COSMIC_PURPLE[600]}, ${COSMIC_PURPLE[400]})` }}
            >
              <Plus className="h-4 w-4" />
              Schedule Visit
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedCard delay={0.05}>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: COSMIC_PURPLE[50] }}
                >
                  <CalendarCheck className="h-5 w-5" style={{ color: COSMIC_PURPLE[600] }} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-gray-900 leading-tight">{totalVisits}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Visits</p>
                </div>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.1}>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-amber-600 leading-tight">{scheduledToday}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Scheduled Today</p>
                </div>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.15}>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-emerald-600 leading-tight">{completedCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Completed</p>
                </div>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-red-500 leading-tight">{cancelledCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Cancelled</p>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* ── Search & Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by parent, child, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          )}
        </div>

        {/* ── Visits Table ── */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading visits...
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MapPin className="h-12 w-12 mb-3" style={{ color: COSMIC_PURPLE[200] }} />
              <p className="text-gray-500 font-medium">No visits found</p>
              <p className="text-sm text-gray-400 mt-1">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Schedule a campus visit to get started'}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => setScheduleOpen(true)}
                  className="mt-4 gap-1 text-white border-0"
                  style={{ background: `linear-gradient(135deg, ${COSMIC_PURPLE[600]}, ${COSMIC_PURPLE[400]})` }}
                >
                  <Plus className="h-4 w-4" />
                  Schedule Visit
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent Name</TableHead>
                  <TableHead>Child Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Staff</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.map((visit) => {
                  const statusCfg = STATUS_CONFIG[visit.status] || STATUS_CONFIG.SCHEDULED;
                  const visitDate = new Date(visit.date);
                  const isPastVisit = isPast(visitDate) && !isToday(visitDate);

                  return (
                    <TableRow
                      key={visit.id}
                      className={cn(
                        'cursor-pointer hover:bg-gray-50/80 transition-colors',
                        visit.status === 'CANCELLED' && 'opacity-60',
                        visit.status === 'COMPLETED' && 'opacity-70',
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: COSMIC_PURPLE[50],
                              color: COSMIC_PURPLE[600],
                            }}
                          >
                            {visit.parentName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{visit.parentName}</p>
                            {visit.parentPhone && (
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {visit.parentPhone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1.5">
                          <Baby className="h-3.5 w-3.5 text-gray-400" />
                          {visit.childName}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className={cn(
                            isToday(visitDate) && 'text-amber-600 font-medium',
                            isTomorrow(visitDate) && 'text-blue-600',
                            isPastVisit && visit.status === 'SCHEDULED' && 'text-red-600 font-medium',
                          )}>
                            {isToday(visitDate) ? 'Today' : isTomorrow(visitDate) ? 'Tomorrow' : format(visitDate, 'dd MMM yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {visit.time || '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusCfg.color }} />
                          {statusCfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {visit.assignedStaff ? (
                          <div className="flex items-center gap-1">
                            <UserCircle className="h-3.5 w-3.5 text-gray-400" />
                            {visit.assignedStaff}
                          </div>
                        ) : (
                          <span className="text-gray-300">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {visit.status === 'SCHEDULED' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleMarkCompleted(visit.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Complete
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleCancel(visit.id)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {visit.leadId && (
                            <Link href={`/admin/admissions/leads/${visit.leadId}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                style={{ color: COSMIC_PURPLE[600] }}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View Lead
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* ── Schedule Visit Dialog ── */}
        <ScheduleVisitDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          onVisitCreated={() => {
            toast.success('Visit scheduled');
            fetchVisits();
          }}
        />
      </div>
    </PageTransition>
  );
}
